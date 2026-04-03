from pydantic import BaseModel
from typing import Optional

class SubscriptionBase(BaseModel):
    customer_name: str
    customer_email: str
    quantity: int
    amount_usd: Optional[float] = 0.0
    status: str
    stripe_subscription_id: Optional[str] = None
    farm_id: Optional[int] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionInvoiceRead(BaseModel):
    id: int
    amount_usd: float
    status: str
    invoice_date: str

    class Config:
        from_attributes = True

class SubscriptionRead(SubscriptionBase):
    id: int
    invoices: list[SubscriptionInvoiceRead] = []

    class Config:
        from_attributes = True

class SubscriptionAssignFarm(BaseModel):
    farm_id: Optional[int] = None
