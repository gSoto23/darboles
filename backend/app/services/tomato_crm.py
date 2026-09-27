"""Envío de solicitudes de empresas al CRM de tomatocr.com, de servidor a servidor.

Contrato: docs/INTEGRACION_TOMATOCR.md. La clave vive solo en el .env del backend
(TOMATO_CRM_API_KEY); el navegador nunca habla con tomatocr.com.
"""
import logging
import os
from dataclasses import dataclass, field
from typing import List, Optional

import httpx

logger = logging.getLogger("darboles.leads")

TIMEOUT_SECONDS = 10.0


@dataclass
class CrmResult:
    # ok: entró al CRM · invalid: tomatocr.com rechazó los datos (422)
    # fallback: no entró y hay que mandarlo por correo
    status: str
    errors: List[str] = field(default_factory=list)
    reason: str = ""


def _config():
    return os.getenv("TOMATO_CRM_URL", "").strip(), os.getenv("TOMATO_CRM_API_KEY", "").strip()


def send_lead(payload: dict, transport: Optional[httpx.BaseTransport] = None) -> CrmResult:
    url, api_key = _config()
    if not url or not api_key:
        logger.error("CRM de tomatocr.com sin configurar (TOMATO_CRM_URL/TOMATO_CRM_API_KEY); se usa el correo de respaldo")
        return CrmResult("fallback", reason="CRM sin configurar en darboles.com")

    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS, transport=transport) as client:
            response = client.post(url, json=payload, headers={"X-API-Key": api_key})
    except httpx.TimeoutException:
        logger.warning("CRM de tomatocr.com no respondió en %ss", TIMEOUT_SECONDS)
        return CrmResult("fallback", reason=f"tomatocr.com no respondió en {int(TIMEOUT_SECONDS)} s")
    except httpx.HTTPError as e:
        logger.warning("No se pudo conectar con el CRM de tomatocr.com: %s", type(e).__name__)
        return CrmResult("fallback", reason=f"sin conexión con tomatocr.com ({type(e).__name__})")

    code = response.status_code
    if code == 200:
        return CrmResult("ok")
    if code == 422:
        detail = _json(response).get("detail")
        errors = [str(d) for d in detail] if isinstance(detail, list) else [str(detail or "Datos inválidos")]
        return CrmResult("invalid", errors=errors)
    if code == 401:
        # La clave no coincide con DARBOLES_API_KEY de tomatocr.com: no sirve reintentar.
        logger.error("El CRM de tomatocr.com rechazó la clave (401): revisar TOMATO_CRM_API_KEY en los dos .env")
    else:
        logger.warning("El CRM de tomatocr.com respondió %s", code)
    return CrmResult("fallback", reason=f"tomatocr.com respondió {code}")


def _json(response: httpx.Response) -> dict:
    try:
        data = response.json()
        return data if isinstance(data, dict) else {}
    except ValueError:
        return {}
