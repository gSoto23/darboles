import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.tree import TreeSpecies
from app.models.gift import Gift
from app.schemas.tree import TreeSpeciesCreate, TreeSpeciesResponse, TreeSpeciesUpdate
from app.schemas.gift import GiftRead, GiftStatusUpdate
from app.core.mailer import send_order_verified_email, send_order_delivered_email
from app.routers.auth import get_current_admin_user
from app.models.user import User
from typing import List
from datetime import datetime

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

@router.post("/trees", response_model=TreeSpeciesResponse, status_code=status.HTTP_201_CREATED)
def create_tree_species(tree: TreeSpeciesCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    db_tree = TreeSpecies(**tree.model_dump())
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return db_tree

@router.get("/trees", response_model=List[TreeSpeciesResponse])
def get_trees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Público a propósito: el catálogo de /regalos consume este endpoint sin sesión.
    trees = db.query(TreeSpecies).offset(skip).limit(limit).all()
    return trees

@router.patch("/trees/{tree_id}", response_model=TreeSpeciesResponse)
def update_tree(tree_id: int, tree_update: TreeSpeciesUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    db_tree = db.query(TreeSpecies).filter(TreeSpecies.id == tree_id).first()
    if not db_tree:
        raise HTTPException(status_code=404, detail="Especie no encontrada")

    update_data = tree_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tree, key, value)

    db.commit()
    db.refresh(db_tree)
    return db_tree

@router.post("/trees/upload-image")
async def upload_tree_image(file: UploadFile = File(...), current_user: User = Depends(get_current_admin_user)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPEG, PNG o WebP")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    upload_dir = os.path.join(os.getcwd(), "uploads", "trees")
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename to avoid overwrites; extension is derived from the
    # validated content-type, never trusted from the client filename.
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[file.content_type]
    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, new_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {"image_url": f"/api/uploads/trees/{new_filename}"}

@router.get("/gifts", response_model=List[GiftRead])
def get_gifts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    gifts = db.query(Gift).order_by(desc(Gift.id)).offset(skip).limit(limit).all()
    return gifts

@router.patch("/gifts/{gift_id}/status", response_model=GiftRead)
def update_gift_status(gift_id: int, status_update: GiftStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    db_gift = db.query(Gift).filter(Gift.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    db_gift.status = status_update.status
    db.commit()
    db.refresh(db_gift)
    
    # Enviar notificaciones o generar certificados basados en el nuevo estado
    tree_name = db_gift.tree.name if db_gift.tree else "Árbol"
    if status_update.status == "paid":
        send_order_verified_email(
            to_email=db_gift.buyer_email,
            buyer_name=db_gift.buyer_name,
            order_id=str(db_gift.id)
        )
    elif status_update.status == "delivered":
        from app.services.pdf_generator import generate_gift_certificate
        from app.core.mailer import send_certificate_email
        from app.models.tracked_tree import TrackedTree
        import string
        import random

        # Generar TrackedTrees si no existen
        if not db_gift.tracked_trees:
            prefix = db_gift.campaign.prefix if db_gift.campaign else "DAR"
            for i in range(db_gift.quantity):
                suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                unique_code = f"{prefix}-{suffix}"
                
                new_tree = TrackedTree(
                    id_code=unique_code,
                    gift_id=db_gift.id,
                    species_id=db_gift.tree_id,
                    status="unregistered"
                )
                db.add(new_tree)
            db.commit()
            db.refresh(db_gift)

        pdf_paths = []
        for tracked_tree in db_gift.tracked_trees:
            pdf_path = generate_gift_certificate(db_gift, db_gift.tree, tracked_tree)
            pdf_paths.append(pdf_path)

        db_gift.certificate_url = ",".join(pdf_paths)
        db_gift.certificate_sent_at = datetime.utcnow()
        db.commit()

        # Send to Recipient
        send_certificate_email(
            to_email=db_gift.recipient_email,
            subject=f"Tu regalo botánico de {db_gift.buyer_name} ha llegado",
            gift=db_gift,
            tree_name=tree_name,
            attachment_path=pdf_paths
        )

    return db_gift

@router.post("/gifts/{gift_id}/resend-certificate", response_model=GiftRead)
def resend_gift_certificate(gift_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    db_gift = db.query(Gift).filter(Gift.id == gift_id).first()
    if not db_gift or db_gift.status != "delivered":
        raise HTTPException(status_code=400, detail="Pedido no encontrado o no entregado aún")

    from app.services.pdf_generator import generate_gift_certificate
    from app.core.mailer import send_certificate_email

    pdf_paths = []
    for tracked_tree in db_gift.tracked_trees:
        pdf_path = generate_gift_certificate(db_gift, db_gift.tree, tracked_tree)
        pdf_paths.append(pdf_path)

    db_gift.certificate_url = ",".join(pdf_paths)
    db_gift.certificate_sent_at = datetime.utcnow()
    db.commit()

    tree_name = db_gift.tree.name if db_gift.tree else "Árbol"
    send_certificate_email(
        to_email=db_gift.recipient_email,
        subject=f"Tu regalo botánico de {db_gift.buyer_name} ha llegado",
        gift=db_gift,
        tree_name=tree_name,
        attachment_path=pdf_paths
    )

    db.refresh(db_gift)
    return db_gift
