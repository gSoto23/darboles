from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.uploads import save_image
from app.models.tracked_tree import TrackedTree
from app.schemas.tracking import TrackedTreeResponse, TrackedTreeEnroll
from typing import List
from datetime import datetime, time

router = APIRouter()


def normalize_code(id_code: str) -> str:
    # En el certificado el código se lee a mano: toleramos minúsculas y espacios
    return id_code.strip().upper().replace(" ", "")


def planted_datetime(planted_on) -> datetime:
    return datetime.combine(planted_on, time(12, 0)) if planted_on else datetime.utcnow()


@router.get("/public/map", response_model=List[TrackedTreeResponse])
def get_map_trees(db: Session = Depends(get_db)):
    return db.query(TrackedTree).filter(
        TrackedTree.status == "planted",
        TrackedTree.latitude.isnot(None),
        TrackedTree.longitude.isnot(None),
    ).all()

@router.post("/upload-image")
async def upload_tracking_image(file: UploadFile = File(...)):
    return {"image_url": await save_image(file, "tracking")}

@router.get("/{id_code}", response_model=TrackedTreeResponse)
def get_tracked_tree(id_code: str, db: Session = Depends(get_db)):
    tree = db.query(TrackedTree).filter(TrackedTree.id_code == normalize_code(id_code)).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Código de árbol no encontrado")
    return tree

@router.get("/{id_code}/certificate")
def download_certificate(id_code: str, db: Session = Depends(get_db)):
    tree = db.query(TrackedTree).filter(TrackedTree.id_code == normalize_code(id_code)).first()
    if not tree or not tree.gift:
        raise HTTPException(status_code=404, detail="Certificado no encontrado")
        
    from app.services.pdf_generator import generate_gift_certificate
    pdf_path = generate_gift_certificate(tree.gift, tree.gift.tree, tree)
    return FileResponse(path=pdf_path, filename=f"Certificado_Darboles_{tree.id_code}.pdf", media_type="application/pdf")

@router.post("/{id_code}/enroll", response_model=TrackedTreeResponse)
def enroll_tree(id_code: str, data: TrackedTreeEnroll, db: Session = Depends(get_db)):
    tree = db.query(TrackedTree).filter(TrackedTree.id_code == normalize_code(id_code)).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    if tree.status != "unregistered":
        raise HTTPException(status_code=400, detail="Este árbol ya fue registrado")
        
    tree.planter_name = data.planter_name
    tree.planter_email = data.planter_email
    tree.latitude = data.latitude
    tree.longitude = data.longitude
    tree.photo_url = data.photo_url
    tree.origin = "guardian"
    tree.status = "planted"
    tree.planted_at = planted_datetime(data.planted_on)
    
    db.commit()
    db.refresh(tree)
    return tree
