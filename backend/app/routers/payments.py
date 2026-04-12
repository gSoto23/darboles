import os
import base64
import httpx
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.gift import Gift
from app.models.tree import TreeSpecies
from datetime import datetime

router = APIRouter()

from fastapi.responses import RedirectResponse, HTMLResponse
from app.services.tilopay import create_payment_link


class GiftItem(BaseModel):
    tree_id: int
    quantity: int
    recipient_name: str
    recipient_last_name: str
    recipient_email: EmailStr
    recipient_whatsapp: str
    recipient_address: Optional[str] = None
    message: str
    send_date: Optional[str] = None
    shipping_cost_applied: float = 0.0

class CartCheckoutRequest(BaseModel):
    buyer_name: str
    buyer_last_name: str
    buyer_email: EmailStr
    buyer_whatsapp: str
    invoice_requested: bool = False
    invoice_name: Optional[str] = None
    invoice_id_number: Optional[str] = None
    invoice_address: Optional[str] = None
    invoice_activity_code: Optional[str] = None
    payment_method: str # 'sinpe' or 'card'
    payment_receipt_method: Optional[str] = None
    total_amount_crc: float
    gifts: list[GiftItem]

@router.post("/checkout/gift")
async def create_gift_checkout(data: CartCheckoutRequest, db: Session = Depends(get_db)):
    # 1. Persist to DB immediately as pending
    temp_ref = f"LOCAL-{os.urandom(4).hex()}" if data.payment_method == 'sinpe' else f"CARD-{os.urandom(4).hex()}"
    
    for item in data.gifts:
        db_tree = db.query(TreeSpecies).filter(TreeSpecies.id == item.tree_id).first()
        if not db_tree or not db_tree.is_active:
            raise HTTPException(status_code=400, detail=f"El árbol {db_tree.name if db_tree else item.tree_id} ya no está disponible.")
        if db_tree.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {db_tree.name}. Solicitados: {item.quantity}, Disponibles: {db_tree.stock}")
        
        db_tree.stock -= item.quantity

        send_date_obj = None
        if item.send_date:
            try:
                send_date_obj = datetime.strptime(item.send_date, "%Y-%m-%d").date()
            except ValueError:
                pass
                
        new_gift = Gift(
             buyer_name=data.buyer_name,
             buyer_last_name=data.buyer_last_name,
             buyer_email=data.buyer_email,
             buyer_whatsapp=data.buyer_whatsapp,
             invoice_requested=data.invoice_requested,
             invoice_name=data.invoice_name,
             invoice_id_number=data.invoice_id_number,
             invoice_address=data.invoice_address,
             invoice_activity_code=data.invoice_activity_code,
             tree_id=item.tree_id,
             quantity=item.quantity,
             recipient_name=item.recipient_name,
             recipient_last_name=item.recipient_last_name,
             recipient_email=item.recipient_email,
             recipient_whatsapp=item.recipient_whatsapp,
             recipient_address=item.recipient_address,
             message=item.message,
             send_date=send_date_obj,
             status="pending",
             transaction_ref=temp_ref,
             shipping_cost_applied=item.shipping_cost_applied,
             payment_receipt_method=data.payment_receipt_method
        )
        db.add(new_gift)
    
    db.commit()

    if data.payment_method == 'sinpe':
        # Simulate local success for SINPE verification
        return {"status": "pending_verification", "checkout_url": None, "transaction_ref": temp_ref}
    
    # Process Card Payment with Tilopay
    try:
        redirect_url = create_payment_link(
            txn_ref=temp_ref,
            target_amount_crc=data.total_amount_crc,
            buyer_first_name=data.buyer_name,
            buyer_last_name=data.buyer_last_name,
            buyer_email=data.buyer_email
        )
        return {"checkout_url": redirect_url, "transaction_ref": temp_ref}
    except Exception as e:
        print(f"Error calling Tilopay: {e}")
        # Could return an error page url, but let frontend handle HTTP errors
        raise HTTPException(status_code=500, detail="Error de pasarela")

@router.get("/tilopay-callback")
async def tilopay_callback(
    txn_ref: str,
    code: Optional[str] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    gifts = db.query(Gift).filter(Gift.transaction_ref == txn_ref).all()
    
    # Tilopay success code is "1"
    if code == "1":
        for gift in gifts:
            gift.status = "paid"
        db.commit()
    else:
        # User cancelled or payment failed
        # Could mark as 'failed' or leave as 'pending'
        for gift in gifts:
            gift.status = "failed"
        db.commit()
        
        
    dashboard_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/dashboard?payment_success=true"
    
    return RedirectResponse(url=dashboard_url)

@router.post("/checkout/upload-receipt/{txn_ref}")
async def upload_receipt(txn_ref: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    gifts = db.query(Gift).filter(Gift.transaction_ref == txn_ref).all()
    for gift in gifts:
        gift.payment_receipt_url = f"/api/uploads/{file.filename}"
    db.commit()
    
    return {"status": "success", "receipt_url": f"/api/uploads/{file.filename}"}

