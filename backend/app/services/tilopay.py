import os
import httpx
import json
from fastapi import HTTPException
from pydantic import BaseModel

TILOPAY_API_URL = "https://app.tilopay.com/api/v1"

def get_backend_callback_url() -> str:
    """
    Publicly reachable base URL of this backend, used as the Tilopay redirect target.
    Must be set via BACKEND_URL in production (e.g. https://darboles.com/api) —
    defaults to the local dev port so local testing keeps working unconfigured.
    """
    return os.getenv("BACKEND_URL", "http://localhost:8001")

def get_tilopay_credentials():
    user = os.getenv("TILOPAY_USER")
    password = os.getenv("TILOPAY_PASSWORD")
    key = os.getenv("TILOPAY_KEY")
    if not user or not password or not key:
        raise ValueError("Tilopay credentials are not properly configured in the environment variables.")
    return user, password, key

def get_access_token() -> str:
    user, password, _ = get_tilopay_credentials()
    
    url = f"{TILOPAY_API_URL}/login"
    payload = {
        "apiuser": user,
        "password": password
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = httpx.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get("access_token")
    except Exception as e:
        print(f"Error authenticating with Tilopay: {e}")
        raise HTTPException(status_code=500, detail="Error communicating with payment gateway configuration")

def create_payment_link(txn_ref: str, target_amount_crc: float, buyer_first_name: str, buyer_last_name: str, buyer_email: str) -> str:
    """
    Creates a payment session with Tilopay and returns the redirect URL.
    """
    _, _, key = get_tilopay_credentials()
    token = get_access_token()

    url = f"{TILOPAY_API_URL}/processPayment"
    
    # We must use exactly 2 decimal places for the amount even in Colones as standard
    amount_str = f"{target_amount_crc:.2f}"

    # Required payload fields from Tilopay Postman docs
    payload = {
        "key": key,
        "amount": amount_str,
        "currency": "CRC",
        # Tilopay redirects the buyer's browser here after payment; it must be the
        # publicly reachable backend URL, not a hardcoded localhost address.
        "redirect": get_backend_callback_url() + "/api/v1/payments/tilopay-callback?txn_ref=" + txn_ref,
        "billToFirstName": buyer_first_name or "Cliente",
        "billToLastName": buyer_last_name or "Generico",
        "billToAddress": "San Jose",
        "billToCity": "San Jose",
        "billToState": "CR-SJ",
        "billToCountry": "CR",
        "billToEmail": buyer_email,
        "billToTelephone": "88888888",
        "orderNumber": txn_ref,
        "platform": "api"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    try:
        response = httpx.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Expecting something like { "type": 100, "html": "Use url redirect", "url": "https://secure.tilopay.com/..." }
        if "url" in data:
            return data["url"]
        else:
            print(f"Unexpected Tilopay Response: {data}")
            raise HTTPException(status_code=500, detail="Invalid response from payment provider")
            
    except Exception as e:
        print(f"Error creating payment link with Tilopay: {e}")
        if isinstance(e, httpx.HTTPStatusError):
            print(e.response.text)
        raise HTTPException(status_code=500, detail="Error creating payment session")
