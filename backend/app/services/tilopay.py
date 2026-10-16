"""Pasarela Tilopay (cobro con tarjeta por redirección).

Flujo: /login → token; /processPayment → URL de pago; Tilopay devuelve al comprador a
BACKEND_URL/api/v1/payments/tilopay-callback con code, auth, order, tpt y OrderHash.

El OrderHash (hashVersion V2) es un HMAC-SHA256 que solo Tilopay y el comercio pueden
calcular, porque usa la llave y la contraseña de la API. Se verifica con la misma fórmula
que el plugin oficial de Tilopay para WooCommerce (v3.1.3, WCTilopay::computed_customer_hash).
Detalle en doc_tilopay.md.
"""
import hashlib
import hmac
import logging
import os
import re
from typing import Optional
from urllib.parse import quote_plus

import httpx
from fastapi import HTTPException

logger = logging.getLogger("darboles.tilopay")

TILOPAY_API_URL = "https://app.tilopay.com/api/v1"
TIMEOUT_SECONDS = 20.0


def get_backend_callback_url() -> str:
    """URL pública del backend, a la que Tilopay devuelve al comprador (BACKEND_URL)."""
    return os.getenv("BACKEND_URL", "http://localhost:8001")


def get_tilopay_credentials():
    user = os.getenv("TILOPAY_USER")
    password = os.getenv("TILOPAY_PASSWORD")
    key = os.getenv("TILOPAY_KEY")
    if not user or not password or not key:
        raise ValueError("Tilopay credentials are not properly configured in the environment variables.")
    return user, password, key


def is_configured() -> bool:
    try:
        get_tilopay_credentials()
        return True
    except ValueError:
        return False


def get_access_token(transport: Optional[httpx.BaseTransport] = None) -> str:
    user, password, _ = get_tilopay_credentials()
    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS, transport=transport) as client:
            response = client.post(f"{TILOPAY_API_URL}/login", json={"apiuser": user, "password": password},
                                   headers={"Content-Type": "application/json"})
        response.raise_for_status()
        token = response.json().get("access_token")
        if not token:
            raise ValueError("respuesta sin access_token")
        return token
    except Exception as e:
        logger.error("Tilopay /login falló: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail="Error communicating with payment gateway configuration")


def _phone(value: Optional[str]) -> str:
    digits = re.sub(r"\D", "", value or "")
    return digits[-8:] if len(digits) >= 8 else "88888888"


def create_payment_link(txn_ref: str, target_amount_crc: float, buyer_first_name: str, buyer_last_name: str,
                        buyer_email: str, buyer_phone: Optional[str] = None, buyer_address: Optional[str] = None,
                        transport: Optional[httpx.BaseTransport] = None) -> str:
    """Crea la sesión de pago y devuelve la URL de Tilopay a la que se redirige al comprador."""
    _, _, key = get_tilopay_credentials()
    token = get_access_token(transport=transport)

    payload = {
        "key": key,
        "amount": f"{target_amount_crc:.2f}",
        "currency": "CRC",
        "redirect": get_backend_callback_url() + "/api/v1/payments/tilopay-callback?txn_ref=" + txn_ref,
        "billToFirstName": buyer_first_name or "Cliente",
        "billToLastName": buyer_last_name or "Dárboles",
        "billToAddress": (buyer_address or "San José")[:100],
        "billToCity": "San José",
        "billToState": "CR-SJ",
        "billToCountry": "CR",
        "billToEmail": buyer_email,
        "billToTelephone": _phone(buyer_phone),
        "orderNumber": txn_ref,
        "capture": 1,  # cobrar de inmediato (no solo autorizar)
        "platform": "api",
        "hashVersion": "V2",  # para que el retorno traiga OrderHash
    }
    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS, transport=transport) as client:
            response = client.post(f"{TILOPAY_API_URL}/processPayment", json=payload,
                                   headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                            "Accept": "application/json"})
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        detail = e.response.text[:300] if isinstance(e, httpx.HTTPStatusError) else type(e).__name__
        logger.error("Tilopay /processPayment falló: %s", detail)
        raise HTTPException(status_code=500, detail="Error creating payment session")
    url = data.get("url") if isinstance(data, dict) else None
    if not url:
        logger.error("Tilopay /processPayment respondió sin url: %s", str(data)[:300])
        raise HTTPException(status_code=500, detail="Invalid response from payment provider")
    return url


# --- Verificación del retorno ---------------------------------------------------------

def _php_urlencode(value: str) -> str:
    # PHP http_build_query (RFC 1738): espacio → '+', y a diferencia de Python también codifica '~'
    return quote_plus(value, safe="").replace("~", "%7E")


def _php_number_format(amount: float) -> str:
    # number_format($amount, 2) de PHP: separador de miles ',' y 2 decimales (15000 → "15,000.00")
    return f"{amount:,.2f}"


def compute_order_hash(*, tilopay_order_id: str, order_number: str, amount_crc: float, response_code: str,
                       auth: str, email: str, currency: str = "CRC") -> str:
    """El OrderHash que debe mandar Tilopay para este retorno (hashVersion V2)."""
    user, password, key = get_tilopay_credentials()
    hash_key = f"{tilopay_order_id}|{key}|{password}"
    params = [
        ("api_Key", key),
        ("api_user", user),
        ("orderId", tilopay_order_id),
        ("external_orden_id", order_number),
        ("amount", _php_number_format(amount_crc)),
        ("currency", currency),
        ("responseCode", response_code),
        ("auth", auth),
        ("email", email),
    ]
    message = "&".join(f"{_php_urlencode(k)}={_php_urlencode(str(v))}" for k, v in params)
    return hmac.new(hash_key.encode(), message.encode(), hashlib.sha256).hexdigest()


def verify_order_hash(received_hash: Optional[str], **fields) -> bool:
    if not received_hash or len(received_hash) != 64:
        return False
    try:
        expected = compute_order_hash(**fields)
    except ValueError:
        return False
    return hmac.compare_digest(expected, received_hash.lower())
