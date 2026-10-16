"""Pagos con Tilopay (doc_tilopay.md). Tilopay se simula: ninguna prueba sale a la red."""
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import campaign, config, gift, tracked_tree, tree, user  # noqa: F401 (registra modelos)
from app.models.card_payment import CardPayment
from app.models.config import StoreConfig
from app.models.gift import Gift
from app.models.tree import TreeSpecies
from app.services import card_payments, tilopay

KEY, USER, PASSWORD = "llave-de-prueba", "usuario-api", "clave-api"


@pytest.fixture
def env(monkeypatch):
    monkeypatch.setenv("TILOPAY_USER", USER)
    monkeypatch.setenv("TILOPAY_PASSWORD", PASSWORD)
    monkeypatch.setenv("TILOPAY_KEY", KEY)
    monkeypatch.setenv("BACKEND_URL", "https://darboles.test")
    monkeypatch.setenv("FRONTEND_URL", "https://darboles.test")
    return monkeypatch


@pytest.fixture
def db_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = factory()
    db.add(TreeSpecies(id=1, name="Cas", scientific_name="Psidium", price_crc=15000, stock=10, is_active=True))
    db.add(StoreConfig(id=1))
    db.commit()
    db.close()
    yield factory
    engine.dispose()


@pytest.fixture
def client(db_factory):
    def override():
        db = db_factory()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def alerts(monkeypatch):
    sent = []
    import app.core.mailer as mailer
    monkeypatch.setattr(mailer, "send_payment_review_alert", lambda *a: sent.append(a))
    return sent


@pytest.fixture
def mails(monkeypatch):
    sent = []
    import app.core.mailer as mailer
    monkeypatch.setattr(mailer, "send_order_verified_email", lambda **kw: sent.append(kw))
    return sent


class FakeTilopay:
    def __init__(self):
        self.payments = []

    def handler(self, request: httpx.Request):
        if request.url.path.endswith("/login"):
            return httpx.Response(200, json={"access_token": "token-123"})
        if request.url.path.endswith("/processPayment"):
            self.payments.append(json.loads(request.content))
            return httpx.Response(200, json={"type": 100, "url": "https://tilopay.test/pagar/abc"})
        return httpx.Response(404)


@pytest.fixture
def fake_tilopay(monkeypatch):
    fake = FakeTilopay()
    transport = httpx.MockTransport(fake.handler)
    real = tilopay.create_payment_link

    def with_transport(*args, **kwargs):
        return real(*args, transport=transport, **kwargs)

    import app.routers.payments as payments_router
    monkeypatch.setattr(payments_router, "create_payment_link", with_transport)
    return fake


ORDER = {
    "buyer_name": "Ana", "buyer_last_name": "Mora", "buyer_email": "ana@ejemplo.com", "buyer_whatsapp": "+506 8888-1234",
    "payment_method": "card",
    "gifts": [{"tree_id": 1, "quantity": 2, "recipient_name": "Luis", "recipient_last_name": "Soto",
               "recipient_email": "luis@ejemplo.com", "recipient_whatsapp": "8888", "message": "",
               "shipping_cost_applied": 3000.0}],
}


def checkout(client):
    r = client.post("/api/v1/payments/checkout/gift", json=ORDER)
    assert r.status_code == 200, r.text
    return r.json()["transaction_ref"]


def good_return(txn_ref, amount=33000.0, auth="AB12CD", tpt="998877", email="ana@ejemplo.com", code="1"):
    order_hash = tilopay.compute_order_hash(tilopay_order_id=tpt, order_number=txn_ref, amount_crc=amount,
                                            response_code=code, auth=auth, email=email)
    return {"txn_ref": txn_ref, "order": txn_ref, "code": code, "auth": auth, "tpt": tpt, "OrderHash": order_hash,
            "description": "Aprobada"}


def callback(client, params):
    return client.get("/api/v1/payments/tilopay-callback", params=params, follow_redirects=False)


def status_of(db_factory, txn_ref):
    db = db_factory()
    try:
        return (db.query(CardPayment).filter_by(txn_ref=txn_ref).one().status,
                [g.status for g in db.query(Gift).filter_by(transaction_ref=txn_ref)],
                db.get(TreeSpecies, 1).stock)
    finally:
        db.close()


# --- Creación del pago --------------------------------------------------------------

def test_checkout_sends_hash_v2_capture_and_server_total(env, client, fake_tilopay, db_factory):
    txn = checkout(client)
    sent = fake_tilopay.payments[0]
    assert sent["hashVersion"] == "V2" and sent["capture"] == 1
    assert sent["amount"] == "33000.00" and sent["currency"] == "CRC"  # 2 × 15 000 + 3 000 de envío
    assert sent["orderNumber"] == txn and sent["key"] == KEY
    assert sent["redirect"] == f"https://darboles.test/api/v1/payments/tilopay-callback?txn_ref={txn}"
    assert sent["billToTelephone"] == "88881234" and sent["billToEmail"] == "ana@ejemplo.com"
    db = db_factory()
    payment = db.query(CardPayment).filter_by(txn_ref=txn).one()
    assert payment.amount_crc == 33000.0 and payment.status == "pending"
    assert db.get(TreeSpecies, 1).stock == 8  # reservado


# --- Retorno válido -----------------------------------------------------------------

def test_valid_return_marks_paid_and_emails_buyer(env, client, fake_tilopay, db_factory, mails):
    txn = checkout(client)
    r = callback(client, good_return(txn))
    assert r.status_code == 303
    assert r.headers["location"] == f"https://darboles.test/pago/resultado?estado=pagado&ref={txn}"
    assert status_of(db_factory, txn) == ("paid", ["paid"], 8)
    assert len(mails) == 1 and mails[0]["to_email"] == "ana@ejemplo.com"


def test_reloading_the_return_is_idempotent(env, client, fake_tilopay, db_factory, mails):
    txn = checkout(client)
    params = good_return(txn)
    callback(client, params)
    assert "estado=pagado" in callback(client, params).headers["location"]
    assert len(mails) == 1


# --- Retornos falsos o alterados: el pedido NO se paga ------------------------------

@pytest.mark.parametrize("tamper", [
    lambda p: {k: v for k, v in p.items() if k != "OrderHash"},          # sin hash (el ataque de hoy)
    lambda p: {**p, "OrderHash": "0" * 64},                               # hash inventado
    lambda p: {**p, "auth": "ZZ99ZZ"},                                    # otro código de autorización
    lambda p: {**p, "tpt": "111111"},                                     # otra transacción de Tilopay
    lambda p: {**p, "auth": "123"},                                       # autorización demasiado corta
    lambda p: {**p, "order": "CARD-otroPedido"},                          # otro número de orden
])
def test_forged_or_tampered_return_does_not_pay(env, client, fake_tilopay, db_factory, mails, alerts, tamper):
    txn = checkout(client)
    r = callback(client, tamper(good_return(txn)))
    assert "estado=verificando" in r.headers["location"]
    status, gifts, stock = status_of(db_factory, txn)
    assert status == "review" and gifts == ["pending"] and stock == 8 and mails == []
    assert len(alerts) == 1 and alerts[0][0] == txn  # el equipo recibe la alerta
    callback(client, tamper(good_return(txn)))
    assert len(alerts) == 1  # una sola alerta por cobro, aunque se repita


def test_hash_for_a_different_amount_is_rejected(env, client, fake_tilopay, db_factory):
    txn = checkout(client)
    r = callback(client, good_return(txn, amount=1.0))  # hash calculado con un monto que no es el cobrado
    assert "estado=verificando" in r.headers["location"]
    assert status_of(db_factory, txn)[0] == "review"


def test_authorization_code_cannot_be_reused(env, client, fake_tilopay, db_factory):
    first, second = checkout(client), checkout(client)
    callback(client, good_return(first, auth="AUTH01"))
    r = callback(client, good_return(second, auth="AUTH01", tpt="555"))
    assert "estado=verificando" in r.headers["location"]
    assert status_of(db_factory, second)[0] == "review"


def test_review_then_genuine_return_still_pays(env, client, fake_tilopay, db_factory):
    txn = checkout(client)
    callback(client, {"txn_ref": txn, "code": "1"})  # intento falso
    callback(client, good_return(txn))                # el verdadero
    assert status_of(db_factory, txn)[0] == "paid"


# --- Rechazo, SINPE pendiente, webhook y abandono -----------------------------------

def test_declined_payment_fails_and_releases_stock(env, client, fake_tilopay, db_factory):
    txn = checkout(client)
    r = callback(client, {"txn_ref": txn, "order": txn, "code": "0", "description": "Fondos insuficientes"})
    assert "estado=fallido" in r.headers["location"]
    assert status_of(db_factory, txn) == ("failed", ["failed"], 10)


def test_pending_sinpe_then_webhook_confirms(env, client, fake_tilopay, db_factory, mails):
    txn = checkout(client)
    r = callback(client, {"txn_ref": txn, "order": txn, "code": "Pending", "description": "Pendiente"})
    assert "estado=pendiente" in r.headers["location"]
    assert status_of(db_factory, txn)[0] == "awaiting"
    params = good_return(txn)
    body = {"orderNumber": txn, "code": "1", "auth": params["auth"], "tpt": params["tpt"], "orderHash": params["OrderHash"]}
    r = client.post("/api/v1/payments/tilopay-webhook", json=body)
    assert r.status_code == 200 and r.json()["result"] == "pagado"
    assert status_of(db_factory, txn) == ("paid", ["paid"], 8) and len(mails) == 1


def test_webhook_with_bad_hash_does_not_pay(env, client, fake_tilopay, db_factory):
    txn = checkout(client)
    r = client.post("/api/v1/payments/tilopay-webhook",
                    json={"orderNumber": txn, "code": "1", "auth": "AB12CD", "tpt": "9", "orderHash": "f" * 64})
    assert r.status_code == 200 and r.json()["result"] == "verificando"
    assert status_of(db_factory, txn)[0] == "review"


def test_webhook_unknown_order_is_404(env, client):
    assert client.post("/api/v1/payments/tilopay-webhook", json={"orderNumber": "CARD-nada", "code": "1"}).status_code == 404


def test_abandoned_payments_are_released_after_two_hours(env, client, fake_tilopay, db_factory):
    from datetime import datetime, timedelta
    txn = checkout(client)
    sinpe = checkout(client)
    callback(client, {"txn_ref": sinpe, "order": sinpe, "code": "Pending"})  # SINPE esperando: no se libera
    db = db_factory()
    assert card_payments.expire_abandoned(db, now=datetime.utcnow() + timedelta(minutes=90)) == 0
    assert card_payments.expire_abandoned(db, now=datetime.utcnow() + timedelta(hours=3)) == 1
    db.close()
    assert status_of(db_factory, txn) == ("expired", ["failed"], 8)  # 10 − 2 (sinpe sigue reservado)
    assert status_of(db_factory, sinpe)[0] == "awaiting"


def test_late_genuine_payment_after_expiry_is_still_honored(env, client, fake_tilopay, db_factory):
    from datetime import datetime, timedelta
    txn = checkout(client)
    db = db_factory()
    card_payments.expire_abandoned(db, now=datetime.utcnow() + timedelta(hours=3))
    db.close()
    assert "estado=pagado" in callback(client, good_return(txn)).headers["location"]
    assert status_of(db_factory, txn) == ("paid", ["paid"], 8)  # se volvió a reservar el stock


def test_unknown_order_on_return(env, client):
    r = callback(client, {"txn_ref": "CARD-noexiste", "code": "1"})
    assert "estado=no-encontrado" in r.headers["location"]


# --- Fórmula del hash (igual al plugin oficial en PHP) --------------------------------

def test_php_compatible_encoding():
    # http_build_query de PHP: espacio → '+', '~' → %7E, '@' → %40, ',' → %2C; number_format usa miles con ','
    assert tilopay._php_urlencode("a b~c@d.e+f_g-h") == "a+b%7Ec%40d.e%2Bf_g-h"
    assert tilopay._php_urlencode("árbol") == "%C3%A1rbol"
    assert tilopay._php_number_format(33000) == "33,000.00"
    assert tilopay._php_number_format(1234567.5) == "1,234,567.50"


def test_hash_is_hmac_sha256_with_documented_key(env):
    import hashlib
    import hmac
    got = tilopay.compute_order_hash(tilopay_order_id="T1", order_number="CARD-1", amount_crc=15000, response_code="1",
                                     auth="AB12CD", email="a@b.co")
    message = ("api_Key=llave-de-prueba&api_user=usuario-api&orderId=T1&external_orden_id=CARD-1"
               "&amount=15%2C000.00&currency=CRC&responseCode=1&auth=AB12CD&email=a%40b.co")
    assert got == hmac.new(b"T1|llave-de-prueba|clave-api", message.encode(), hashlib.sha256).hexdigest()
