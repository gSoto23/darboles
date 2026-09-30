from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime, date

# Caja que cubre Costa Rica continental e Isla del Coco; evita puntos en otro país por un GPS mal leído
CR_LAT_RANGE = (5.0, 11.5)
CR_LNG_RANGE = (-87.5, -82.4)

def _check_in_costa_rica(lat: float, lng: float):
    if not (CR_LAT_RANGE[0] <= lat <= CR_LAT_RANGE[1] and CR_LNG_RANGE[0] <= lng <= CR_LNG_RANGE[1]):
        raise ValueError("La ubicación debe estar dentro de Costa Rica")

def _check_planted_on(value: Optional[date]) -> Optional[date]:
    if value and value > date.today():
        raise ValueError("La fecha de siembra no puede ser futura")
    return value

class TrackedTreeResponse(BaseModel):
    id_code: str
    species_name: str
    species_scientific_name: str
    status: str
    origin: str = "guardian"
    project_name: Optional[str] = None
    planted_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    planter_name: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True

class TrackedTreeEnroll(BaseModel):
    planter_name: str = Field(min_length=2, max_length=120)
    planter_email: EmailStr
    latitude: float
    longitude: float
    planted_on: Optional[date] = None
    photo_url: Optional[str] = Field(default=None, max_length=300)

    @field_validator("planter_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("longitude")
    @classmethod
    def in_costa_rica(cls, v: float, info):
        lat = info.data.get("latitude")
        if lat is not None:
            _check_in_costa_rica(lat, v)
        return v

    @field_validator("planted_on")
    @classmethod
    def not_future(cls, v):
        return _check_planted_on(v)

class AdminTrackedTreeCreate(BaseModel):
    # Si viene id_code se matricula ese árbol existente (p. ej. un Guardián que mandó su ubicación por WhatsApp);
    # si no, se crea un árbol nuevo sin pedido asociado.
    id_code: Optional[str] = None
    species_id: Optional[int] = None
    # Los árboles de TOMATO ya no se cargan a mano: llegan por la sincronización con tomatocr.com
    origin: Literal["guardian"] = "guardian"
    project_name: Optional[str] = Field(default=None, max_length=160)
    planter_name: Optional[str] = Field(default=None, max_length=120)
    planter_email: Optional[EmailStr] = None
    latitude: float
    longitude: float
    planted_on: Optional[date] = None
    photo_url: Optional[str] = Field(default=None, max_length=300)

    @field_validator("longitude")
    @classmethod
    def in_costa_rica(cls, v: float, info):
        lat = info.data.get("latitude")
        if lat is not None:
            _check_in_costa_rica(lat, v)
        return v

    @field_validator("planted_on")
    @classmethod
    def not_future(cls, v):
        return _check_planted_on(v)

class AdminTrackedTreeRead(TrackedTreeResponse):
    id: int
    planter_email: Optional[str] = None
    gift_id: Optional[int] = None
    created_at: Optional[datetime] = None
