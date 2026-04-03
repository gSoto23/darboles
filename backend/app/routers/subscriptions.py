from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionRead, SubscriptionAssignFarm
from app.routers.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/me", response_model=list[SubscriptionRead])
def get_my_subscriptions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Subscription).filter(Subscription.customer_email == current_user.email).all()

@router.get("", response_model=list[SubscriptionRead])
def get_subscriptions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Subscription).all()

@router.patch("/{sub_id}/assign-farm", response_model=SubscriptionRead)
def assign_farm(sub_id: int, data: SubscriptionAssignFarm, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    sub.farm_id = data.farm_id
    db.commit()
    db.refresh(sub)
    
    return sub

@router.patch("/{sub_id}/cancel", response_model=SubscriptionRead)
def cancel_subscription(sub_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    # Check if the user owns it or is admin
    if sub.customer_email != current_user.email and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this subscription")
        
    sub.status = "cancelled"
    db.commit()
    db.refresh(sub)
    
    return sub
