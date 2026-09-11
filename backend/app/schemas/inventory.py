from pydantic import BaseModel


class InventoryStats(BaseModel):
    total_capacity_trees: int
    total_sold_trees: int
    total_capacity_tons: float
    total_sold_tons: float
