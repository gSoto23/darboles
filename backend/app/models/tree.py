from sqlalchemy import Column, Integer, String, Text, Float, Boolean
from app.core.database import Base

class TreeSpecies(Base):
    __tablename__ = "tree_species"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    scientific_name = Column(String, nullable=False)
    description = Column(Text)
    co2_capture_capacity_kg_per_year = Column(Float)
    price_crc = Column(Integer, nullable=False)
    image_url = Column(String)
    stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
