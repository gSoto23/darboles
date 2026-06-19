from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.tracked_tree import TrackedTree
from app.schemas.tracking import TrackedTreeResponse, TrackedTreeEnroll
from typing import List
import os
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/public/map", response_model=List[TrackedTreeResponse])
def get_map_trees(db: Session = Depends(get_db)):
    trees = db.query(TrackedTree).filter(TrackedTree.status == "planted").all()
    res = []
    for tree in trees:
        res.append({
            "id_code": tree.id_code,
            "species_name": tree.species.name,
            "species_scientific_name": tree.species.scientific_name,
            "status": tree.status,
            "planted_at": tree.planted_at,
            "latitude": tree.latitude,
            "longitude": tree.longitude,
            "planter_name": tree.planter_name,
            "photo_url": tree.photo_url
        })
    return res

@router.post("/upload-image")
async def upload_tracking_image(file: UploadFile = File(...)):
    upload_dir = os.path.join(os.getcwd(), "uploads", "tracking")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, new_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    return {"image_url": f"/api/uploads/tracking/{new_filename}"}

@router.get("/{id_code}", response_model=TrackedTreeResponse)
def get_tracked_tree(id_code: str, db: Session = Depends(get_db)):
    tree = db.query(TrackedTree).filter(TrackedTree.id_code == id_code).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Código de árbol no encontrado")
        
    return {
        "id_code": tree.id_code,
        "species_name": tree.species.name,
        "species_scientific_name": tree.species.scientific_name,
        "status": tree.status,
        "planted_at": tree.planted_at,
        "latitude": tree.latitude,
        "longitude": tree.longitude,
        "planter_name": tree.planter_name,
        "photo_url": tree.photo_url
    }

@router.post("/{id_code}/enroll", response_model=TrackedTreeResponse)
def enroll_tree(id_code: str, data: TrackedTreeEnroll, db: Session = Depends(get_db)):
    tree = db.query(TrackedTree).filter(TrackedTree.id_code == id_code).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    if tree.status != "unregistered":
        raise HTTPException(status_code=400, detail="Este árbol ya fue matriculado")
        
    tree.planter_name = data.planter_name
    tree.planter_email = data.planter_email
    tree.latitude = data.latitude
    tree.longitude = data.longitude
    tree.photo_url = data.photo_url
    tree.status = "planted"
    tree.planted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tree)
    
    return {
        "id_code": tree.id_code,
        "species_name": tree.species.name,
        "species_scientific_name": tree.species.scientific_name,
        "status": tree.status,
        "planted_at": tree.planted_at,
        "latitude": tree.latitude,
        "longitude": tree.longitude,
        "planter_name": tree.planter_name,
        "photo_url": tree.photo_url
    }
