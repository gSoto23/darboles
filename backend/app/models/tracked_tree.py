from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class TrackedTree(Base):
    __tablename__ = "tracked_trees"

    id = Column(Integer, primary_key=True, index=True)
    id_code = Column(String, unique=True, index=True) # e.g. MUNI-ALA-001
    
    gift_id = Column(Integer, ForeignKey("gifts.id"))
    species_id = Column(Integer, ForeignKey("tree_species.id"))
    
    status = Column(String, default="unregistered") # unregistered, planted, dead
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    planter_name = Column(String, nullable=True)
    planter_email = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    planted_at = Column(DateTime, nullable=True)
    
    gift = relationship("Gift", back_populates="tracked_trees")
    species = relationship("TreeSpecies")
