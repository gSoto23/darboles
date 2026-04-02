from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, admin
from app.models import user, tree

# Create tables (minimalist approach vs alembic for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Darboles API",
    description="Backend API for Darboles - Environmental Regeneration Platform",
    version="0.1.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Darboles API. Ecosistema de reconexión ambiental vivo."}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
