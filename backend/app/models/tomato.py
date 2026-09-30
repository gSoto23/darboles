"""Árboles de los proyectos de reforestación de TOMATO, copiados de tomatocr.com.

tomatocr.com es la fuente de verdad: estas tablas solo las escribe la sincronización
(app/services/tomato_sync.py). Contrato: docs/INTEGRACION_TOMATOCR.md.
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TomatoTree(Base):
    __tablename__ = "tomato_trees"

    # El id de tomatocr.com (estable); no se genera aquí
    id = Column(Integer, primary_key=True, autoincrement=False)
    project_id = Column(Integer, nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    project_public = Column(Boolean, nullable=False, default=False)
    tree_number = Column(Integer, nullable=True)
    species = Column(String(255), nullable=True)
    sector = Column(String(255), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    location_precision = Column(String(10), nullable=False, default="sector")  # sector | tree
    date_planted = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="sin_verificar")  # sin_verificar | vivo | muerto | reemplazado
    last_checked_at = Column(Date, nullable=True)
    replaced_by_id = Column(Integer, nullable=True)
    updated_at = Column(DateTime, nullable=True)  # según tomatocr.com (UTC)
    # False cuando dejó de venir en la foto completa: se oculta, no se borra
    active = Column(Boolean, nullable=False, default=True, index=True)
    synced_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    visits = relationship("TomatoVisit", back_populates="tree", cascade="all, delete-orphan",
                          order_by="(TomatoVisit.date.desc(), TomatoVisit.id.desc())")


class TomatoVisit(Base):
    __tablename__ = "tomato_visits"

    id = Column(Integer, primary_key=True, autoincrement=False)  # id de tomatocr.com
    tree_id = Column(Integer, ForeignKey("tomato_trees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    height_cm = Column(Float, nullable=True)
    public_comment = Column(Text, nullable=True)

    tree = relationship("TomatoTree", back_populates="visits")
    photos = relationship("TomatoVisitPhoto", back_populates="visit", cascade="all, delete-orphan",
                          order_by="TomatoVisitPhoto.position")


class TomatoVisitPhoto(Base):
    __tablename__ = "tomato_visit_photos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    visit_id = Column(Integer, ForeignKey("tomato_visits.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)
    url = Column(String(1000), nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    visit = relationship("TomatoVisit", back_populates="photos")


class TomatoSyncRun(Base):
    __tablename__ = "tomato_sync_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    ok = Column(Boolean, nullable=False, default=False)
    trigger = Column(String(20), nullable=False, default="scheduled")  # scheduled | manual | startup
    received = Column(Integer, nullable=True)
    created = Column(Integer, nullable=True)
    updated = Column(Integer, nullable=True)
    deactivated = Column(Integer, nullable=True)
    http_status = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
