import csv
import io
import random
import string
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import ValidationError
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tracked_tree import TrackedTree
from app.models.tree import TreeSpecies
from app.models.user import User
from app.routers.auth import get_current_admin_user
from app.routers.tracking import normalize_code, planted_datetime
from app.schemas.tracking import AdminTrackedTreeCreate, AdminTrackedTreeRead

router = APIRouter()

MAX_CSV_ROWS = 2000
# Encabezados aceptados en el CSV (en español, como los llena el equipo) -> campo del esquema
CSV_COLUMNS = {
    "especie": "species",
    "latitud": "latitude",
    "longitud": "longitude",
    "fecha_siembra": "planted_on",
    "proyecto": "project_name",
    "origen": "origin",
    "responsable": "planter_name",
}


def _new_code(db: Session, prefix: str) -> str:
    while True:
        code = f"{prefix}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
        if not db.query(TrackedTree.id).filter(TrackedTree.id_code == code).first():
            return code


def _apply(db: Session, data: AdminTrackedTreeCreate) -> TrackedTree:
    if data.id_code:
        tree = db.query(TrackedTree).filter(TrackedTree.id_code == normalize_code(data.id_code)).first()
        if not tree:
            raise ValueError("Código no encontrado")
        if tree.status != "unregistered":
            raise ValueError("Ese código ya fue registrado")
    else:
        if not data.species_id or not db.get(TreeSpecies, data.species_id):
            raise ValueError("Especie no válida")
        prefix = "TOM" if data.origin == "tomato" else "DAR"
        tree = TrackedTree(id_code=_new_code(db, prefix), species_id=data.species_id)
        db.add(tree)

    tree.origin = data.origin
    tree.project_name = data.project_name
    tree.planter_name = data.planter_name
    tree.planter_email = data.planter_email
    tree.latitude = data.latitude
    tree.longitude = data.longitude
    tree.photo_url = data.photo_url
    tree.status = "planted"
    tree.planted_at = planted_datetime(data.planted_on)
    return tree


@router.get("", response_model=List[AdminTrackedTreeRead])
def list_tracked_trees(
    origin: Optional[str] = None,
    tree_status: Optional[str] = "planted",
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    query = db.query(TrackedTree)
    if origin:
        query = query.filter(TrackedTree.origin == origin)
    if tree_status:
        query = query.filter(TrackedTree.status == tree_status)
    return query.order_by(desc(TrackedTree.planted_at), desc(TrackedTree.id)).limit(min(limit, 2000)).all()


@router.post("", response_model=AdminTrackedTreeRead, status_code=status.HTTP_201_CREATED)
def create_tracked_tree(
    data: AdminTrackedTreeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    try:
        tree = _apply(db, data)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    db.commit()
    db.refresh(tree)
    return tree


@router.post("/import")
async def import_tracked_trees(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    # Excel en español suele exportar con punto y coma
    dialect = csv.Sniffer().sniff(text.splitlines()[0] if text else ",", delimiters=",;")
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    headers = {(h or "").strip().lower() for h in (reader.fieldnames or [])}
    missing = {"especie", "latitud", "longitud"} - headers
    if missing:
        raise HTTPException(status_code=400, detail=f"Faltan columnas: {', '.join(sorted(missing))}")

    species_by_name = {}
    for sp in db.query(TreeSpecies).all():
        species_by_name[sp.name.strip().lower()] = sp.id
        species_by_name[sp.scientific_name.strip().lower()] = sp.id

    errors, rows = [], []
    for line_no, row in enumerate(reader, start=2):
        if line_no - 1 > MAX_CSV_ROWS:
            raise HTTPException(status_code=400, detail=f"El archivo supera {MAX_CSV_ROWS} filas")
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        if not any(row.values()):
            continue
        values = {CSV_COLUMNS[k]: v for k, v in row.items() if k in CSV_COLUMNS and v}
        species_id = species_by_name.get(values.pop("species", "").lower())
        if not species_id:
            errors.append({"fila": line_no, "error": f"Especie desconocida: {row.get('especie')}"})
            continue
        values.setdefault("origin", "tomato")
        values["origin"] = values["origin"].lower()
        for key in ("latitude", "longitude"):
            if key in values:
                values[key] = values[key].replace(",", ".")
        try:
            rows.append(AdminTrackedTreeCreate(species_id=species_id, **values))
        except ValidationError as e:
            errors.append({"fila": line_no, "error": "; ".join(err["msg"].removeprefix("Value error, ") for err in e.errors())})

    # Todo o nada: si una fila falla no se carga ninguna, para no dejar proyectos a medias
    if errors:
        return {"imported": 0, "errors": errors}

    for data in rows:
        _apply(db, data)
    db.commit()
    return {"imported": len(rows), "errors": []}


@router.delete("/{tree_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tracked_tree(
    tree_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    tree = db.get(TrackedTree, tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Árbol no encontrado")
    if tree.gift_id:
        # Viene de un pedido: no se borra, se devuelve a "sin registrar" para que el código siga sirviendo
        tree.status = "unregistered"
        tree.latitude = tree.longitude = tree.planted_at = None
        tree.planter_name = tree.planter_email = tree.photo_url = None
        tree.origin = "guardian"
        tree.project_name = None
    else:
        db.delete(tree)
    db.commit()
