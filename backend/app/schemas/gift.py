from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.schemas.tree import TreeSpeciesResponse

class GiftBase(BaseModel):
    buyer_name: str
    buyer_email: EmailStr
    tree_id: int
    quantity: int
    recipient_name: str
    recipient_last_name: str
    recipient_email: EmailStr
    recipient_whatsapp: str
    recipient_address: Optional[str] = None
    message: Optional[str] = None
    send_date: Optional[date] = None
    transaction_ref: Optional[str] = None
    status: Optional[str] = "pending"
    certificate_url: Optional[str] = None

class GiftRead(GiftBase):
    id: int
    tree: Optional[TreeSpeciesResponse] = None

    class Config:
        from_attributes = True

class GiftStatusUpdate(BaseModel):
    status: str
