from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    total_trees = Column(Integer, default=0)
    trees_sold = Column(Integer, default=0) # To track how many assigned in subscriptions
    carbon_capacity_tons = Column(Float, default=0.0)
    gps_location = Column(String)
    caretaker_name = Column(String)
    caretaker_contact = Column(String)
