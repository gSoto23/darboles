from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String)
    buyer_last_name = Column(String, nullable=True)
    buyer_email = Column(String)
    buyer_whatsapp = Column(String, nullable=True)
    
    invoice_requested = Column(Boolean, default=False)
    invoice_name = Column(String, nullable=True)
    invoice_id_number = Column(String, nullable=True)
    invoice_address = Column(String, nullable=True)
    invoice_activity_code = Column(String, nullable=True)
    
    tree_id = Column(Integer, ForeignKey("tree_species.id"))
    quantity = Column(Integer)
    
    recipient_name = Column(String)
    recipient_last_name = Column(String)
    recipient_email = Column(String)
    recipient_whatsapp = Column(String)
    recipient_address = Column(String, nullable=True)
    
    message = Column(String, nullable=True)
    send_date = Column(Date, nullable=True)
    
    transaction_ref = Column(String, nullable=True) # checkout_id
    status = Column(String, default="pending") # pending, sent, failed
    certificate_url = Column(String, nullable=True)
    shipping_cost_applied = Column(Float, nullable=True, default=0.0)
    payment_receipt_url = Column(String, nullable=True)
    payment_receipt_method = Column(String, nullable=True) # "upload", "whatsapp"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tree = relationship("TreeSpecies")
