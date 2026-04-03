from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

class ToggleRoleData(BaseModel):
    is_admin: bool

@router.get("", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()

@router.patch("/{user_id}/role", response_model=UserResponse)
def toggle_admin_role(user_id: int, data: ToggleRoleData, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="SuperAdmin mandatory")
    
    # Prevent self-demotion accidentally
    if current_user.id == user_id and not data.is_admin:
        raise HTTPException(status_code=400, detail="Cannot demote yourself from SuperAdmin logic")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_admin = data.is_admin
    db.commit()
    db.refresh(target_user)
    return target_user
