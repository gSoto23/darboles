"""Sincronización de árboles de TOMATO (docs/INTEGRACION_TOMATOCR.md).

tomatocr.com se simula con httpx.MockTransport: ninguna prueba sale a la red.
"""
import copy

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import campaign, config, gift, tracked_tree, tree, user  # noqa: F401 (registra modelos)
from app.models.tomato import TomatoSyncRun, TomatoTree, TomatoVisit
from app.routers.auth import get_current_admin_user
from app.services import tomato_sync

URL = "http://tomato.test/api/darboles/trees"
KEY = "clave-sync-de-prueba"


def make_tree(tree_id, **over):
    data = {
        "id": tree_id,
        "project": {"id": 7, "name": "Municipalidad de Alajuela", "public": True},
        "tree_number": tree_id,
        "species": "Guachipelín",
        "sector": "Parque Lisboa",
        "lat": 10.003501,
        "lng": -84.244167,
        "location_precision": "sector",
        "date_planted": "2024-06-01",
        "status": "sin_verificar",
        "last_checked_at": None,
        "replaced_by_id": None,
        "updated_at": "2026-10-12T15:00:00Z",
        "visits": [],
    }
    data.update(over)
    return data


VISIT = {"id": 88, "date": "2026-10-12", "status": "vivo", "height_cm": 85.0,
         "public_comment": "Buen crecimiento, se retiró maleza alrededor.",
         "photos": [{"url": "https://media.test/a.jpg", "width": 1600, "height": 1200},
                    {"url": "https://media.test/b.jpg", "width": None, "height": None}]}


class FakeTomato:
    """Hace de tomatocr.com. `pages` es la lista de páginas (listas de árboles) que devuelve en orden."""

    def __init__(self, pages=None, status=200, fail_on_page=None, exc=None):
        self.pages = pages if pages is not None else [[]]
        self.status, self.fail_on_page, self.exc = status, fail_on_page, exc
        self.requests = []

    def handler(self, request: httpx.Request):
        self.requests.append(request)
        cursor = request.url.params.get("cursor")
        index = int(cursor) if cursor else 0
        if self.fail_on_page is not None and index == self.fail_on_page:
            if self.exc:
                raise self.exc
            return httpx.Response(self.status, json={"detail": "error"})
        if self.status != 200 and self.fail_on_page is None:
            return httpx.Response(self.status, json={"detail": "error"})
        next_cursor = str(index + 1) if index + 1 < len(self.pages) else None
        return httpx.Response(200, json={"generated_at": "2026-10-12T15:04:05Z", "next_cursor": next_cursor,
                                         "trees": self.pages[index]})

    @property
    def transport(self):
        return httpx.MockTransport(self.handler)


@pytest.fixture
def db_factory(monkeypatch):
    monkeypatch.setenv("TOMATO_SYNC_URL", URL)
    monkeypatch.setenv("TOMATO_SYNC_API_KEY", KEY)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    yield factory
    engine.dispose()


def sync(factory, fake, sleeps=None):
    waited = sleeps if sleeps is not None else []
    return tomato_sync.run_sync(factory, trigger="manual", transport=fake.transport, sleep=waited.append)


# --- Éxito y paginación ---------------------------------------------------------------

def test_full_sync_multiple_pages_with_cursor_and_key(db_factory):
    fake = FakeTomato(pages=[[make_tree(1), make_tree(2)], [make_tree(3)]])
    result = sync(db_factory, fake)

    assert result.ok and result.received == 3 and result.created == 3
    assert [r.url.params.get("cursor") for r in fake.requests] == [None, "1"]
    assert all(r.headers["X-API-Key"] == KEY for r in fake.requests)
    assert all(r.url.params["limit"] == "1000" for r in fake.requests)
    assert all("updated_since" not in r.url.params for r in fake.requests)  # siempre foto completa
    db = db_factory()
    assert db.query(TomatoTree).count() == 3
    run = db.query(TomatoSyncRun).one()
    assert run.ok and run.received == 3 and run.finished_at is not None


def test_visits_and_photos_are_stored_most_recent_first(db_factory):
    older = {**VISIT, "id": 70, "date": "2026-06-01", "photos": []}
    sync(db_factory, FakeTomato(pages=[[make_tree(1, status="vivo", visits=[VISIT, older])]]))
    db = db_factory()
    t = db.get(TomatoTree, 1)
    assert [v.id for v in t.visits] == [88, 70]
    assert [(p.url, p.width) for p in t.visits[0].photos] == [("https://media.test/a.jpg", 1600), ("https://media.test/b.jpg", None)]


def test_second_sync_updates_changes_and_counts_only_real_changes(db_factory):
    sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2)]]))
    visit = {**VISIT, "photos": VISIT["photos"][:1]}
    result = sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2, status="vivo", visits=[visit])]]))
    assert result.ok and result.created == 0 and result.updated == 1 and result.deactivated == 0
    # Y una tercera, sin cambios, no cuenta nada como actualizado; las visitas se actualizan por id
    visit2 = {**visit, "public_comment": "Otro comentario"}
    result = sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2, status="vivo", visits=[visit2])]]))
    assert result.updated == 1
    db = db_factory()
    assert db.query(TomatoVisit).count() == 1
    assert db.get(TomatoVisit, 88).public_comment == "Otro comentario"
    assert sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2, status="vivo", visits=[visit2])]])).updated == 0


def test_full_snapshot_deactivates_missing_trees_and_reactivates(db_factory):
    sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2), make_tree(3)]]))
    result = sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(3)]]))
    assert result.deactivated == 1
    db = db_factory()
    assert db.get(TomatoTree, 2).active is False  # oculto, no borrado
    assert sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2), make_tree(3)]])).deactivated == 0
    assert db_factory().get(TomatoTree, 2).active is True


def test_visits_removed_in_tomato_are_removed_here(db_factory):
    sync(db_factory, FakeTomato(pages=[[make_tree(1, visits=[VISIT])]]))
    sync(db_factory, FakeTomato(pages=[[make_tree(1, visits=[])]]))
    assert db_factory().query(TomatoVisit).count() == 0


# --- Fallos: no se toca nada ----------------------------------------------------------

@pytest.fixture
def seeded(db_factory):
    assert sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2)]])).ok
    return db_factory


@pytest.mark.parametrize("fake, code", [
    (FakeTomato(status=401), 401),
    (FakeTomato(status=503), 503),
    (FakeTomato(status=400), 400),
    (FakeTomato(status=422), 422),
])
def test_http_errors_keep_previous_data_and_log_the_run(seeded, fake, code):
    result = sync(seeded, fake)
    assert not result.ok and result.http_status == code
    assert len(fake.requests) == 1  # 401/503/400/422 no se reintentan
    db = seeded()
    assert db.query(TomatoTree).filter(TomatoTree.active.is_(True)).count() == 2
    run = db.query(TomatoSyncRun).order_by(TomatoSyncRun.id.desc()).first()
    assert not run.ok and run.http_status == code and run.error


def test_401_message_explains_the_key(seeded):
    result = sync(seeded, FakeTomato(status=401))
    assert "TOMATO_SYNC_API_KEY" in result.error and "DARBOLES_SYNC_API_KEY" in result.error


def test_network_failure_on_second_page_changes_nothing(seeded):
    # La página 1 viene bien y sin el árbol 2: si se aplicara a medias, lo daría de baja
    fake = FakeTomato(pages=[[make_tree(1)], [make_tree(3)]], fail_on_page=1, exc=httpx.ConnectError("caído"))
    result = sync(seeded, fake)
    assert not result.ok and "sin conexión" in result.error
    db = seeded()
    assert db.get(TomatoTree, 2).active is True and db.get(TomatoTree, 3) is None


def test_retries_with_growing_wait_then_succeeds(db_factory):
    calls = {"n": 0}

    def flaky(request):
        calls["n"] += 1
        if calls["n"] < 3:
            return httpx.Response(502, json={})
        return httpx.Response(200, json={"next_cursor": None, "trees": [make_tree(1)]})

    waited = []
    result = tomato_sync.run_sync(db_factory, transport=httpx.MockTransport(flaky), sleep=waited.append)
    assert result.ok and waited == [2, 4]


def test_timeout_retries_three_times_then_fails(seeded):
    fake = FakeTomato(fail_on_page=0, exc=httpx.ReadTimeout("lento"))
    waited = []
    result = sync(seeded, fake, waited)
    assert not result.ok and waited == [2, 4, 8] and len(fake.requests) == 4
    assert seeded().query(TomatoTree).filter(TomatoTree.active.is_(True)).count() == 2


@pytest.mark.parametrize("broken", [
    make_tree(9, status="talado"),
    make_tree(9, lat=None),
    make_tree(9, project=None),
    make_tree(9, visits=[{**VISIT, "photos": [{"url": "javascript:alert(1)"}]}]),
    make_tree(9, date_planted="ayer"),
])
def test_malformed_tree_cancels_the_whole_sync(seeded, broken):
    result = sync(seeded, FakeTomato(pages=[[make_tree(1), broken]]))
    assert not result.ok
    assert seeded().get(TomatoTree, 2).active is True  # no se dio de baja nada


def test_repeated_cursor_is_detected(db_factory):
    def loop(request):
        return httpx.Response(200, json={"next_cursor": "5", "trees": []})
    result = tomato_sync.run_sync(db_factory, transport=httpx.MockTransport(loop), sleep=lambda s: None)
    assert not result.ok and "cursor" in result.error


def test_not_configured_does_not_call_network(db_factory, monkeypatch):
    monkeypatch.delenv("TOMATO_SYNC_API_KEY")
    fake = FakeTomato(pages=[[make_tree(1)]])
    result = sync(db_factory, fake)
    assert not result.ok and fake.requests == []


def test_only_one_sync_at_a_time(db_factory):
    tomato_sync._lock.acquire()
    try:
        result = sync(db_factory, FakeTomato(pages=[[make_tree(1)]]))
    finally:
        tomato_sync._lock.release()
    assert result.busy and not result.ok


# --- Presentación (API pública de darboles.com) ---------------------------------------

@pytest.fixture
def client(db_factory):
    def override():
        db = db_factory()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_map_hides_inactive_and_replaced_trees(db_factory, client):
    sync(db_factory, FakeTomato(pages=[[make_tree(1, status="reemplazado", replaced_by_id=2), make_tree(2), make_tree(3, status="muerto")]]))
    ids = sorted(t["id"] for t in client.get("/api/v1/tomato/trees/map").json())
    assert ids == [2, 3]  # el reemplazado no se dibuja; el muerto sí (en gris)


def test_tree_card_shows_visits_year_only_and_replacement(db_factory, client):
    sync(db_factory, FakeTomato(pages=[[make_tree(1, status="reemplazado", replaced_by_id=2, visits=[VISIT]), make_tree(2)]]))
    card = client.get("/api/v1/tomato/trees/1").json()
    assert card["planted_year"] == 2024 and "date_planted" not in card
    assert card["replaced_by"] == {"id": 2, "species": "Guachipelín"}
    assert card["visits"][0]["public_comment"].startswith("Buen crecimiento")
    assert len(card["visits"][0]["photos"]) == 2
    assert card["location_precision"] == "sector"


def test_non_public_project_never_shows_photos_or_comment(db_factory, client):
    # Aunque tomatocr.com mandara datos por error, la presentación no los muestra
    private = make_tree(1, project={"id": 8, "name": "Proyecto institucional", "public": False}, visits=[VISIT])
    sync(db_factory, FakeTomato(pages=[[private]]))
    card = client.get("/api/v1/tomato/trees/1").json()
    assert card["project"] == "Proyecto institucional"
    assert card["visits"][0]["public_comment"] is None and card["visits"][0]["photos"] == []


def test_card_only_has_contract_fields(db_factory, client):
    sync(db_factory, FakeTomato(pages=[[make_tree(1, visits=[VISIT])]]))
    card = client.get("/api/v1/tomato/trees/1").json()
    allowed = {"id", "lat", "lng", "status", "species", "sector", "project", "location_precision", "tree_number",
               "project_public", "planted_year", "last_checked_at", "replaced_by", "visits", "synced_at"}
    assert set(card) <= allowed
    assert set(card["visits"][0]) == {"id", "date", "status", "height_cm", "public_comment", "photos"}


def test_unknown_or_inactive_tree_is_404(db_factory, client):
    sync(db_factory, FakeTomato(pages=[[make_tree(1), make_tree(2)]]))
    sync(db_factory, FakeTomato(pages=[[make_tree(1)]]))
    assert client.get("/api/v1/tomato/trees/2").status_code == 404
    assert client.get("/api/v1/tomato/trees/999").status_code == 404


def test_admin_sync_endpoints_require_admin(client):
    assert client.get("/api/v1/admin/tomato/sync").status_code == 401
    assert client.post("/api/v1/admin/tomato/sync").status_code == 401


def test_admin_sync_status(db_factory, client):
    sync(db_factory, FakeTomato(pages=[[make_tree(1)]]))
    sync(db_factory, FakeTomato(status=401))
    app.dependency_overrides[get_current_admin_user] = lambda: object()
    status = client.get("/api/v1/admin/tomato/sync").json()
    assert status["configured"] is True and status["active_trees"] == 1
    assert status["last_run"]["ok"] is False and status["last_run"]["http_status"] == 401
    assert status["last_success"]["received"] == 1


def test_manual_admin_no_longer_accepts_tomato_origin():
    from pydantic import ValidationError
    from app.schemas.tracking import AdminTrackedTreeCreate
    with pytest.raises(ValidationError):
        AdminTrackedTreeCreate(species_id=1, origin="tomato", latitude=10.0, longitude=-84.2)
    assert AdminTrackedTreeCreate(species_id=1, latitude=10.0, longitude=-84.2).origin == "guardian"


def test_manual_command_runs(tmp_path):
    """python -m app.services.tomato_sync: sin configuración termina con error claro, sin excepciones."""
    import os
    import subprocess
    import sys
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{tmp_path / 'cli.db'}", "SECRET_KEY": "x",
           "TOMATO_SYNC_URL": "", "TOMATO_SYNC_API_KEY": ""}
    code = "from app.core.database import Base, engine; import app.models.tomato; Base.metadata.create_all(engine)"
    backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run([sys.executable, "-c", code], cwd=backend, env=env, check=True)
    out = subprocess.run([sys.executable, "-m", "app.services.tomato_sync"], cwd=backend, env=env,
                         capture_output=True, text=True)
    assert out.returncode == 1
    assert "sin configurar" in out.stdout and "Traceback" not in out.stderr


# --- Programador: una vez al día ------------------------------------------------------

def test_scheduler_runs_once_a_day_at_configured_hour(monkeypatch):
    from app.core import sync_scheduler
    monkeypatch.setenv("TOMATO_SYNC_URL", URL)
    monkeypatch.setenv("TOMATO_SYNC_API_KEY", KEY)
    monkeypatch.setenv("TOMATO_SYNC_HOUR", "4")
    sync_scheduler.start()
    try:
        job = sync_scheduler._scheduler.get_job("tomato_sync")
        fields = {f.name: str(f) for f in job.trigger.fields}
        assert fields["hour"] == "4" and fields["minute"] == "0" and fields["day"] == "*"
        assert str(job.trigger.timezone) == "America/Costa_Rica"
        assert sync_scheduler._scheduler.get_job("tomato_sync_startup") is not None
    finally:
        sync_scheduler.stop()


def test_scheduler_hour_defaults_to_3_and_ignores_bad_values(monkeypatch):
    from app.core import sync_scheduler
    monkeypatch.delenv("TOMATO_SYNC_HOUR", raising=False)
    assert sync_scheduler.sync_hour() == 3
    for bad in ("25", "-1", "tres"):
        monkeypatch.setenv("TOMATO_SYNC_HOUR", bad)
        assert sync_scheduler.sync_hour() == 3


def test_scheduler_off_without_config(monkeypatch):
    from app.core import sync_scheduler
    monkeypatch.delenv("TOMATO_SYNC_API_KEY", raising=False)
    sync_scheduler.start()
    assert sync_scheduler._scheduler is None


def test_startup_skips_when_last_success_is_recent(db_factory, monkeypatch):
    from app.core import sync_scheduler
    sync(db_factory, FakeTomato(pages=[[make_tree(1)]]))
    calls = []
    monkeypatch.setattr(sync_scheduler, "SessionLocal", db_factory)
    monkeypatch.setattr(sync_scheduler, "_job", lambda trigger: calls.append(trigger))
    sync_scheduler._startup_job()
    assert calls == []  # hubo una exitosa hace segundos: se espera a la corrida diaria


def test_startup_runs_when_never_synced(db_factory, monkeypatch):
    from app.core import sync_scheduler
    calls = []
    monkeypatch.setattr(sync_scheduler, "SessionLocal", db_factory)
    monkeypatch.setattr(sync_scheduler, "_job", lambda trigger: calls.append(trigger))
    sync_scheduler._startup_job()
    assert calls == ["startup"]
