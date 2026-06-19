from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TrackedTreeResponse(BaseModel):
    id_code: str
    species_name: str
    species_scientific_name: str
    status: str
    planted_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    planter_name: Optional[str] = None
    photo_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class TrackedTreeEnroll(BaseModel):
    planter_name: str
    planter_email: str
    latitude: float
    longitude: float
    photo_url: Optional[str] = None
