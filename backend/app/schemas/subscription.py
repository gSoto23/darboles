from pydantic import BaseModel
from typing import Optional

class SubscriptionBase(BaseModel):
    customer_name: str
    customer_email: str
    quantity: int
    status: str
    stripe_subscription_id: Optional[str] = None
    farm_id: Optional[int] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionRead(SubscriptionBase):
    id: int

    class Config:
        from_attributes = True

class SubscriptionAssignFarm(BaseModel):
    farm_id: Optional[int] = None
