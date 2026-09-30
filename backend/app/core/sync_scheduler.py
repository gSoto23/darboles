"""Programador de la sincronización con tomatocr.com.

Va aparte de app/core/scheduler.py a propósito: ese archivo tiene un trabajo viejo de
envío automático de certificados que main.py deja apagado, y no debe encenderse aquí.
El backend corre con un solo proceso de Uvicorn, así que hay un único programador.
"""
import logging
import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionLocal
from app.services import tomato_sync

logger = logging.getLogger("darboles.tomato_sync")

_scheduler = None


def _job(trigger: str):
    tomato_sync.run_sync(SessionLocal, trigger=trigger)


def start():
    global _scheduler
    if _scheduler is not None:
        return
    if not tomato_sync.is_configured():
        logger.info("sincronización de TOMATO apagada: faltan TOMATO_SYNC_URL o TOMATO_SYNC_API_KEY")
        return
    hours = max(1, int(os.getenv("TOMATO_SYNC_INTERVAL_HOURS", 6)))
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(_job, "interval", hours=hours, args=["scheduled"], id="tomato_sync",
                       max_instances=1, coalesce=True)
    # Una corrida al arrancar, con un minuto de margen para que el backend termine de levantar
    _scheduler.add_job(_job, "date", run_date=datetime.utcnow() + timedelta(seconds=60), args=["startup"],
                       id="tomato_sync_startup")
    _scheduler.start()
    logger.info("sincronización de TOMATO cada %s h", hours)


def stop():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
