# 🌳 Dárboles

Tienda y programa de **Dárboles**, un programa de TOMATO COSTA RICA ANY S.R.L. Se venden árboles vivos, frutales y ornamentales, en empaques plantables, para regalar dentro de Costa Rica. Cada árbol llega con un certificado de regalo que trae un código; quien lo recibe lo registra en el mapa y pasa a ser su **Guardián del Ecosistema**. El programa corporativo (/empresas) ofrece regalo corporativo y proyectos de reforestación con trazabilidad.

> Regla de contenido: el sitio no afirma compensación de CO₂, datos satelitales ni integraciones que no existan y se puedan demostrar. Ver el historial de `fix/riesgo-afirmaciones`.

Para producción, ver **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 🛠 Tecnologías

**Frontend**
- Next.js 16 (App Router, Turbopack), React 19 y TypeScript. Leer `AGENTS.md` antes de tocar código Next.
- CSS Modules y estilos en línea; `react-hot-toast` para notificaciones.
- Leaflet y `react-leaflet` para el mapa público y el selector de ubicación.
- Textos en español ("tú"; el formulario de empresas, en voseo) e inglés, en `src/locales/es.json` y `src/locales/en.json`, mediante `useTranslations()`.

**Backend**
- Python 3.11 y FastAPI; SQLAlchemy y Alembic sobre PostgreSQL 15.
- Sesiones con JWT firmado con `SECRET_KEY` y contraseñas con bcrypt (`passlib`).
- PDF de certificados con ReportLab; correo por SMTP; pagos con Tilopay (tarjeta) y SINPE Móvil.
- Todo el backend corre en Docker Compose (`db` y `backend`).

---

## 🗺 Funcionalidad principal

| Área | Qué hace | Código |
|---|---|---|
| Tienda (`/regalos`) | Carrito para uno o varios destinatarios, envío según GAM o fuera del GAM, pago con SINPE o tarjeta. El total se recalcula en el servidor con los precios de la base. | `src/app/regalos`, `backend/app/routers/payments.py` |
| Certificado | PDF "Certificado de regalo" con código de registro y QR hacia `/registro`. | `backend/app/services/pdf_generator.py` |
| Registro del Guardián (`/registro`) | La persona valida su código, marca en el mapa dónde sembró (con GPS opcional), la fecha y una foto. Solo acepta ubicaciones dentro de Costa Rica. | `src/app/registro`, `backend/app/routers/tracking.py` |
| Mapa (`/mapa`) | Árboles sembrados por origen: verde para Guardianes, naranja para proyectos ejecutados por TOMATO. | `src/app/mapa` |
| Admin (`/admin`) | Pedidos, catálogo de especies (con la marca "Nativo de Costa Rica", que solo se activa con confirmación del ingeniero forestal), árboles sembrados (alta manual o CSV), configuración de tienda y usuarios. | `src/app/admin`, `backend/app/routers/admin*.py` |
| Formulario de empresas | En `/empresas` y `/contacto`. El navegador envía a `POST /api/v1/leads/empresas`; el backend valida, filtra bots (honeypot y límite por IP) y reenvía al CRM de tomatocr.com de servidor a servidor. Si tomatocr.com no responde, va por correo de respaldo. Textos en voseo (es un formulario de TOMATO). Ver [docs/INTEGRACION_TOMATOCR.md](docs/INTEGRACION_TOMATOCR.md). | `src/components/CompanyLeadForm.tsx`, `backend/app/routers/leads.py`, `backend/app/services/tomato_crm.py` |
| Cómo sembrar (inicio y `/nosotros#como-sembrar`) | "El proceso, en 4 pasos", debajo del bloque principal del inicio y en /nosotros: Hidrata, Prepara la tierra, Siembra, Registra y cuida. Mismo proceso e ilustraciones que tomatocr.com/programas/darboles (SVG en `public/images/pasos/`); si cambian allá, actualizar aquí. `/registro` enlaza a esta sección. | `src/components/PlantingSteps.tsx` |
| Contenido | Inicio, `/nosotros`, `/empresas`, `/contacto`, `/terminos`, `/privacidad`. | `src/app/*`, `src/locales/*` |

**Roles:** usuario, administrador (`is_admin`) y superadministrador (`is_superadmin`). Todas las rutas `/api/v1/admin/*` exigen sesión de administrador, salvo `GET /admin/trees` y `GET /config`, que usa la tienda sin sesión.

**Árboles sembrados** (`tracked_trees`): los que vienen de un pedido nacen como `unregistered` y pasan a `planted` cuando se registran. El campo `origin` vale `guardian` o `tomato`, y `project_name` guarda el proyecto en el caso de TOMATO. Un árbol de pedido que se "quita del mapa" en el admin vuelve a `unregistered` para que su código siga sirviendo.

**Importar CSV en el admin:** columnas `especie;latitud;longitud;fecha_siembra;proyecto;origen;responsable` (acepta `;` o `,` y coma decimal). La especie se busca por nombre común o científico. La importación es todo o nada: si una fila falla, no se carga ninguna. Hay una plantilla descargable en la misma pestaña.

---

## ⚙️ Estructura

```text
darboles/
├── src/
│   ├── app/                      # Páginas (App Router): regalos, registro, mapa, admin, empresas, ...
│   │   └── admin/PlantedTreesTab.tsx   # Pestaña "Árboles Sembrados"
│   ├── components/               # Navbar, Footer, SmartTable, LocationPicker, PlantingSteps, CompanyLeadForm, ToasterProvider
│   ├── context/TranslationContext.tsx
│   ├── locales/                  # es.json, en.json
│   └── proxy.ts                  # Redirección www → dominio principal
├── backend/
│   ├── alembic/versions/         # Migraciones (se aplican solas al arrancar el contenedor)
│   ├── app/
│   │   ├── core/                 # database, security (JWT), mailer, uploads (validación de imágenes)
│   │   ├── models/               # user, tree, gift, tracked_tree, campaign, config
│   │   ├── routers/              # auth, admin, admin_tracking, admin_users, leads, payments, tracking, inventory, config
│   │   ├── schemas/
│   │   ├── services/             # pdf_generator, tilopay, tomato_crm
│   │   ├── seed.py               # Datos iniciales (especies y usuarios base)
│   │   └── main.py               # Punto de entrada FastAPI
│   ├── tests/                    # Pruebas (pytest)
│   ├── uploads/                  # Imágenes subidas (ignorada por git; volumen en Docker)
│   └── Dockerfile
├── scripts/send_reminders.py     # Recordatorio por correo a Guardianes que aún no lo recibieron
├── docker-compose.yml            # db (Postgres) + backend (FastAPI)
├── docs/INTEGRACION_TOMATOCR.md  # Contrato con el CRM de tomatocr.com
├── DEPLOYMENT.md                 # Servidor, variables de entorno, redeploy y rollback
└── doc_tilopay.md                # Integración con Tilopay
```

---

## 🚀 Desarrollo local

### 1. Variables de entorno
Crea un `.env` en la raíz (está en `.gitignore`). Docker Compose lo usa para el backend y Next.js para el frontend. La lista completa y comentada está en [DEPLOYMENT.md §3](DEPLOYMENT.md#3-configuración-de-variables-de-entorno). Para local, lo mínimo es:

```env
DATABASE_URL=postgresql://darboles_user:darboles_password@db/darboles_db
SECRET_KEY=una_clave_local_larga
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8001
```

`SECRET_KEY` es obligatoria: sin ella el backend no arranca. Puedes generar una con `python3 -c "import secrets; print(secrets.token_hex(32))"`.

### 2. Backend y base de datos
```bash
docker compose up -d --build
```
Al arrancar, el contenedor aplica las migraciones (`alembic upgrade head`). Para cargar los datos iniciales:
```bash
docker compose exec backend python app/seed.py
```
La API queda en `http://localhost:8001` y la documentación Swagger en `http://localhost:8001/docs`.

Para crear una migración después de cambiar un modelo:
```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion_del_cambio"
```
Revisa el archivo generado en `backend/alembic/versions/` antes de hacer commit.

### 3. Frontend
```bash
npm install
```
```bash
npm run dev
```
Queda en `http://localhost:3000`.

### 4. Comprobaciones antes de hacer commit
Pruebas del backend (no salen a la red ni mandan correos):
```bash
cd backend && venv/bin/pip install -r requirements-dev.txt
```
```bash
cd backend && venv/bin/python -m pytest -q
```
Frontend:
```bash
npx tsc --noEmit
```
```bash
npx eslint src
```
El lint tiene errores previos conocidos (`no-explicit-any`, `<img>`). Lo importante es no agregar errores nuevos.

---

## 📌 Pendientes conocidos
- **Tilopay:** el retorno de pago no se verifica contra la API de Tilopay (ver DEPLOYMENT.md §8). Confirma los pagos con tarjeta en el panel de Tilopay antes de despachar.
- **Especies nativas:** marcar en el admin solo las que confirme el ingeniero forestal.
- **Términos:** la cláusula de retracto (Ley 7472) debe revisarla un abogado.

*Un programa de TOMATO.* 🌿
