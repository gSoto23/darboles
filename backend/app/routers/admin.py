from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tree import TreeSpecies
from app.schemas.tree import TreeSpeciesCreate, TreeSpeciesResponse
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
