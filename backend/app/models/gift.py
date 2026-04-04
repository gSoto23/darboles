from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String)
    buyer_email = Column(String)
    
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
    
    tree = relationship("TreeSpecies")
