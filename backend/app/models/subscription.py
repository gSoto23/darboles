from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True)
    customer_email = Column(String, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, default="active") # active, pending, cancelled
    stripe_subscription_id = Column(String, nullable=True) # Future-proofing
    
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    
    # Optional relationship mapping if we want back-populates on farm later
    farm = relationship("Farm")
