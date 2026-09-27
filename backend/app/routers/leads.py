"""Formulario de contacto para empresas (/empresas y /contacto).

El navegador llama a este endpoint; este backend valida, filtra bots y reenvía la
solicitud al CRM de tomatocr.com. Si tomatocr.com no la recibe, va por correo.
Contrato: docs/INTEGRACION_TOMATOCR.md.
"""
import ipaddress
import logging
import os
import re
import threading
import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.core.mailer import send_lead_fallback_email
from app.services.tomato_crm import send_lead

logger = logging.getLogger("darboles.leads")

router = APIRouter()

# Versión del texto de consentimiento que muestra el formulario. Cambiarla si cambia el texto.
CONSENT_TEXT_VERSION = "darboles-2026-09-27"

MOTORS = ("regalo_corporativo", "esg")
LIMITS = {"name": 150, "company": 200, "email": 150, "phone": 30, "message": 3000}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")  # la misma regla que tomatocr.com


class RateLimiter:
    """Límite en memoria: por IP y total por hora. Basta porque el backend corre en un solo
    proceso de Uvicorn; se reinicia con cada deploy."""

    WINDOW = 3600.0

    def __init__(self):
        self._lock = threading.Lock()
        self._by_ip = defaultdict(deque)
        self._all = deque()

    def _prune(self, bucket: deque, now: float):
        while bucket and now - bucket[0] > self.WINDOW:
            bucket.popleft()

    def allow(self, ip: Optional[str]) -> bool:
        per_ip = int(os.getenv("LEADS_PER_IP_PER_HOUR", 5))
        per_hour = int(os.getenv("LEADS_PER_HOUR", 60))
        now = time.monotonic()
        with self._lock:
            self._prune(self._all, now)
            if len(self._all) >= per_hour:
                return False
            if ip:
                bucket = self._by_ip[ip]
                self._prune(bucket, now)
                if len(bucket) >= per_ip:
                    return False
                bucket.append(now)
            self._all.append(now)
            return True

    def reset(self):
        with self._lock:
            self._by_ip.clear()
            self._all.clear()


limiter = RateLimiter()


# Redes desde las que llega Nginx: el propio servidor y la red interna de Docker.
PROXY_NETWORKS = [ipaddress.ip_network(n) for n in
                  ("127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "::1/128", "fc00::/7")]


def client_ip(request: Request) -> Optional[str]:
    """IP real de quien envía. Solo creemos en X-Real-IP / X-Forwarded-For cuando la conexión
    llega desde el propio servidor (Nginx o la red de Docker); si alguien entra directo al
    puerto 8001, esos encabezados se ignoran para que no pueda falsificar su IP."""
    peer = request.client.host if request.client else None
    try:
        from_proxy = peer is not None and any(ipaddress.ip_address(peer) in net for net in PROXY_NETWORKS)
    except ValueError:
        from_proxy = False
    if from_proxy:
        forwarded = request.headers.get("x-real-ip") or request.headers.get("x-forwarded-for", "").split(",")[0]
        if forwarded.strip():
            return forwarded.strip()
    return peer


def clean(data: dict):
    get = lambda key: str(data.get(key) or "").strip()
    lead = {key: get(key)[:limit] for key, limit in LIMITS.items()}
    lead["email"] = lead["email"].lower()
    lead["motor"] = get("motor")
    errors = []
    if not lead["name"]:
        errors.append("name_required")
    if not lead["email"] and not lead["phone"]:
        errors.append("contact_required")
    if lead["email"] and not EMAIL_RE.match(lead["email"]):
        errors.append("email_invalid")
    if lead["motor"] not in MOTORS:
        errors.append("motor_required")
    if data.get("consent") is not True:
        errors.append("consent_required")
    return lead, errors


def _log(outcome: str, lead: dict, reason: str = ""):
    # Sin datos personales: solo el dominio del correo.
    domain = lead.get("email", "").split("@")[-1] if lead.get("email") else "-"
    logger.info("solicitud de empresa: %s (motor=%s, dominio=%s)%s", outcome, lead.get("motor"), domain,
                f" motivo={reason}" if reason else "")


@router.post("/leads/empresas")
async def company_lead(request: Request):
    try:
        data = await request.json()
    except ValueError:
        data = None
    if not isinstance(data, dict):
        return JSONResponse(status_code=400, content={"ok": False, "errors": ["bad_request"]})

    # Honeypot: las personas no ven este campo; los bots lo llenan. Fingimos que funcionó.
    if str(data.get("website") or "").strip():
        return {"ok": True}

    if not limiter.allow(client_ip(request)):
        return JSONResponse(status_code=429, content={"ok": False, "errors": ["too_many"]})

    lead, errors = clean(data)
    if errors:
        return JSONResponse(status_code=422, content={"ok": False, "errors": errors})

    payload = {**lead, "consent": True, "consent_text_version": CONSENT_TEXT_VERSION}
    # send_lead y el correo son bloqueantes: van en un hilo para no frenar al servidor.
    result = await run_in_threadpool(send_lead, payload)

    if result.status == "ok":
        _log("enviada al CRM", lead)
        return {"ok": True}
    if result.status == "invalid":
        _log("rechazada por tomatocr.com (422)", lead)
        return JSONResponse(status_code=422, content={"ok": False, "errors": [], "messages": result.errors})

    if await run_in_threadpool(send_lead_fallback_email, payload, result.reason):
        _log("enviada por correo de respaldo", lead, result.reason)
        return {"ok": True}

    logger.error("solicitud de empresa PERDIDA: no entró al CRM ni salió el correo de respaldo (motivo=%s, motor=%s)",
                 result.reason, lead.get("motor"))
    return JSONResponse(status_code=502, content={"ok": False, "errors": ["unavailable"]})
