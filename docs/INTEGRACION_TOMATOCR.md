# Integraciones con tomatocr.com (lado darboles.com)

Dos integraciones de servidor a servidor: el **formulario de empresas → CRM** (abajo) y la
**sincronización de árboles de TOMATO → mapa** (al final).

# 1. Formulario de empresas → CRM de tomatocr.com

El contrato completo vive en el repositorio de tomatocr.com
(`docs/INTEGRACION_DARBOLES.md`). Este documento explica cómo lo implementa
darboles.com. Si cambia el contrato, actualizar los dos.

## Flujo

```
Navegador (/empresas, /contacto)
   │  POST /api/v1/leads/empresas   (sin clave; JSON del formulario)
   ▼
Backend FastAPI de darboles.com  ── valida, honeypot, límite por IP
   │  POST $TOMATO_CRM_URL  con  X-API-Key: $TOMATO_CRM_API_KEY  (10 s máx.)
   ▼
tomatocr.com /api/crm/leads  →  cuenta + oportunidad con origen "darboles.com"
```

Solo el formulario de empresas va al CRM. Las compras de la tienda no.

## Código

| Archivo | Qué hace |
| --- | --- |
| `src/components/CompanyLeadForm.tsx` | Formulario (voseo), validación en el navegador, campo trampa `website`, casilla de consentimiento sin marcar enlazada a https://tomatocr.com/privacidad, evento GA4 `generate_lead` (solo `lead_source` y `motor`, sin datos personales). |
| `backend/app/routers/leads.py` | Endpoint `POST /api/v1/leads/empresas`: validación con las mismas reglas que tomatocr.com, honeypot, límite por IP y total, envío al CRM y respaldo por correo. `CONSENT_TEXT_VERSION` identifica el texto de la casilla. |
| `backend/app/services/tomato_crm.py` | Llamada de servidor a servidor y clasificación de la respuesta. |
| `backend/app/core/mailer.py` → `send_lead_fallback_email` | Correo de respaldo a `LEADS_FALLBACK_EMAILS`. |
| `backend/tests/test_leads.py` | Pruebas: éxito, 422, 503/5xx/401/429/timeout con respaldo, honeypot, límites, IP falsificada. |

## Qué pasa con cada respuesta de tomatocr.com

| tomatocr.com | darboles.com | La persona ve |
| --- | --- | --- |
| 200 | Log "enviada al CRM" | "¡Gracias!" |
| 422 | Devuelve los mensajes (vienen en voseo) | Los mensajes |
| 503, 5xx, sin respuesta en 10 s, sin conexión | Correo de respaldo; log de advertencia | "¡Gracias!" |
| 401 (clave no coincide) | Correo de respaldo; log de **error** de configuración; no se reintenta | "¡Gracias!" |
| 429 (más de 120/h desde darboles.com) | Correo de respaldo | "¡Gracias!" |
| Falla el CRM **y** el correo | Log de error "PERDIDA" | Aviso para escribir por WhatsApp (502) |

El backend valida antes de llamar (nombre; correo o teléfono; correo válido;
motor `regalo_corporativo` o `esg`; `consent === true`), así que los datos
inválidos no gastan el límite de tomatocr.com. En esos casos responde 422 con
códigos (`name_required`, `contact_required`, `email_invalid`,
`motor_required`, `consent_required`) que el formulario traduce.

Protección propia: honeypot (responde "ok" sin enviar nada), 5 solicitudes por
IP por hora y 60 en total por hora (`LEADS_PER_IP_PER_HOUR`, `LEADS_PER_HOUR`).
La IP se toma de `X-Real-IP`/`X-Forwarded-For` solo cuando la conexión llega
desde el propio servidor (Nginx o la red de Docker).

Los logs no guardan datos personales: solo el resultado, el motor y el dominio
del correo.

## Variables de entorno (backend)

Ver [DEPLOYMENT.md §3](../DEPLOYMENT.md#3-configuración-de-variables-de-entorno):
`TOMATO_CRM_URL`, `TOMATO_CRM_API_KEY`, `LEADS_FALLBACK_EMAILS`,
`LEADS_PER_IP_PER_HOUR`, `LEADS_PER_HOUR`. El respaldo por correo necesita
`SMTP_*`; sin SMTP no se simula el envío.

## Probar de punta a punta en local

1. tomatocr.com en local, en el puerto 8123, con su propia clave y **sin correo**
   (para no avisar al equipo real) y con una base SQLite desechable:
   ```bash
   mkdir -p /tmp/tomato-e2e && cd /tmp/tomato-e2e && ln -sfn ~/Desktop/tomatocr/app app
   ```
   ```bash
   env USE_SQLITE=True MAIL_USERNAME= DARBOLES_API_KEY=clave-local SECRET_KEY=local ~/Desktop/tomatocr/venv/bin/uvicorn app.main:app --port 8123
   ```
2. Backend de darboles.com apuntando ahí:
   ```bash
   cd backend && env TOMATO_CRM_URL=http://127.0.0.1:8123/api/crm/leads TOMATO_CRM_API_KEY=clave-local SECRET_KEY=local DATABASE_URL=sqlite:////tmp/darboles.db venv/bin/uvicorn app.main:app --port 8011
   ```
3. Frontend con `NEXT_PUBLIC_API_URL=http://localhost:8011/api/v1 npx next dev -p 3001` y enviar el formulario desde `/empresas`.
4. Revisar en `/tmp/tomato-e2e/sql_app.db` que la cuenta quedó con `source = darboles`.

## QA en producción

Después de activar: un envío de prueba desde darboles.com/empresas, revisar en
tomatocr.com → Clientes que llegó con origen "darboles.com" y descartarlo.
Cada envío genera un aviso por correo de tomatocr.com al vendedor asignado y a
info@tomatocr.com; si cae en el respaldo, llega además el correo de respaldo.

Registro:

- **27/09/2026 — activado.** Primer envío de prueba: respaldo por `401` (las
  claves de los dos `.env` no coincidían; la de tomatocr.com tenía 44
  caracteres). Se igualaron las claves, se reinició tomatocr.com y el segundo
  envío entró al CRM (`enviada al CRM`). La prueba se descartó en Clientes.
  Quedaron comprobados en producción el envío al CRM, el correo de respaldo, la
  validación (422) y el evento GA4 `generate_lead`.

Para diagnosticar un `401`, ver DEPLOYMENT.md §8 → "Formulario de empresas".


# 2. Sincronización de árboles de TOMATO → mapa de darboles.com

Contrato completo en el repositorio de tomatocr.com: `docs/INTEGRACION_DARBOLES.md`,
sección "Sincronización de árboles". tomatocr.com es la fuente de verdad; darboles.com
solo lee.

## Flujo

```
Programador del backend (cada TOMATO_SYNC_INTERVAL_HOURS, y al arrancar)
   │  GET $TOMATO_SYNC_URL?limit=1000[&cursor=…]   X-API-Key: $TOMATO_SYNC_API_KEY
   ▼
tomatocr.com /api/darboles/trees  (todas las páginas: foto completa)
   │  valida todo; si algo falla no toca la base
   ▼
tomato_trees / tomato_visits / tomato_visit_photos  (+ registro en tomato_sync_runs)
   ▼
GET /api/v1/tomato/trees/map   → /mapa (capa "Proyectos de reforestación TOMATO")
GET /api/v1/tomato/trees/{id}  → /mapa/tomato/{id} (ficha con visitas y fotos)
```

## Código

| Archivo | Qué hace |
| --- | --- |
| `backend/app/services/tomato_sync.py` | Cliente (20 s por página, 3 reintentos con espera de 2, 4 y 8 s ante red caída o 5xx), validación de cada árbol, aplicación en una sola transacción, candado para no correr dos a la vez. `python -m app.services.tomato_sync` la corre a mano. |
| `backend/app/core/sync_scheduler.py` | APScheduler dentro del backend. Aparte de `core/scheduler.py`, que tiene un trabajo viejo apagado a propósito. |
| `backend/app/models/tomato.py` + migración `d5e6f7a8b9c0` | Tablas propias; `tomato_trees.id` es el id de tomatocr.com. |
| `backend/app/routers/tomato.py` | Mapa, ficha y, para administradores, `GET/POST /api/v1/admin/tomato/sync` (estado y "Sincronizar ahora"). |
| `src/app/mapa/MapComponent.tsx` | Capas agrupadas con leaflet.markercluster y spiderfy. |
| `src/app/mapa/tomato/[id]/` | Ficha del árbol. |
| `backend/tests/test_tomato_sync.py` | Pruebas con tomatocr.com simulado. |

## Reglas de la sincronización

- **Foto completa siempre** (sin `updated_since`). Se crea o actualiza cada árbol por `id`; las visitas se actualizan por su `id` y las fotos de cada visita se reemplazan completas.
- **Árboles que ya no vienen:** `active = false` (se ocultan, no se borran). Si vuelven a aparecer, se reactivan.
- **Si algo falla** (401, 503, 400/422, red, 5xx después de los reintentos, un dato con formato inválido o un cursor que se repite): no se cambia nada y el error queda en `tomato_sync_runs`. Un árbol con datos rotos cancela toda la corrida, porque saltarlo lo daría de baja por error.
- **401 y 503 no se reintentan**: son de configuración (ver DEPLOYMENT.md §8).

## Qué se muestra

| Dato | En darboles.com |
| --- | --- |
| `status` | Relleno del punto: verde `vivo` ("Verificado vivo"), blanco `sin_verificar` ("Sin verificar aún"), gris `muerto` ("No sobrevivió"). Los `reemplazado` no se dibujan; su ficha enlaza al árbol nuevo (`replaced_by_id`). |
| `location_precision = "sector"` | "Ubicación aproximada (sector)". Los árboles del mismo sector se agrupan y se separan en abanico al abrir el grupo. |
| `date_planted` | **Solo el año**, como "Año de siembra (según inventario)": en algunos proyectos la fecha es la de la importación, no la real. Si tomatocr.com agrega un indicador de fecha exacta, se puede mostrar la fecha completa. |
| `project.name` | Tal cual (en proyectos no autorizados llega "Proyecto institucional"). |
| `visits` | Historial en la ficha: fecha, estado, altura, comentario público y galería (carga diferida, `width`/`height` para reservar espacio, ampliación al tocar). Sin visitas, la sección no aparece. |
| Proyecto no público | Sin comentario ni fotos, aunque llegaran: la API de darboles.com vuelve a filtrarlos. |

Las fotos se enlazan directo a su URL en tomatocr.com (S3 público o `https://tomatocr.com/static/…`); no se copian.

## Probar en local

1. tomatocr.com en local (puerto 8123) con `DARBOLES_SYNC_API_KEY=clave-sync-local`, `USE_SQLITE=True`, `MAIL_USERNAME=` y una base desechable; cargarle un inventario con su importador (`app.utils.reforestation.import_inventory_csv`) y visitas con `record_check`.
2. Backend de darboles.com con `TOMATO_SYNC_URL=http://127.0.0.1:8123/api/darboles/trees` y `TOMATO_SYNC_API_KEY=clave-sync-local`, y `python -m app.services.tomato_sync`.
3. Frontend con `NEXT_PUBLIC_API_URL=http://localhost:8011/api/v1`; revisar `/mapa` y `/mapa/tomato/1`.
