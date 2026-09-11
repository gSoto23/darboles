import os
import base64
import uuid
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
    # El formulario actual no pide apellido/whatsapp del comprador (solo del
    # destinatario); el modelo de datos ya los declara opcionales (nullable=True).
    buyer_last_name: Optional[str] = None
    buyer_email: EmailStr
    buyer_whatsapp: Optional[str] = None
    invoice_requested: bool = False
    invoice_name: Optional[str] = None
    invoice_id_number: Optional[str] = None
    invoice_address: Optional[str] = None
    invoice_activity_code: Optional[str] = None
    payment_method: str # 'sinpe' or 'card'
    payment_receipt_method: Optional[str] = None
    # Recibido solo como referencia para el front (ej. mostrarlo al usuario);
    # el monto real que se cobra siempre se recalcula en el servidor abajo.
    total_amount_crc: Optional[float] = None
    gifts: list[GiftItem]

@router.post("/checkout/gift")
async def create_gift_checkout(data: CartCheckoutRequest, db: Session = Depends(get_db)):
    if data.payment_method not in ("sinpe", "card"):
        raise HTTPException(status_code=400, detail="Método de pago inválido")
    if not data.gifts:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    # 1. Persist to DB immediately as pending
    temp_ref = f"LOCAL-{os.urandom(4).hex()}" if data.payment_method == 'sinpe' else f"CARD-{os.urandom(4).hex()}"

    # El total a cobrar SIEMPRE se calcula aquí a partir del precio real en BD,
    # nunca a partir de lo que mande el cliente (data.total_amount_crc es solo
    # informativo). Esto evita que alguien manipule el monto desde el navegador.
    computed_total_crc = 0.0

    for item in data.gifts:
        if item.quantity < 1:
            raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")

        db_tree = db.query(TreeSpecies).filter(TreeSpecies.id == item.tree_id).first()
        if not db_tree or not db_tree.is_active:
            raise HTTPException(status_code=400, detail=f"El árbol {db_tree.name if db_tree else item.tree_id} ya no está disponible.")
        if db_tree.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {db_tree.name}. Solicitados: {item.quantity}, Disponibles: {db_tree.stock}")

        db_tree.stock -= item.quantity
        computed_total_crc += db_tree.price_crc * item.quantity + item.shipping_cost_applied

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

    if data.payment_method == 'sinpe':
        # No hay llamada externa que pueda fallar: confirmamos de una vez.
        db.commit()
        return {"status": "pending_verification", "checkout_url": None, "transaction_ref": temp_ref, "total_amount_crc": computed_total_crc}

    # Process Card Payment with Tilopay. Generamos el link ANTES de confirmar en
    # BD: si Tilopay falla, hacemos rollback y no queda stock descontado ni
    # pedidos "pending" huérfanos por una compra que nunca llegó a la pasarela.
    try:
        redirect_url = create_payment_link(
            txn_ref=temp_ref,
            target_amount_crc=computed_total_crc,
            buyer_first_name=data.buyer_name,
            buyer_last_name=data.buyer_last_name or "",
            buyer_email=data.buyer_email
        )
    except Exception as e:
        db.rollback()
        print(f"Error calling Tilopay: {e}")
        raise HTTPException(status_code=500, detail="Error de pasarela")

    db.commit()
    return {"checkout_url": redirect_url, "transaction_ref": temp_ref, "total_amount_crc": computed_total_crc}

@router.get("/tilopay-callback")
async def tilopay_callback(
    txn_ref: str,
    code: Optional[str] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # LIMITACIÓN CONOCIDA: este endpoint solo lee los query params con los que
    # Tilopay redirige el navegador del comprador. No hay verificación server-to-
    # server contra la API de Tilopay ni validación de firma/HMAC, así que en
    # teoría alguien con un txn_ref válido podría forjar esta llamada. No
    # implementamos una llamada de verificación porque no encontramos en el
    # repo documentación del endpoint/formato real de verificación de Tilopay —
    # agregarla a ciegas sería peor que no tenerla. Pendiente: pedir a Tilopay
    # (soporte o panel de comercio) el endpoint de verificación de transacción
    # o el mecanismo de firma de su webhook, e implementarlo aquí.
    gifts = db.query(Gift).filter(Gift.transaction_ref == txn_ref, Gift.status == "pending").all()

    if code == "1":
        for gift in gifts:
            gift.status = "paid"
    else:
        # Pago cancelado o fallido: liberamos el stock que se había reservado
        # en /checkout/gift, porque ese pedido nunca se va a cobrar.
        for gift in gifts:
            gift.status = "failed"
            if gift.tree:
                gift.tree.stock += gift.quantity
    db.commit()

    dashboard_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/dashboard?payment_success=true"

    return RedirectResponse(url=dashboard_url)

ALLOWED_RECEIPT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf"}
MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

@router.post("/checkout/upload-receipt/{txn_ref}")
async def upload_receipt(txn_ref: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    gifts = db.query(Gift).filter(Gift.transaction_ref == txn_ref).all()
    if not gifts:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if file.content_type not in ALLOWED_RECEIPT_TYPES:
        raise HTTPException(status_code=400, detail="Solo se aceptan comprobantes en JPEG, PNG, WebP o PDF")

    contents = await file.read()
    if len(contents) > MAX_RECEIPT_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="El comprobante no puede superar 5 MB")

    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # Nombre de archivo generado en el servidor: nunca confiamos en el nombre
    # que manda el cliente (evita path traversal y colisiones de nombres).
    ext = ALLOWED_RECEIPT_TYPES[file.content_type]
    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, new_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    for gift in gifts:
        gift.payment_receipt_url = f"/api/uploads/{new_filename}"
    db.commit()
    
    return {"status": "success", "receipt_url": f"/api/uploads/{new_filename}"}

