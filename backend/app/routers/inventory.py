from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.gift import Gift
from app.models.tree import TreeSpecies
from app.schemas.inventory import InventoryStats
from app.schemas.gift import GiftRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(db: Session = Depends(get_db)):
    # Dynamically sum sold trees from ALL gifts
    total_sold = db.query(func.sum(Gift.quantity)).filter(Gift.status != 'failed').scalar() or 0
    
    # Very rough estimate of total tons sold (assuming ~25kg/tree)
    # Ideally tracked per tree species, but sticking to simplicity
    sold_tons = (total_sold * 25.0) / 1000.0

    return {
        "total_capacity_trees": 1000000, # Fake capacity since farms are gone
        "total_sold_trees": int(total_sold),
        "total_capacity_tons": 25000.0,
        "total_sold_tons": float(sold_tons)
    }

@router.get("/me/gifts", response_model=list[GiftRead])
def get_my_gifts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Gift).filter(Gift.buyer_email == current_user.email).order_by(Gift.id.desc()).all()
