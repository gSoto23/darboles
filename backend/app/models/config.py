from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class StoreConfig(Base):
    __tablename__ = "store_config"

    id = Column(Integer, primary_key=True, index=True)
    gam_shipping_cost = Column(Float, default=3000.0)
    non_gam_shipping_cost = Column(Float, default=5000.0)
    gam_delivery_days = Column(String, default="1 a 3 días hábiles")
    non_gam_delivery_days = Column(String, default="3 a 5 días hábiles")
    sinpe_number = Column(String, default="8888-8888")
    sinpe_name = Column(String, default="Dárboles")
    gam_cantons = Column(String, default="San José, Escazú, Desamparados, Aserrí, Mora, Goicoechea, Santa Ana, Alajuelita, Vázquez de Coronado, Tibás, Moravia, Montes de Oca, Curridabat, Alajuela, Atenas, Poás, Cartago, Paraíso, La Unión, Alvarado, Oreamuno, El Guarco, Heredia, Barva, Santo Domingo, Santa Bárbara, San Rafael, San Isidro, Belén, Flores, San Pablo")
