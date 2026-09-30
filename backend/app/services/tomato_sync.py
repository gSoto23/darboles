"""Sincronización de árboles de TOMATO desde tomatocr.com (solo lectura).

Hace siempre una foto completa: descarga todas las páginas de GET /api/darboles/trees,
valida todo y recién entonces aplica los cambios en una sola transacción. Los árboles que
ya no vienen se dan de baja (active=False). Si algo falla, no toca los datos y deja el
error en tomato_sync_runs. Contrato: docs/INTEGRACION_TOMATOCR.md.

Uso manual:  python -m app.services.tomato_sync
"""
import logging
import os
import threading
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Callable, List, Optional

import httpx
from sqlalchemy.orm import Session

from app.models.tomato import TomatoSyncRun, TomatoTree, TomatoVisit, TomatoVisitPhoto

logger = logging.getLogger("darboles.tomato_sync")

PAGE_LIMIT = 1000
TIMEOUT_SECONDS = 20.0
RETRY_DELAYS = (2, 4, 8)  # espera creciente entre reintentos
MAX_PAGES = 200  # tope de seguridad por si el cursor nunca termina

STATUSES = {"sin_verificar", "vivo", "muerto", "reemplazado"}
PRECISIONS = {"sector", "tree"}

_lock = threading.Lock()


class SyncError(Exception):
    def __init__(self, message: str, http_status: Optional[int] = None):
        super().__init__(message)
        self.http_status = http_status


@dataclass
class SyncResult:
    ok: bool
    received: int = 0
    created: int = 0
    updated: int = 0
    deactivated: int = 0
    http_status: Optional[int] = None
    error: Optional[str] = None
    busy: bool = False


def sync_config():
    url = os.getenv("TOMATO_SYNC_URL", "").strip()
    key = os.getenv("TOMATO_SYNC_API_KEY", "").strip()
    return url, key


def is_configured() -> bool:
    url, key = sync_config()
    return bool(url and key)


# --- Descarga -------------------------------------------------------------------------

def _get_page(client: httpx.Client, url: str, key: str, cursor: Optional[str], sleep: Callable) -> dict:
    params = {"limit": PAGE_LIMIT}
    if cursor is not None:
        params["cursor"] = cursor
    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        if attempt:
            sleep(RETRY_DELAYS[attempt - 1])
        try:
            response = client.get(url, params=params, headers={"X-API-Key": key})
        except httpx.TimeoutException:
            last_error = SyncError(f"tomatocr.com no respondió en {int(TIMEOUT_SECONDS)} s")
            continue
        except httpx.HTTPError as e:
            last_error = SyncError(f"sin conexión con tomatocr.com ({type(e).__name__})")
            continue

        code = response.status_code
        if code == 200:
            try:
                data = response.json()
            except ValueError:
                raise SyncError("tomatocr.com respondió algo que no es JSON", code)
            if not isinstance(data, dict) or not isinstance(data.get("trees"), list):
                raise SyncError("respuesta sin la lista 'trees'", code)
            return data
        if code == 401:
            raise SyncError("tomatocr.com rechazó la clave (401): TOMATO_SYNC_API_KEY debe ser igual a DARBOLES_SYNC_API_KEY", code)
        if code == 503:
            raise SyncError("tomatocr.com no tiene la sincronización configurada (503)", code)
        if code in (400, 422):
            raise SyncError(f"tomatocr.com rechazó los parámetros ({code})", code)
        # 5xx u otro: vale la pena reintentar
        last_error = SyncError(f"tomatocr.com respondió {code}", code)
    raise last_error


def fetch_all(transport: Optional[httpx.BaseTransport] = None, sleep: Callable = time.sleep) -> List[dict]:
    url, key = sync_config()
    if not url or not key:
        raise SyncError("sincronización sin configurar (TOMATO_SYNC_URL / TOMATO_SYNC_API_KEY)")
    trees, cursor, seen_cursors = [], None, set()
    with httpx.Client(timeout=TIMEOUT_SECONDS, transport=transport) as client:
        for _ in range(MAX_PAGES):
            page = _get_page(client, url, key, cursor, sleep)
            trees.extend(page["trees"])
            cursor = page.get("next_cursor")
            if cursor is None:
                return trees
            cursor = str(cursor)
            if cursor in seen_cursors:
                raise SyncError("tomatocr.com repitió un cursor; se cancela para no quedar en un ciclo")
            seen_cursors.add(cursor)
    raise SyncError(f"más de {MAX_PAGES} páginas; se cancela")


# --- Validación -----------------------------------------------------------------------

def _date(value, field) -> Optional[date]:
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        raise SyncError(f"fecha inválida en {field}: {value!r}")


def _datetime(value, field) -> Optional[datetime]:
    if value in (None, ""):
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        raise SyncError(f"fecha y hora inválida en {field}: {value!r}")
    return parsed.astimezone(timezone.utc).replace(tzinfo=None) if parsed.tzinfo else parsed


def _int(value, field, required=False) -> Optional[int]:
    if value is None and not required:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise SyncError(f"número inválido en {field}: {value!r}")
    return value


def _number(value, field, required=False) -> Optional[float]:
    if value is None and not required:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SyncError(f"número inválido en {field}: {value!r}")
    return float(value)


def _text(value, limit) -> Optional[str]:
    if value is None:
        return None
    return str(value)[:limit]


def parse_tree(raw: dict) -> dict:
    """Valida un árbol del contrato. Cualquier dato roto cancela la sincronización completa:
    si se saltara el árbol, la foto completa lo daría de baja por error."""
    if not isinstance(raw, dict):
        raise SyncError("árbol que no es un objeto")
    tree_id = _int(raw.get("id"), "id", required=True)
    where = f"árbol {tree_id}"
    project = raw.get("project")
    if not isinstance(project, dict):
        raise SyncError(f"{where}: falta 'project'")
    status = raw.get("status")
    if status not in STATUSES:
        raise SyncError(f"{where}: estado desconocido {status!r}")
    precision = raw.get("location_precision") or "sector"
    if precision not in PRECISIONS:
        raise SyncError(f"{where}: location_precision desconocida {precision!r}")

    visits = []
    for v in raw.get("visits") or []:
        if not isinstance(v, dict):
            raise SyncError(f"{where}: visita que no es un objeto")
        visit_status = v.get("status")
        if visit_status not in STATUSES:
            raise SyncError(f"{where}: visita con estado desconocido {visit_status!r}")
        visit_date = _date(v.get("date"), f"{where}.visits.date")
        if visit_date is None:
            raise SyncError(f"{where}: visita sin fecha")
        photos = []
        for p in v.get("photos") or []:
            if not isinstance(p, dict) or not str(p.get("url") or "").startswith(("https://", "http://")):
                raise SyncError(f"{where}: foto sin URL válida")
            photos.append({"url": str(p["url"])[:1000],
                           "width": _int(p.get("width"), f"{where}.photos.width"),
                           "height": _int(p.get("height"), f"{where}.photos.height")})
        visits.append({
            "id": _int(v.get("id"), f"{where}.visits.id", required=True),
            "date": visit_date,
            "status": visit_status,
            "height_cm": _number(v.get("height_cm"), f"{where}.visits.height_cm"),
            "public_comment": _text(v.get("public_comment"), 500),
            "photos": photos,
        })

    return {
        "id": tree_id,
        "project_id": _int(project.get("id"), f"{where}.project.id", required=True),
        "project_name": _text(project.get("name"), 255) or "Proyecto institucional",
        "project_public": project.get("public") is True,
        "tree_number": _int(raw.get("tree_number"), f"{where}.tree_number"),
        "species": _text(raw.get("species"), 255),
        "sector": _text(raw.get("sector"), 255),
        "lat": _number(raw.get("lat"), f"{where}.lat", required=True),
        "lng": _number(raw.get("lng"), f"{where}.lng", required=True),
        "location_precision": precision,
        "date_planted": _date(raw.get("date_planted"), f"{where}.date_planted"),
        "status": status,
        "last_checked_at": _date(raw.get("last_checked_at"), f"{where}.last_checked_at"),
        "replaced_by_id": _int(raw.get("replaced_by_id"), f"{where}.replaced_by_id"),
        "updated_at": _datetime(raw.get("updated_at"), f"{where}.updated_at"),
        "visits": visits,
    }


# --- Aplicación -----------------------------------------------------------------------

TREE_FIELDS = ("project_id", "project_name", "project_public", "tree_number", "species", "sector", "lat", "lng",
               "location_precision", "date_planted", "status", "last_checked_at", "replaced_by_id", "updated_at")


def _visits_snapshot(tree: TomatoTree):
    return [(v.id, v.date, v.status, v.height_cm, v.public_comment,
             [(p.url, p.width, p.height) for p in v.photos]) for v in tree.visits]


def _apply_visits(db: Session, tree: TomatoTree, visits: List[dict]):
    # Se actualizan por id (no borrar y recrear: la misma clave primaria chocaría en el flush)
    existing = {v.id: v for v in tree.visits}
    keep = set()
    for data in visits:
        visit = existing.get(data["id"])
        if visit is None:
            visit = TomatoVisit(id=data["id"])
            tree.visits.append(visit)
        keep.add(data["id"])
        visit.date, visit.status = data["date"], data["status"]
        visit.height_cm, visit.public_comment = data["height_cm"], data["public_comment"]
        # Las fotos no tienen id en el contrato: se reemplazan completas
        visit.photos[:] = [TomatoVisitPhoto(position=i, url=p["url"], width=p["width"], height=p["height"])
                           for i, p in enumerate(data["photos"])]
    for visit_id, visit in existing.items():
        if visit_id not in keep:
            tree.visits.remove(visit)


def apply_snapshot(db: Session, raw_trees: List[dict]) -> SyncResult:
    parsed = [parse_tree(raw) for raw in raw_trees]  # valida TODO antes de tocar la base
    ids = [t["id"] for t in parsed]
    if len(ids) != len(set(ids)):
        raise SyncError("tomatocr.com envió árboles repetidos")

    now = datetime.utcnow()
    existing = {t.id: t for t in db.query(TomatoTree).all()}
    result = SyncResult(ok=True, received=len(parsed))

    for data in parsed:
        tree = existing.get(data["id"])
        is_new = tree is None
        if is_new:
            tree = TomatoTree(id=data["id"])
            db.add(tree)
            before = None
        else:
            before = (tuple(getattr(tree, f) for f in TREE_FIELDS), tree.active, _visits_snapshot(tree))
        for f in TREE_FIELDS:
            setattr(tree, f, data[f])
        tree.active = True
        tree.synced_at = now
        _apply_visits(db, tree, data["visits"])
        if is_new:
            result.created += 1
        else:
            db.flush()
            after = (tuple(getattr(tree, f) for f in TREE_FIELDS), tree.active, _visits_snapshot(tree))
            if after != before:
                result.updated += 1

    incoming = set(ids)
    for tree_id, tree in existing.items():
        if tree_id not in incoming and tree.active:
            tree.active = False
            result.deactivated += 1
    return result


# --- Orquestación ---------------------------------------------------------------------

def run_sync(db_factory, trigger: str = "scheduled", transport: Optional[httpx.BaseTransport] = None,
             sleep: Callable = time.sleep) -> SyncResult:
    if not _lock.acquire(blocking=False):
        return SyncResult(ok=False, busy=True, error="ya hay una sincronización en curso")
    try:
        db: Session = db_factory()
        run = TomatoSyncRun(trigger=trigger, started_at=datetime.utcnow())
        db.add(run)
        db.commit()
        try:
            raw = fetch_all(transport=transport, sleep=sleep)
            result = apply_snapshot(db, raw)
            run.ok, run.received, run.created = True, result.received, result.created
            run.updated, run.deactivated = result.updated, result.deactivated
            run.finished_at = datetime.utcnow()
            db.commit()
            logger.info("sincronización de TOMATO: %s árboles (%s nuevos, %s cambiados, %s dados de baja)",
                        result.received, result.created, result.updated, result.deactivated)
            return result
        except Exception as e:
            db.rollback()  # los datos anteriores quedan intactos
            http_status = e.http_status if isinstance(e, SyncError) else None
            message = str(e) if isinstance(e, SyncError) else f"error inesperado: {type(e).__name__}"
            run = db.get(TomatoSyncRun, run.id)
            run.ok, run.http_status, run.error, run.finished_at = False, http_status, message, datetime.utcnow()
            db.commit()
            (logger.error if http_status == 401 or not isinstance(e, SyncError) else logger.warning)(
                "sincronización de TOMATO falló: %s", message)
            if not isinstance(e, SyncError):
                logger.exception("detalle del error inesperado")
            return SyncResult(ok=False, http_status=http_status, error=message)
        finally:
            db.close()
    finally:
        _lock.release()


def last_runs(db: Session, limit: int = 1):
    return db.query(TomatoSyncRun).order_by(TomatoSyncRun.id.desc()).limit(limit).all()


def last_success(db: Session) -> Optional[TomatoSyncRun]:
    return db.query(TomatoSyncRun).filter(TomatoSyncRun.ok.is_(True)).order_by(TomatoSyncRun.id.desc()).first()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from app.core.database import SessionLocal
    import app.models.campaign, app.models.config, app.models.gift, app.models.tracked_tree  # noqa: F401,E401 (registra modelos)
    import app.models.tree, app.models.user, app.models.tomato  # noqa: F401,E401
    outcome = run_sync(SessionLocal, trigger="manual")
    print(outcome)
    raise SystemExit(0 if outcome.ok else 1)
