from pydantic import BaseModel
from typing import Optional

class TreeSpeciesBase(BaseModel):
    name: str
    scientific_name: str
    description: Optional[str] = None
    co2_capture_capacity_kg_per_year: Optional[float] = None
    price_usd: float
    image_url: Optional[str] = None

class TreeSpeciesCreate(TreeSpeciesBase):
    pass

class TreeSpeciesUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    co2_capture_capacity_kg_per_year: Optional[float] = None
    price_usd: Optional[float] = None
    image_url: Optional[str] = None

class TreeSpeciesResponse(TreeSpeciesBase):
    id: int

    class Config:
        from_attributes = True
