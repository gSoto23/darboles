"""Árboles de proyectos de TOMATO (copiados de tomatocr.com) para el mapa y la ficha.

Solo se devuelve lo que llegó por el contrato; no se agregan campos. La fecha de siembra
se entrega solo como año: en algunos proyectos es un valor de la importación, no la real.
"""
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models.tomato import TomatoTree
from app.models.user import User
from app.routers.auth import get_current_admin_user
from app.services import tomato_sync

router = APIRouter()
admin_router = APIRouter()


def _year(tree: TomatoTree) -> Optional[int]:
    return tree.date_planted.year if tree.date_planted else None


def _map_item(tree: TomatoTree) -> dict:
    return {
        "id": tree.id,
        "tree_number": tree.tree_number,
        "lat": tree.lat,
        "lng": tree.lng,
        "status": tree.status,
        "species": tree.species,
        "sector": tree.sector,
        "project": tree.project_name,
        "location_precision": tree.location_precision,
    }


@router.get("/trees/map")
def tomato_map(db: Session = Depends(get_db)):
    # Los reemplazados no se dibujan: en su lugar aparece el árbol nuevo
    trees = db.query(TomatoTree).filter(TomatoTree.active.is_(True), TomatoTree.status != "reemplazado").all()
    return [_map_item(t) for t in trees]


@router.get("/trees/{tree_id}")
def tomato_tree(tree_id: int, db: Session = Depends(get_db)):
    tree = db.get(TomatoTree, tree_id)
    if not tree or not tree.active:
        raise HTTPException(status_code=404, detail="Árbol no encontrado")

    public = tree.project_public
    replacement = db.get(TomatoTree, tree.replaced_by_id) if tree.replaced_by_id else None
    return {
        **_map_item(tree),
        "project_public": public,
        "planted_year": _year(tree),
        "last_checked_at": tree.last_checked_at.isoformat() if tree.last_checked_at else None,
        "replaced_by": {"id": replacement.id, "species": replacement.species}
        if replacement and replacement.active else None,
        "visits": [{
            "id": v.id,
            "date": v.date.isoformat(),
            "status": v.status,
            "height_cm": v.height_cm,
            # tomatocr.com ya los omite en proyectos no públicos; se vuelve a cuidar aquí por si acaso
            "public_comment": v.public_comment if public else None,
            "photos": [{"url": p.url, "width": p.width, "height": p.height} for p in v.photos] if public else [],
        } for v in tree.visits],
        "synced_at": tree.synced_at.isoformat() + "Z" if tree.synced_at else None,
    }


# --- Admin ----------------------------------------------------------------------------

def _run_dict(run) -> Optional[dict]:
    if not run:
        return None
    return {
        "started_at": run.started_at.isoformat() + "Z",
        "finished_at": run.finished_at.isoformat() + "Z" if run.finished_at else None,
        "ok": run.ok,
        "trigger": run.trigger,
        "received": run.received,
        "created": run.created,
        "updated": run.updated,
        "deactivated": run.deactivated,
        "http_status": run.http_status,
        "error": run.error,
    }


@admin_router.get("/tomato/sync")
def sync_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    last = tomato_sync.last_runs(db, 1)
    return {
        "configured": tomato_sync.is_configured(),
        "last_run": _run_dict(last[0] if last else None),
        "last_success": _run_dict(tomato_sync.last_success(db)),
        "active_trees": db.query(TomatoTree).filter(TomatoTree.active.is_(True)).count(),
    }


@admin_router.post("/tomato/sync", status_code=202)
def sync_now(background: BackgroundTasks, current_user: User = Depends(get_current_admin_user)):
    if not tomato_sync.is_configured():
        raise HTTPException(status_code=400, detail="Falta configurar TOMATO_SYNC_URL y TOMATO_SYNC_API_KEY")
    # Corre en segundo plano (puede tardar si hay reintentos); el admin consulta el estado con GET
    background.add_task(tomato_sync.run_sync, SessionLocal, "manual")
    return {"started": True}
