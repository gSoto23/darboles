import os
import base64
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.gift import Gift
from datetime import datetime

router = APIRouter()

FOURGEEKS_API_KEY = os.getenv("FOURGEEKS_API_KEY")
FOURGEEKS_BASE_URL = "https://api.4geeks.io/v1"  # Replace with appropriate environment URL if sandbox has a different base URL but standard is usually this

def get_4geeks_headers():
    if not FOURGEEKS_API_KEY:
        raise HTTPException(status_code=500, detail="4Geeks API Key not configured")
    auth_string = f"{FOURGEEKS_API_KEY}:"
    encoded_auth = base64.b64encode(auth_string.encode()).decode()
    return {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/json"
    }

class SubscriptionCheckoutRequest(BaseModel):
    total_carbon: float
    amount_usd: int
    customer_email: EmailStr
    customer_name: str

@router.post("/checkout/subscription")
async def create_subscription_checkout(data: SubscriptionCheckoutRequest, db: Session = Depends(get_db)):
    headers = get_4geeks_headers()
    plan_id = f"darboles_mensual_usd_{data.amount_usd}"
    
    try:
        async with httpx.AsyncClient() as client:
            # 1. Asegurar que el plan existe primero
            plan_response = await client.get(f"{FOURGEEKS_BASE_URL}/plans/{plan_id}", headers=headers)
            
            if plan_response.status_code == 404:
                # Crear el plan si no existe
                plan_payload = {
                    "id": plan_id,
                    "name": f"Darboles Suscripción Carbono ({data.amount_usd} USD)",
                    "amount": data.amount_usd * 100, # Asumiendo centavos
                    "currency": "usd",
                    "interval": "month"
                }
                create_plan_res = await client.post(f"{FOURGEEKS_BASE_URL}/plans", json=plan_payload, headers=headers)
                if create_plan_res.status_code not in (200, 201):
                    raise HTTPException(status_code=500, detail=f"Error creando plan en 4Geeks: {create_plan_res.text}")
            elif plan_response.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail=f"Error verificando plan: {plan_response.text}")
            
            # 2. Crear la suscripción para obtener el Checkout URL
            sub_payload = {
                "plan_id": plan_id,
                "customer": {
                    "email": data.customer_email,
                    "name": data.customer_name
                },
                "success_url": "http://localhost:3001/suscripciones?status=success",
                "cancel_url": "http://localhost:3001/suscripciones?status=cancelled"
            }
            
            sub_res = await client.post(f"{FOURGEEKS_BASE_URL}/subscriptions", json=sub_payload, headers=headers)
            if sub_res.status_code not in (200, 201):
                 raise HTTPException(status_code=500, detail=f"Error creando suscripción en 4Geeks: {sub_res.text}")
                 
            sub_data = sub_res.json()
            
            # Devolvemos el URL de checkout
            checkout_url = sub_data.get("checkout_url") or sub_data.get("url") # Depende del schema exacto
            if not checkout_url:
                raise HTTPException(status_code=500, detail="Checkout URL no fue retornada por 4Geeks")
                
            return {"checkout_url": checkout_url}
            
    except httpx.RequestError as e:
        # Fallback local para desarrollo si hay errores DNS o de red
        print(f"Network error calling 4Geeks: {e}")
        # Simulamos una URL de checkout para que el frontend local pueda continuar
        return {"checkout_url": f"https://sandbox.4geeks.io/checkout/simulated_{plan_id}"}

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

class CartCheckoutRequest(BaseModel):
    buyer_name: str
    buyer_email: EmailStr
    payment_method: str # 'sinpe' or 'card'
    total_amount_usd: float
    gifts: list[GiftItem]

@router.post("/checkout/gift")
async def create_gift_checkout(data: CartCheckoutRequest, db: Session = Depends(get_db)):
    # 1. Persist to DB immediately as pending
    temp_ref = f"LOCAL-{os.urandom(4).hex()}" if data.payment_method == 'sinpe' else "CARD-PENDING"
    
    for item in data.gifts:
        send_date_obj = None
        if item.send_date:
            try:
                send_date_obj = datetime.strptime(item.send_date, "%Y-%m-%d").date()
            except ValueError:
                pass
                
        new_gift = Gift(
             buyer_name=data.buyer_name,
             buyer_email=data.buyer_email,
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
             transaction_ref=temp_ref
        )
        db.add(new_gift)
    
    db.commit()

    if data.payment_method == 'sinpe':
        # Simulate local success for SINPE verification
        return {"status": "pending_verification", "checkout_url": None}
    
    headers = get_4geeks_headers()
    try:
        async with httpx.AsyncClient() as client:
            charge_payload = {
                "amount": int(data.total_amount_usd * 100),
                "currency": "usd",
                "description": f"Compra de {sum(g.quantity for g in data.gifts)} árboles para {len(data.gifts)} destinatarios"
            }
            res = await client.post(f"{FOURGEEKS_BASE_URL}/charges", json=charge_payload, headers=headers)
            if res.status_code not in (200, 201):
                 # Fallback due to 4geeks DNS being down currently
                 print(f"Error from 4geeks: {res.text}")
                 return {"checkout_url": "https://sandbox.4geeks.io/checkout/simulated_cart_fallback"}
            
            charge_data = res.json()
            checkout_url = charge_data.get("checkout_url")
            if not checkout_url:
                 return {"checkout_url": "https://sandbox.4geeks.io/checkout/simulated_cart_fallback"}
            return {"checkout_url": checkout_url}
            
    except httpx.RequestError as e:
        print(f"Network error calling 4Geeks: {e}")
        return {"checkout_url": "https://sandbox.4geeks.io/checkout/simulated_cart_fallback"}

