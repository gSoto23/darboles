from pydantic import BaseModel
from typing import Optional

class FarmBase(BaseModel):
    name: str
    total_trees: int
    trees_sold: int = 0
    carbon_capacity_tons: float
    gps_location: Optional[str] = None
    caretaker_name: Optional[str] = None
    caretaker_contact: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmRead(FarmBase):
    id: int

    class Config:
        from_attributes = True

class InventoryStats(BaseModel):
    total_capacity_trees: int
    total_sold_trees: int
    total_capacity_tons: float
    total_sold_tons: float
