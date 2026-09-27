"""Formulario de empresas → CRM de tomatocr.com (docs/INTEGRACION_TOMATOCR.md).

tomatocr.com se simula con httpx.MockTransport; el correo de respaldo, con un doble
que registra las llamadas. Ninguna prueba sale a la red ni manda correos.
"""
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.main import app
from app.routers import leads
from app.services import tomato_crm

URL = "http://crm.test/api/crm/leads"
KEY = "clave-de-prueba"

VALID = {
    "name": "Ana Mora",
    "company": "Banco Verde",
    "email": "Ana@Ejemplo.com",
    "phone": "",
    "motor": "regalo_corporativo",
    "message": "50 árboles para fin de año",
    "consent": True,
}


class FakeCrm:
    """Hace de tomatocr.com: guarda lo que recibe y responde lo que se le indique."""

    def __init__(self, status=200, body=None, exc=None):
        self.status, self.body, self.exc = status, body, exc
        self.requests = []

    def handler(self, request: httpx.Request):
        self.requests.append(request)
        if self.exc:
            raise self.exc
        body = self.body if self.body is not None else {"ok": True, "account_id": 1, "opportunity_id": 1,
                                                         "new_account": True, "new_opportunity": True}
        return httpx.Response(self.status, json=body)


@pytest.fixture
def env(monkeypatch):
    monkeypatch.setenv("TOMATO_CRM_URL", URL)
    monkeypatch.setenv("TOMATO_CRM_API_KEY", KEY)
    monkeypatch.setenv("LEADS_PER_IP_PER_HOUR", "5")
    monkeypatch.setenv("LEADS_PER_HOUR", "60")
    leads.limiter.reset()
    yield monkeypatch
    leads.limiter.reset()


@pytest.fixture
def mail(monkeypatch):
    sent = {"calls": [], "result": True}

    def fake(lead, reason):
        sent["calls"].append((lead, reason))
        return sent["result"]

    monkeypatch.setattr(leads, "send_lead_fallback_email", fake)
    return sent


def use_crm(monkeypatch, crm: FakeCrm):
    transport = httpx.MockTransport(crm.handler)
    monkeypatch.setattr(leads, "send_lead", lambda payload: tomato_crm.send_lead(payload, transport=transport))


client = TestClient(app)


def post(body):
    return client.post("/api/v1/leads/empresas", json=body)


# --- Éxito ---------------------------------------------------------------------------

def test_success_sends_contract_payload_with_key(env, mail):
    crm = FakeCrm()
    use_crm(env, crm)

    r = post(VALID)

    assert r.status_code == 200 and r.json() == {"ok": True}
    assert len(crm.requests) == 1 and mail["calls"] == []
    sent = crm.requests[0]
    assert str(sent.url) == URL
    assert sent.headers["X-API-Key"] == KEY
    body = json.loads(sent.content)
    assert body == {
        "name": "Ana Mora", "company": "Banco Verde", "email": "ana@ejemplo.com", "phone": "",
        "motor": "regalo_corporativo", "message": "50 árboles para fin de año",
        "consent": True, "consent_text_version": leads.CONSENT_TEXT_VERSION,
    }
    assert "website" not in body


def test_phone_only_is_enough(env, mail):
    crm = FakeCrm()
    use_crm(env, crm)
    r = post({**VALID, "email": "", "phone": "8888-8888", "motor": "esg"})
    assert r.status_code == 200
    assert json.loads(crm.requests[0].content)["motor"] == "esg"


def test_fields_are_truncated_to_contract_limits(env, mail):
    crm = FakeCrm()
    use_crm(env, crm)
    post({**VALID, "name": "x" * 400, "message": "m" * 5000})
    body = json.loads(crm.requests[0].content)
    assert len(body["name"]) == 150 and len(body["message"]) == 3000


# --- 422: validación propia y de tomatocr.com -----------------------------------------

@pytest.mark.parametrize("change, code", [
    ({"name": "  "}, "name_required"),
    ({"email": "", "phone": ""}, "contact_required"),
    ({"email": "no-es-correo"}, "email_invalid"),
    ({"motor": "mantenimiento"}, "motor_required"),
    ({"consent": False}, "consent_required"),
    ({"consent": "true"}, "consent_required"),  # solo el booleano true cuenta como casilla marcada
])
def test_local_validation_rejects_without_calling_crm(env, mail, change, code):
    crm = FakeCrm()
    use_crm(env, crm)
    r = post({**VALID, **change})
    assert r.status_code == 422
    assert code in r.json()["errors"]
    assert crm.requests == [] and mail["calls"] == []


def test_crm_422_messages_are_passed_through(env, mail):
    crm = FakeCrm(status=422, body={"detail": ["Escribí tu nombre", "Elegí qué te interesa"]})
    use_crm(env, crm)
    r = post(VALID)
    assert r.status_code == 422
    assert r.json()["messages"] == ["Escribí tu nombre", "Elegí qué te interesa"]
    assert mail["calls"] == []


def test_bad_json_is_400(env, mail):
    r = client.post("/api/v1/leads/empresas", content="no es json", headers={"content-type": "application/json"})
    assert r.status_code == 400


# --- 503 / 5xx / timeout / 401 / 429 → correo de respaldo ------------------------------

@pytest.mark.parametrize("crm, reason", [
    (FakeCrm(status=503, body={"detail": "API de prospectos no configurada"}), "503"),
    (FakeCrm(status=500, body={}), "500"),
    (FakeCrm(status=502, body={}), "502"),
    (FakeCrm(status=401, body={"detail": "Clave inválida"}), "401"),
    (FakeCrm(status=429, body={"detail": "Demasiadas"}), "429"),
    (FakeCrm(exc=httpx.ReadTimeout("lento")), "no respondió"),
    (FakeCrm(exc=httpx.ConnectError("caído")), "sin conexión"),
])
def test_crm_failures_fall_back_to_email_and_still_thank(env, mail, crm, reason):
    use_crm(env, crm)
    r = post(VALID)
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert len(mail["calls"]) == 1
    lead, why = mail["calls"][0]
    assert lead["email"] == "ana@ejemplo.com" and lead["consent"] is True
    assert reason in why


def test_missing_crm_config_uses_email(env, mail):
    env.delenv("TOMATO_CRM_API_KEY")
    r = post(VALID)
    assert r.status_code == 200 and len(mail["calls"]) == 1


def test_crm_and_email_both_down_returns_502(env, mail):
    use_crm(env, FakeCrm(status=503, body={}))
    mail["result"] = False
    r = post(VALID)
    assert r.status_code == 502 and r.json()["errors"] == ["unavailable"]


def test_timeout_is_ten_seconds():
    assert tomato_crm.TIMEOUT_SECONDS == 10.0


# --- Honeypot -----------------------------------------------------------------------

def test_honeypot_pretends_success_and_sends_nothing(env, mail):
    crm = FakeCrm()
    use_crm(env, crm)
    r = post({**VALID, "website": "http://spam.example"})
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert crm.requests == [] and mail["calls"] == []


def test_honeypot_bots_do_not_use_up_the_limit(env, mail):
    use_crm(env, FakeCrm())
    for _ in range(10):
        post({**VALID, "website": "x"})
    assert post(VALID).status_code == 200


# --- Límite por IP y total ------------------------------------------------------------

def test_per_ip_limit(env, mail):
    crm = FakeCrm()
    use_crm(env, crm)
    env.setattr(leads, "client_ip", lambda request: "203.0.113.50")  # el cliente de pruebas no trae IP
    for _ in range(5):
        assert post(VALID).status_code == 200
    r = post(VALID)
    assert r.status_code == 429 and r.json()["errors"] == ["too_many"]
    assert len(crm.requests) == 5


def test_global_hourly_limit(env, mail):
    env.setenv("LEADS_PER_HOUR", "3")
    env.setenv("LEADS_PER_IP_PER_HOUR", "100")
    use_crm(env, FakeCrm())
    for _ in range(3):
        assert post(VALID).status_code == 200
    assert post(VALID).status_code == 429


def test_limit_is_per_ip():
    limiter = leads.RateLimiter()
    import os
    os.environ["LEADS_PER_IP_PER_HOUR"] = "1"
    try:
        assert limiter.allow("198.51.100.1")
        assert not limiter.allow("198.51.100.1")
        assert limiter.allow("198.51.100.2")
    finally:
        os.environ["LEADS_PER_IP_PER_HOUR"] = "5"


def _request(peer, headers=None):
    raw = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    return Request({"type": "http", "client": (peer, 5000), "headers": raw})


def test_client_ip_trusts_proxy_headers_only_from_the_server():
    # Llega por Nginx → Docker: el par es privado y se usa la IP que manda Nginx.
    assert leads.client_ip(_request("172.18.0.1", {"X-Real-IP": "203.0.113.9"})) == "203.0.113.9"
    assert leads.client_ip(_request("127.0.0.1", {"X-Forwarded-For": "203.0.113.7, 10.0.0.1"})) == "203.0.113.7"
    # Alguien entra directo al puerto 8001 e intenta falsificar su IP: se ignora el encabezado.
    assert leads.client_ip(_request("198.51.100.20", {"X-Real-IP": "1.2.3.4"})) == "198.51.100.20"


# --- Servicio del CRM directo ---------------------------------------------------------

def test_service_without_config_does_not_call_network(monkeypatch):
    monkeypatch.delenv("TOMATO_CRM_URL", raising=False)
    monkeypatch.delenv("TOMATO_CRM_API_KEY", raising=False)
    crm = FakeCrm()
    result = tomato_crm.send_lead({"name": "x"}, transport=httpx.MockTransport(crm.handler))
    assert result.status == "fallback" and crm.requests == []


# --- Correo de respaldo ----------------------------------------------------------------

def test_fallback_email_without_smtp_reports_failure(monkeypatch):
    from app.core import mailer
    monkeypatch.setattr(mailer, "SMTP_SERVER", "")
    assert mailer.send_lead_fallback_email({"name": "Ana", "motor": "esg"}, "prueba") is False


def test_fallback_email_content(monkeypatch):
    from app.core import mailer
    sent = {}

    class FakeSMTP:
        def __init__(self, *a, **k): pass
        def starttls(self): pass
        def login(self, *a): pass
        def sendmail(self, sender, recipients, message): sent.update(to=recipients, message=message)
        def quit(self): pass

    import smtplib
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(mailer, "SMTP_SERVER", "smtp.test")
    monkeypatch.setattr(mailer, "SMTP_USERNAME", "robot@test")
    monkeypatch.setattr(mailer, "LEADS_FALLBACK_EMAILS", "info@tomatocr.com, darbolescr@gmail.com")

    lead = {**VALID, "email": "ana@ejemplo.com", "consent_text_version": leads.CONSENT_TEXT_VERSION}
    assert mailer.send_lead_fallback_email(lead, "tomatocr.com respondió 503") is True
    assert sent["to"] == ["info@tomatocr.com", "darbolescr@gmail.com"]
    import email
    msg = email.message_from_string(sent["message"])
    text = msg.get_payload(decode=True).decode("utf-8")
    assert msg["Reply-To"] == "ana@ejemplo.com"
    for expected in ("Banco Verde", "ana@ejemplo.com", "Regalo corporativo", "503", "50 árboles"):
        assert expected in text
