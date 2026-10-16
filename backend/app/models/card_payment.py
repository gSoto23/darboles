"""Un cobro con tarjeta en Tilopay (puede cubrir varias líneas del carrito: todas las
Gift con el mismo transaction_ref). Guarda lo necesario para verificar el OrderHash
del retorno: el monto y el correo exactos que se le enviaron a Tilopay."""
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.core.database import Base


class CardPayment(Base):
    __tablename__ = "card_payments"

    id = Column(Integer, primary_key=True, index=True)
    txn_ref = Column(String(40), unique=True, index=True, nullable=False)  # = orderNumber en Tilopay
    amount_crc = Column(Float, nullable=False)  # monto enviado en processPayment
    email = Column(String(255), nullable=False)  # billToEmail, entra en el hash
    # pending | paid | failed | expired | review (retorno con hash inválido: revisar a mano)
    status = Column(String(20), nullable=False, default="pending", index=True)
    tilopay_order_id = Column(String(64), nullable=True)  # parámetro tpt del retorno
    # Código de autorización del banco: único para que no se pueda reusar un retorno
    auth_code = Column(String(64), nullable=True, unique=True)
    response_code = Column(String(10), nullable=True)
    response_description = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
