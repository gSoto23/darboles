from sqlalchemy import Column, Integer, String, Text, Float
from app.core.database import Base

class TreeSpecies(Base):
    __tablename__ = "tree_species"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    scientific_name = Column(String, nullable=False)
    description = Column(Text)
    co2_capture_capacity_kg_per_year = Column(Float)
    price_usd = Column(Float, nullable=False)
    image_url = Column(String)
