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

class TreeSpeciesResponse(TreeSpeciesBase):
    id: int

    class Config:
        from_attributes = True
