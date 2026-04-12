from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.config import StoreConfig
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["Config"])

class StoreConfigSchema(BaseModel):
    gam_shipping_cost: float
    non_gam_shipping_cost: float
    gam_delivery_days: str
    non_gam_delivery_days: str
    sinpe_number: str
    sinpe_name: str
    gam_cantons: Optional[str] = None

@router.get("/config", response_model=StoreConfigSchema)
def get_config(db: Session = Depends(get_db)):
    config = db.query(StoreConfig).filter(StoreConfig.id == 1).first()
    if not config:
        config = StoreConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/admin/config", response_model=StoreConfigSchema)
def update_config(data: StoreConfigSchema, db: Session = Depends(get_db)):
    config = db.query(StoreConfig).filter(StoreConfig.id == 1).first()
    if not config:
        config = StoreConfig(id=1)
        db.add(config)
    
    config.gam_shipping_cost = data.gam_shipping_cost
    config.non_gam_shipping_cost = data.non_gam_shipping_cost
    config.gam_delivery_days = data.gam_delivery_days
    config.non_gam_delivery_days = data.non_gam_delivery_days
    config.sinpe_number = data.sinpe_number
    config.sinpe_name = data.sinpe_name
    config.gam_cantons = data.gam_cantons
    
    db.commit()
    db.refresh(config)
    return config
