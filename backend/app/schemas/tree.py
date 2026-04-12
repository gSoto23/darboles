from pydantic import BaseModel
from typing import Optional

class TreeSpeciesBase(BaseModel):
    name: str
    scientific_name: str
    description: Optional[str] = None
    co2_capture_capacity_kg_per_year: Optional[float] = None
    price_crc: int
    image_url: Optional[str] = None
    stock: int = 0
    is_active: bool = True

class TreeSpeciesCreate(TreeSpeciesBase):
    pass

class TreeSpeciesUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    co2_capture_capacity_kg_per_year: Optional[float] = None
    price_crc: Optional[int] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None

class TreeSpeciesResponse(TreeSpeciesBase):
    id: int

    class Config:
        from_attributes = True
