from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, admin, admin_tracking, leads, payments, tomato, tracking, inventory, admin_users, config
from app.models import user, tree, gift, config as config_model, campaign, tracked_tree, tomato as tomato_model
# from app.core.scheduler import start_scheduler
from fastapi.staticfiles import StaticFiles
import os
import logging

logging.basicConfig(level=logging.INFO)

# Using Alembic for database migrations instead of create_all()

app = FastAPI(
    title="Darboles API",
    description="Backend API for Darboles - Environmental Regeneration Platform",
    version="0.1.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000",
        "https://darboles.com",
        "https://www.darboles.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Sincronización de árboles con tomatocr.com; no hace nada si faltan sus variables
    from app.core import sync_scheduler
    sync_scheduler.start()


@app.on_event("shutdown")
def on_shutdown():
    from app.core import sync_scheduler
    sync_scheduler.stop()

os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(admin_tracking.router, prefix="/api/v1/admin/tracking", tags=["Admin Tracking"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(leads.router, prefix="/api/v1", tags=["Leads"])
app.include_router(tomato.router, prefix="/api/v1/tomato", tags=["TOMATO"])
app.include_router(tomato.admin_router, prefix="/api/v1/admin", tags=["TOMATO"])
app.include_router(inventory.router, prefix="/api/v1", tags=["Inventory"])
app.include_router(admin_users.router, prefix="/api/v1", tags=["Admin Users"])
app.include_router(config.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Darboles API. Ecosistema de reconexión ambiental vivo."}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
