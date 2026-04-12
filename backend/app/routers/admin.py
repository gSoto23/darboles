from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.tree import TreeSpecies
from app.models.gift import Gift
from app.schemas.tree import TreeSpeciesCreate, TreeSpeciesResponse, TreeSpeciesUpdate
from app.schemas.gift import GiftRead, GiftStatusUpdate
from app.core.mailer import send_order_verified_email, send_order_delivered_email
from typing import List

router = APIRouter()

# En un sistema en producción real, aquí inyectaríamos un dependency `get_current_admin_user`
# para asegurar que sólo el administrador pueda crear estas especies.

@router.post("/trees", response_model=TreeSpeciesResponse, status_code=status.HTTP_201_CREATED)
def create_tree_species(tree: TreeSpeciesCreate, db: Session = Depends(get_db)):
    db_tree = TreeSpecies(**tree.model_dump())
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return db_tree

@router.get("/trees", response_model=List[TreeSpeciesResponse])
def get_trees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    trees = db.query(TreeSpecies).offset(skip).limit(limit).all()
    return trees

@router.patch("/trees/{tree_id}", response_model=TreeSpeciesResponse)
def update_tree(tree_id: int, tree_update: TreeSpeciesUpdate, db: Session = Depends(get_db)):
    db_tree = db.query(TreeSpecies).filter(TreeSpecies.id == tree_id).first()
    if not db_tree:
        raise HTTPException(status_code=404, detail="Especie no encontrada")
    
    update_data = tree_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tree, key, value)
        
    db.commit()
    db.refresh(db_tree)
    return db_tree

@router.get("/gifts", response_model=List[GiftRead])
def get_gifts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gifts = db.query(Gift).order_by(desc(Gift.id)).offset(skip).limit(limit).all()
    return gifts

@router.patch("/gifts/{gift_id}/status", response_model=GiftRead)
def update_gift_status(gift_id: int, status_update: GiftStatusUpdate, db: Session = Depends(get_db)):
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

        pdf_path = generate_gift_certificate(db_gift, db_gift.tree)
        db_gift.certificate_url = pdf_path
        db.commit()

        # Send to Recipient
        send_certificate_email(
            to_email=db_gift.recipient_email,
            subject=f"Tu regalo botánico de {db_gift.buyer_name} ha llegado",
            gift=db_gift,
            tree_name=tree_name,
            attachment_path=pdf_path
        )

    return db_gift
