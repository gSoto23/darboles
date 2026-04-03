# 🌳 Dárboles - Documentación de Arquitectura y Tecnologías

Bienvenido al repositorio oficial de **Dárboles**, la plataforma integral para la reconexión ambiental, mercantilización transparente de árboles y suscripciones *Net-Zero*. Este documento proporciona un mapeo exacto de la topología del código, componentes, bases de datos y convenciones aplicadas en este proyecto.

---

## 🛠 Entorno Tecnológico (Tech Stack)
Dárboles está construido bajo una arquitectura modular y escalable (Full-Stack) diseñada para separar el control de lógica pesada de las interfaces responsivas:

**Capa de Presentación (Frontend):**
*   **Framework:** [Next.js v14+ (App Router)](https://nextjs.org/)
*   **Librerías Core:** React, TypeScript.
*   **Diseño UX/UI:** CSS Modules nativos (*Glassmorphism* y animaciones fluídas), `lucide-react` para iconografía SVG, global `react-hot-toast` para notificaciones e interacciones UI.

**Capa de Negocio (Backend):**
*   **Motor General:** [Python 3.11+ con FastAPI](https://fastapi.tiangolo.com/)
*   **Seguridad:** Tokens JWT (JSON Web Tokens) asimétricos, algoritmos de encriptado (Bcrypt) mediante `passlib`.
*   **Ecosistema de Base de Datos:** PostgreSQL.
*   **ORM y Migraciones:** SQLAlchemy para la estructuración y `Alembic` para delinear y escalar el ciclo de vida de la Base de Datos.
*   **Despliegue Local:** Contenerizado enteramente en `Docker` (usando `docker-compose.yml`).

---

## 🏗 Arquitectura del Sistema Funcional

### 1. Sistema de Autenticación y Autorización Diferenciada
El ecosistema separa de forma inteligente los permisos del usuario usando esquemas en la Base de Datos `User` Pydantic.
*   **Roles:** Existen Usuarios Generales, Administradores (Delegados) y SuperAdmins inmutables (`admin@darboles.com`).
*   **Flujo Reactivo:** Si detecta un superusuario, se enruta preferencialmente al `/admin`. Los usuarios regulares caen directamente a su `/dashboard` para revisar su impacto ecológico en Kilogramos CO2.
*   **Seguridad y Rotación:** Integrados los endpoints de recuperación. Por medio del endpoint `PATCH /api/v1/auth/me`, un usuario puede actualizar su `correo`, `whatsapp` y `dirección`, o ejecutar transiciones seguras exigiéndoles la `Contraseña Actual` para registrar una `Nueva Contraseña` e incitando al servidor a revocar su sesión para un reingreso forzado más seguro.

### 2. Infraestructura Paramétrica Visual (UI)
*   **SmartTable Component:** Para mantener la usabilidad corporativa se construyó el componente `<SmartTable />`. Esta pieza de código es agnóstica; ingiere un JSON abstracto de cualquier entidad y lo renderiza automáticamente como una tabla con filtros de búsqueda exhaustiva (*Search-String*), ordenamientos interactivos de encabezados (Ascendente/Descendente) y sistema de Paginación. Se utiliza en todo el `/admin` para ver usuarios, entregas y suscripciones.
*   **Notificaciones Asíncronas (Toasters):** Con el provider global `ToasterProvider`, se implementó la retroalimentación instantánea eliminando los típicos bloques destructivos de 'alert()'. Ahora se inyectan notificaciones contextuales verdes/rojas.
*   **Modales Híbridos Glassmorphism:** Formularios visualmente suspendidos por encima del *Dashboard* a base de filtros CSS (`backdrop-filter`) para editar perfiles o solicitar los reportes de cobros.

### 3. Trazabilidad Económica (Módulo de Suscripciones)
La plataforma no solo vende árboles únicos en el "Mercado Local", gestiona Suscripciones Globales de largo plazo.
*   **Entidades:** `Subscription` (Asigna X árboles a la suscripción). Intersectado con el modelo sub-derivado `SubscriptionInvoice`.
*   **Facturación Múltiple:** Las suscripciones no tienen un monto único invisible. El motor permite a la UI abrir una capa (Modal) en el `/dashboard` en donde se lista el "Trazabilidad de Cobros", que lee desde el Backend en `FastAPI` cada vez qué mes se ejecutó la recolección económica (ej: Stripe) y si el estatus bancario fue exitoso.
*   **Mecanismo de Deserción:** Endpoints como `PATCH .../cancel` validando cruces de JWT aseguran que un usuario logueado o un Administrador logre cancelar una suscripción e inmediatamente marque la base de datos protegiendolas de facturaciones futuras.

---

## ⚙️ Estructura de Directorios (A Vista de Pájaro)

```text
darboles/
├── src/                                  # FRONTEND LAYER (Next.js)
│   ├── app/                              # App Router principal
│   │   ├── admin/page.tsx                # Panel SuperAdmin global
│   │   ├── dashboard/page.tsx            # Dashboard de métricas para usuario
│   │   ├── regalos/                      # Mercado Local (e-commerce visual)
│   │   ├── suscripciones/                # Mercado B2B Global Subscriptions
│   │   ├── login/ & registro/ & recuperar/ # Ecosistema Auth
│   │   ├── globals.css                   # Motor core CSS (Variables & Paleta)
│   │   └── layout.tsx                    # Root Layout & Inyección de Toasters
│   └── components/                       # Bloques modulares React (Navbar, SmartTable)
│
├── backend/                              # BACKEND LAYER (FastAPI)
│   ├── alembic/                          # Autogenerador de versiones Postgres
│   ├── app/
│   │   ├── core/                         # Config (Variables, JWT Auth, Database)
│   │   ├── models/                       # SQLAlchemy (User, Farm, Invoice, etc).
│   │   ├── routers/                      # Ruteadores API (auth.py, subscriptions.py...)
│   │   └── schemas/                      # Pydantic (UserBase, InvoiceRead...)
│   ├── main.py                           # Punto de Entrada FastAPI
│   ├── alembic.ini                       # Configuración de string SQLAlchemy
│   └── requirements.txt                  # Dependencias de Python
│
├── docker-compose.yml                    # Orquestador del ecosistema local Docker
├── package.json                          # Mainfest de Node.js
└── README.md                             # (Esto que estás leyendo)
```

---

## 🚀 Guía Rápida de Despliegue Local

### 1. Levantar el Backend (FastAPI + Postgres)
Debes arrancar el orquestador de contenedores. Éste va a amarrar la instancia de PostgreSQL y levantar Uvicorn local. No requieres configurar entornos de Python locales para lograrlo.
```bash
# Estando en la raíz del proyecto
docker-compose up -d

# Si requieres aplicar o sincronizar migraciones frescas hacia Postgres:
docker-compose exec -T web alembic upgrade head
```
*(El backend transmitirá por default su documentación auto-generada Swagger en `http://localhost:8001/docs`.)*

### 2. Levantar el Interfaz Web (Next.jsx Dev Server)
Para el desarrollo de componentes frontales:
```bash
# Instala librerías nativas si clonaste recientemente
npm install

# Inicia el cliente React pre-compilado en el 3000
npm run dev
```
*(Ingresa a `http://localhost:3000`)*

---

### Menciones Finales de Ambientes y DB Local
* Las credenciales SuperAdmin base por default se inician en la siembra ("Seeding") como: `admin@darboles.com`
* Variables de Entorno y Conexiones (`DATABASE_URL`, `SECRET_KEY`) operan dictadas por el `.env` (Ignorado en `.gitignore` estricto).

*Diseñado para conectar propósitos.* 🌿
