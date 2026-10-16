"""Estados de un cobro en Tilopay y efecto sobre los pedidos (Gift).

Un pago solo se da por bueno si el retorno o el webhook traen un OrderHash válido, un
código de autorización de al menos 6 caracteres que no se haya usado en otro cobro, y
`code == 1`. Es la misma regla del plugin oficial de Tilopay. Así no basta con abrir a
mano .../tilopay-callback?code=1 para marcar un pedido como pagado.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.card_payment import CardPayment
from app.models.gift import Gift
from app.services import tilopay

logger = logging.getLogger("darboles.tilopay")

# Resultado que se muestra en /pago/resultado?estado=…
PAID = "pagado"
FAILED = "fallido"
PENDING = "pendiente"  # SINPE Móvil u otro pago que Tilopay confirmará después
REVIEW = "verificando"  # retorno sospechoso: el pedido no cambia y se revisa a mano
NOT_FOUND = "no-encontrado"

ABANDONED_AFTER = timedelta(hours=2)


def _gifts(db: Session, txn_ref: str):
    return db.query(Gift).filter(Gift.transaction_ref == txn_ref).all()


def _release_stock(gifts):
    for gift in gifts:
        if gift.status == "pending":
            gift.status = "failed"
            if gift.tree:
                gift.tree.stock += gift.quantity


def _review(db: Session, payment: CardPayment, reason: str, source: str) -> str:
    first_time = payment.status != "review"
    if payment.status != "paid":
        payment.status = "review"
    payment.note = f"{datetime.utcnow():%Y-%m-%d %H:%M} UTC ({source}): {reason}"
    db.commit()
    logger.warning("Tilopay %s del cobro %s NO aceptado: %s", source, payment.txn_ref, reason)
    if first_time:
        from app.core.mailer import send_payment_review_alert
        try:
            send_payment_review_alert(payment.txn_ref, reason, payment.amount_crc, payment.email)
        except Exception as e:
            logger.error("no se pudo enviar la alerta de pago: %s", type(e).__name__)
    return REVIEW


def apply_tilopay_result(db: Session, *, txn_ref: str, order: Optional[str], code: Optional[str],
                         auth: Optional[str], tilopay_order_id: Optional[str], order_hash: Optional[str],
                         description: Optional[str], source: str) -> str:
    payment = db.query(CardPayment).filter(CardPayment.txn_ref == txn_ref).first() if txn_ref else None
    if payment is None:
        logger.warning("Tilopay %s para un cobro desconocido", source)
        return NOT_FOUND
    if payment.status == "paid":
        return PAID  # el comprador recargó la página o Tilopay repitió el aviso

    code = (code or "").strip()
    payment.response_code = code[:10] or None
    payment.response_description = (description or "")[:255] or None

    if order and order != txn_ref:
        return _review(db, payment, f"el número de orden no coincide ({order})", source)

    if code == "1":
        auth = (auth or "").strip()
        tpt = (tilopay_order_id or "").strip()
        if len(auth) < 6 or not tpt:
            return _review(db, payment, "pago sin código de autorización o sin id de Tilopay", source)
        valid = tilopay.verify_order_hash(order_hash, tilopay_order_id=tpt, order_number=txn_ref,
                                          amount_crc=payment.amount_crc, response_code=code, auth=auth,
                                          email=payment.email)
        if not valid:
            return _review(db, payment, "OrderHash inválido", source)
        reused = db.query(CardPayment.id).filter(CardPayment.auth_code == auth, CardPayment.id != payment.id).first()
        if reused:
            return _review(db, payment, "código de autorización ya usado en otro cobro", source)

        gifts = _gifts(db, txn_ref)
        for gift in gifts:
            if gift.status in ("failed", "expired"):
                # Se había liberado el stock (abandono a las 2 h) pero Tilopay sí cobró: se vuelve a reservar
                if gift.tree:
                    gift.tree.stock -= gift.quantity
                    if gift.tree.stock < 0:
                        logger.warning("stock negativo de %s por un pago tardío del cobro %s", gift.tree.name, txn_ref)
                gift.status = "paid"
            elif gift.status == "pending":
                gift.status = "paid"
        payment.status, payment.auth_code, payment.tilopay_order_id = "paid", auth, tpt
        payment.completed_at, payment.note = datetime.utcnow(), None
        try:
            db.commit()
        except IntegrityError:
            # Otro cobro guardó el mismo código de autorización al mismo tiempo
            db.rollback()
            payment = db.query(CardPayment).filter(CardPayment.txn_ref == txn_ref).first()
            return _review(db, payment, "código de autorización ya usado en otro cobro", source)
        logger.info("Tilopay: cobro %s pagado (%s)", txn_ref, source)
        _notify_paid(gifts)
        return PAID

    if code.lower() == "pending":
        if payment.status in ("pending", "expired"):
            payment.status = "awaiting"  # ya no se libera a las 2 h: Tilopay avisará por webhook
        db.commit()
        return PENDING

    # Rechazado o cancelado (no hace falta hash: solo libera el stock del propio pedido)
    if payment.status in ("pending", "awaiting", "review", "expired"):
        payment.status, payment.completed_at = "failed", datetime.utcnow()
        _release_stock(_gifts(db, txn_ref))
    db.commit()
    return FAILED


def _notify_paid(gifts):
    if not gifts:
        return
    from app.core.mailer import send_order_verified_email
    first = gifts[0]
    try:
        send_order_verified_email(to_email=first.buyer_email, buyer_name=first.buyer_name, order_id=str(first.id))
    except Exception as e:  # el pago ya quedó registrado; un correo caído no lo deshace
        logger.error("no se pudo enviar el correo de pago verificado: %s", type(e).__name__)


def expire_abandoned(db: Session, now: Optional[datetime] = None) -> int:
    """Cobros que nunca volvieron de Tilopay: después de 2 h se liberan su stock y sus pedidos."""
    cutoff = (now or datetime.utcnow()) - ABANDONED_AFTER
    stale = db.query(CardPayment).filter(CardPayment.status == "pending", CardPayment.created_at < cutoff).all()
    for payment in stale:
        payment.status, payment.completed_at = "expired", datetime.utcnow()
        payment.note = "sin respuesta de Tilopay en 2 h: stock liberado"
        _release_stock(_gifts(db, payment.txn_ref))
    db.commit()
    if stale:
        logger.info("Tilopay: %s cobros abandonados liberados", len(stale))
    return len(stale)
