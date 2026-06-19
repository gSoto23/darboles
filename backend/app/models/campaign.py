from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    prefix = Column(String, index=True, unique=True)
    require_photo_verification = Column(Boolean, default=False)
    
    gifts = relationship("Gift", back_populates="campaign")
