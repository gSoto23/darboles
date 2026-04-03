from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.farm import Farm
from app.models.subscription import Subscription
from app.schemas.inventory import FarmRead, FarmCreate, InventoryStats
from app.routers.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(db: Session = Depends(get_db)):
    # Calculate total capacity over all farms
    result = db.query(
        func.sum(Farm.total_trees).label("total_trees"),
        func.sum(Farm.carbon_capacity_tons).label("total_capacity_tons")
    ).first()

    total_cap = result.total_trees or 0
    cap_tons = result.total_capacity_tons or 0.0
    
    # Dynamically sum sold trees from ALL assigned subscriptions across all farms
    total_sold = db.query(func.sum(Subscription.quantity)).filter(Subscription.farm_id.isnot(None)).scalar() or 0
    
    # Proportion of carbon sold:
    sold_tons = 0.0
    if total_cap > 0:
        sold_tons = (total_sold / total_cap) * cap_tons

    return {
        "total_capacity_trees": int(total_cap),
        "total_sold_trees": int(total_sold),
        "total_capacity_tons": float(cap_tons),
        "total_sold_tons": float(sold_tons)
    }

@router.get("/farms", response_model=list[FarmRead])
def get_farms(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    farms = db.query(Farm).all()
    for f in farms:
        # Dynamically inject the trees_sold calculation so the UI shows the real computed number
        sold = db.query(func.sum(Subscription.quantity)).filter(Subscription.farm_id == f.id).scalar()
        f.trees_sold = sold or 0
        
    return farms

@router.post("/farms", response_model=FarmRead)
def create_farm(farm_in: FarmCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_farm = Farm(**farm_in.model_dump())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm
