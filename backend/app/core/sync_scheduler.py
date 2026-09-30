"""Programador de la sincronización con tomatocr.com: una vez al día.

Va aparte de app/core/scheduler.py a propósito: ese archivo tiene un trabajo viejo de
envío automático de certificados que main.py deja apagado, y no debe encenderse aquí.
El backend corre con un solo proceso de Uvicorn, así que hay un único programador.
"""
import logging
import os
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal
from app.services import tomato_sync

logger = logging.getLogger("darboles.tomato_sync")

TIMEZONE = "America/Costa_Rica"
_scheduler = None


def sync_hour() -> int:
    """Hora (de Costa Rica) de la sincronización diaria; por defecto las 3:00, sin tráfico."""
    try:
        hour = int(os.getenv("TOMATO_SYNC_HOUR", 3))
    except ValueError:
        hour = 3
    return hour if 0 <= hour <= 23 else 3


def _job(trigger: str):
    tomato_sync.run_sync(SessionLocal, trigger=trigger)


def _startup_job():
    # Solo si la última sincronización exitosa tiene más de un día (o nunca hubo):
    # así un deploy o un reinicio no suma corridas extra.
    db = SessionLocal()
    try:
        last = tomato_sync.last_success(db)
    finally:
        db.close()
    if last and last.finished_at and datetime.utcnow() - last.finished_at < timedelta(hours=24):
        logger.info("sincronización de TOMATO: la última tiene menos de 24 h; se espera a la corrida diaria")
        return
    _job("startup")


def start():
    global _scheduler
    if _scheduler is not None:
        return
    if not tomato_sync.is_configured():
        logger.info("sincronización de TOMATO apagada: faltan TOMATO_SYNC_URL o TOMATO_SYNC_API_KEY")
        return
    hour = sync_hour()
    _scheduler = BackgroundScheduler(timezone=TIMEZONE)
    _scheduler.add_job(_job, CronTrigger(hour=hour, minute=0, timezone=TIMEZONE), args=["scheduled"],
                       id="tomato_sync", max_instances=1, coalesce=True, misfire_grace_time=3600)
    # Un minuto después de arrancar, para que el backend termine de levantar
    _scheduler.add_job(_startup_job, "date", run_date=datetime.now(timezone.utc) + timedelta(seconds=60), id="tomato_sync_startup")
    _scheduler.start()
    logger.info("sincronización de TOMATO una vez al día a las %02d:00 (hora de Costa Rica)", hour)


def stop():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
