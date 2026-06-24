from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.models.gift import Gift
from app.models.tree import TreeSpecies
from app.models.tracked_tree import TrackedTree
from app.schemas.inventory import InventoryStats
from app.schemas.gift import GiftRead
from app.schemas.tracking import TrackedTreeResponse
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

@router.get("/me/planted", response_model=list[TrackedTreeResponse])
def get_my_planted_trees(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    user_email = current_user.email.strip().lower()
    
    # Busca por planter_email (matriculado) o por recipient_email (recibido por regalo)
    trees = db.query(TrackedTree).outerjoin(Gift, TrackedTree.gift_id == Gift.id).filter(
        or_(
            func.lower(TrackedTree.planter_email) == user_email,
            func.lower(Gift.recipient_email) == user_email
        ),
        TrackedTree.status == 'planted'
    ).order_by(TrackedTree.planted_at.desc()).all()
    
    res = []
    for tree in trees:
        res.append({
            "id_code": tree.id_code,
            "species_name": tree.species.name,
            "species_scientific_name": tree.species.scientific_name,
            "status": tree.status,
            "planted_at": tree.planted_at,
            "latitude": tree.latitude,
            "longitude": tree.longitude,
            "planter_name": tree.planter_name,
            "photo_url": tree.photo_url
        })
    return res
