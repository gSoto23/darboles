# Guía de Despliegue para Dárboles (VPS / Ubuntu)

Esta guía detalla los pasos paso a paso para desplegar el proyecto Dárboles (Frontend en Next.js, Backend en FastAPI y Base de Datos en PostgreSQL) en un servidor virtual privado (VPS) limpio con **Ubuntu 22.04 o superior**.

## 1. Preparación del Servidor

Conéctate a tu servidor mediante SSH y actualiza los paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Docker y Docker Compose (Versión Moderna)
Requerido para aislar la base de datos y el backend. Para evitar bugs de versiones antiguas en Ubuntu, usaremos el script de instalación oficial de Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker
```

### Instalar Node.js (v20) y PM2
Requerido para ejecutar el frontend en Next.js.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 2. Clonar el Proyecto

Descarga el código fuente al servidor. Normalmente, se recomienda clonarlo en la carpeta de tu usuario o en `/var/www/`.

```bash
git clone https://github.com/tu-usuario/darboles.git
cd darboles
```

---

## 3. Configuración de Variables de Entorno

Nunca compartas tus archivos `.env`. Debes crearlos en tu servidor de producción:

```bash
nano .env
```

Ingresa todas las variables críticas (Base de datos, Tilopay, SMTP):

```env
# DB_USER/DB_PASSWORD/DB_NAME configuran el contenedor de Postgres (docker-compose.yml).
# Deben coincidir exactamente con lo que pongas en DATABASE_URL más abajo.
DB_USER=darboles_user
DB_PASSWORD=tu_password_seguro
DB_NAME=darboles_db
DATABASE_URL=postgresql://darboles_user:tu_password_seguro@db/darboles_db

# Obligatoria: la app ya NO arranca si falta. Generala con:
#   python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=...

# URL pública de la API que usa el navegador. Next.js la lee al COMPILAR
# (npm run build): si la cambias, vuelve a compilar el frontend.
NEXT_PUBLIC_API_URL=https://tudominio.com/api/v1

TILOPAY_USER=...
TILOPAY_PASSWORD=...
TILOPAY_KEY=...
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu_correo
SMTP_PASSWORD=tu_password   # En Gmail: contraseña de aplicación, no la de la cuenta
SENDER_EMAIL=tu_correo
# A donde vuelve el comprador después de pagar con tarjeta y la base de los
# enlaces en los correos. Sin ella, el retorno de Tilopay apunta a localhost:3000.
FRONTEND_URL=https://tudominio.com
# URL pública del backend (a la que Tilopay redirige al comprador tras pagar).
# Antes estaba hardcodeada a http://localhost:8001 — con eso el pago con
# tarjeta no podía completarse en producción.
# El código le agrega "/api/v1/payments/tilopay-callback", así que va SIN "/api"
# al final si Nginx reenvía /api/v1/... al backend tal cual (como en darboles.com).
# Comprobalo: https://tudominio.com/api/v1/health debe responder {"status":"ok"}.
BACKEND_URL=https://tudominio.com

# Formulario de empresas → CRM de tomatocr.com (docs/INTEGRACION_TOMATOCR.md).
# La clave es la misma que DARBOLES_API_KEY en el .env de tomatocr.com y vive
# SOLO aquí (nunca en NEXT_PUBLIC_* ni en el repo). Sin URL o sin clave, cada
# solicitud se manda por el correo de respaldo.
TOMATO_CRM_URL=https://tomatocr.com/api/crm/leads
TOMATO_CRM_API_KEY=...
# A quién llega la solicitud si tomatocr.com no la recibe (503, 5xx, 401, 429 o
# más de 10 s). Necesita SMTP_* configurado: sin SMTP el respaldo NO se simula,
# falla y la persona ve un aviso para escribir por WhatsApp.
LEADS_FALLBACK_EMAILS=info@tomatocr.com,darbolescr@gmail.com
# Límite del formulario (opcionales; estos son los valores por defecto)
LEADS_PER_IP_PER_HOUR=5
LEADS_PER_HOUR=60

# Sincronización de árboles de TOMATO (tomatocr.com → darboles.com, solo lectura).
# La clave es la MISMA que DARBOLES_SYNC_API_KEY en el .env de tomatocr.com (allá se
# llama así; aquí, TOMATO_SYNC_API_KEY). Es distinta de TOMATO_CRM_API_KEY.
# Sin URL o sin clave la sincronización queda apagada y el mapa muestra solo Guardianes.
TOMATO_SYNC_URL=https://tomatocr.com/api/darboles/trees
TOMATO_SYNC_API_KEY=...
TOMATO_SYNC_HOUR=3   # opcional; hora de Costa Rica de la sincronización diaria (0–23), por defecto 3
```

Guarda los cambios (`Ctrl+O`, `Enter`, `Ctrl+X`).

> ⚠️ Si ya tenías un `.env` en el servidor con `DB_PASSWORD` distinto al que
> quedó hardcodeado antes en `docker-compose.yml` (`darboles_password`),
> agregá `DB_USER`/`DB_PASSWORD`/`DB_NAME` con esos mismos valores para no
> romper la conexión existente — o planificá una rotación de contraseña real
> (cambiar el valor en Postgres y en `DATABASE_URL` al mismo tiempo).

---

## 4. Despliegue del Backend y Base de Datos (Docker)

En producción, no queremos que Uvicorn se recargue automáticamente (`--reload`). Te recomendamos abrir tu archivo `docker-compose.yml` y asegurarte de que el comando del backend sea:
`command: uvicorn app.main:app --host 0.0.0.0 --port 8000`

Luego, levanta los contenedores en segundo plano (`-d`) usando el comando moderno con espacio (`docker compose`):

```bash
sudo docker compose up -d --build
```

Para verificar que estén corriendo correctamente sin errores:
```bash
sudo docker compose logs -f backend
```

### Inicializar la Base de Datos
Si tienes un archivo para poblar tu base de datos (por ejemplo, `seed.py`), debes ejecutarlo *adentro* del contenedor de Docker una vez que el backend esté arriba:
```bash
sudo docker compose exec backend python app/seed.py
```

### Imágenes subidas (`backend/uploads/`)
`backend/uploads/` está en `.gitignore`, así que no llega al servidor con `git pull`. El contenedor del backend la monta como volumen (`./backend/uploads:/app/uploads` en `docker-compose.yml`): todo lo que se sube en producción (fotos de Guardianes, imágenes de especies) se guarda en esa carpeta del servidor y no se pierde al reconstruir el contenedor.

En la primera instalación, copia el catálogo de imágenes desde tu computadora con `scp`:

En la terminal de tu computadora (Mac/PC local):
```bash
scp -i /ruta/a/tu/llave.pem -r /ruta/local/a/darboles/backend/uploads/ ubuntu@IP_DEL_SERVIDOR:~/darboles/backend/
```

> ⚠️ **Si tu servidor ya corría una versión sin este volumen**, las imágenes subidas en producción están *dentro* del contenedor actual. Antes del primer `docker compose up -d --build` con esta versión, sácalas al servidor, o el volumen (vacío o desactualizado) las va a tapar:
> ```bash
> sudo docker compose cp backend:/app/uploads ./backend/
> ```
> Solo hace falta esta vez; después del cambio ya viven en `backend/uploads/` del servidor.

---

## 5. Despliegue del Frontend (Next.js)

Instala las dependencias y compila la versión de producción del frontend:

```bash
npm install
npm run build
```

Una vez finalizado, utiliza **PM2** para iniciar el servidor y mantenerlo vivo:

```bash
pm2 start npm --name "darboles-web" -- run start
```

Configura PM2 para que inicie automáticamente si el servidor se reinicia:

```bash
pm2 startup
pm2 save
```

---

## 6. Configuración del Proxy (Nginx) y SSL

Para que los usuarios accedan mediante tu dominio web (`https://tudominio.com`) e interceptar el tráfico API de manera unificada, instalamos Nginx:

```bash
sudo apt install nginx -y
```

Crea un archivo de configuración para tu sitio:
```bash
sudo nano /etc/nginx/sites-available/darboles
```

Agrega esta configuración básica:

```nginx
server {
    server_name tudominio.com www.tudominio.com;

    # Enviar tráfico del Backend al puerto 8001. Sin "/" al final de proxy_pass:
    # el backend espera la ruta completa (/api/v1/..., /api/uploads/...).
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Enviar el resto del tráfico web al Frontend en el puerto 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Habilita la página y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/darboles /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Habilitar el Candado Verde (HTTPS / Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones en pantalla, Certbot actualizará automáticamente tu archivo de Nginx para redirigir el tráfico HTTP a HTTPS seguro. ¡Listo! Tu proyecto ahora está en producción.

---

## 7. Pasos Rápidos para Re-Desplegar (Actualizaciones)
Cuando hagas cambios en tu código local, uses `git push` y quieras que esos cambios se reflejen en producción, sigue **siempre** esta secuencia exacta en tu servidor:

```bash
cd ~/darboles
git status   # si hay cambios hechos a mano en el servidor, anótalos antes de seguir

# 1. Respaldo de la base de datos (el backend aplica migraciones al arrancar)
sudo docker compose exec -T db pg_dump -U darboles_user darboles_db > ~/backup_darboles_$(date +%F_%H%M).sql
ls -lh ~/backup_darboles_*.sql   # confirma que el archivo no pesa 0 bytes

# 2. Traer el código
git pull origin main

# 3. Backend (Python): reconstruye y aplica migraciones de Alembic
sudo docker compose up -d --build backend
sudo docker compose logs --tail=50 backend   # busca "Running upgrade ..." y que Uvicorn arranque sin errores
curl -s localhost:8001/api/v1/health

# (Opcional) Si necesitas inyectar nuevos árboles
sudo docker compose exec backend python app/seed.py

# 4. Frontend (React/Next.js)
npm install
npm run build
pm2 restart darboles-web
```

Si solo cambiaste el `.env`:
- Variables del backend (`SECRET_KEY`, `SMTP_*`, `TILOPAY_*`, `FRONTEND_URL`, `BACKEND_URL`): `sudo docker compose up -d backend` para recrear el contenedor con los valores nuevos.
- `NEXT_PUBLIC_API_URL`: `npm run build && pm2 restart darboles-web`.
- Cambiar `SECRET_KEY` cierra todas las sesiones abiertas; es normal que todos deban volver a iniciar sesión.

Las variables del formulario de empresas (`TOMATO_CRM_*`, `LEADS_*`) y de la sincronización de árboles (`TOMATO_SYNC_*`) también son del backend: `sudo docker compose up -d backend`.

Las imágenes de `backend/uploads/` no se tocan en este proceso: viven en el servidor gracias al volumen (ver sección 4).

### Si algo sale mal (rollback)
```bash
git log --oneline -5
git checkout <commit_anterior>
sudo docker compose up -d --build backend
npm run build && pm2 restart darboles-web
```

Si hay que volver la base de datos al respaldo:
```bash
cat ~/backup_darboles_FECHA.sql | sudo docker compose exec -T db psql -U darboles_user darboles_db
```

---

## 8. Notas de Seguridad (auditoría sep-2026)

- **`/api/v1/admin/*` y `PUT /api/v1/admin/config`** ahora exigen sesión de
  admin (`is_admin`). Antes eran públicos — cualquiera podía crear productos,
  ver todos los pedidos, marcar pedidos como pagados/entregados, o cambiar el
  número SINPE de cobro. `GET /admin/trees` y `GET /config` siguen públicos a
  propósito (los usa la tienda `/regalos` sin sesión).
- **El total del pedido (`/checkout/gift`) ahora se recalcula siempre en el
  servidor** a partir de `TreeSpecies.price_crc` en base de datos — el
  `total_amount_crc` que manda el navegador ya es solo informativo, nunca se
  usa para cobrar.
- **`SECRET_KEY` es obligatoria** (ver sección 3) — antes tenía un valor por
  defecto inseguro, deliberadamente diseñado para no verse como un secreto y
  así no disparar alertas de escaneo (comentario que estaba en el código).
- **Contraseña de Postgres**: ya no está hardcodeada en `docker-compose.yml`
  — se lee de `DB_USER`/`DB_PASSWORD`/`DB_NAME` en `.env` (ver sección 3). El
  puerto de Postgres (5433) ahora solo escucha en `127.0.0.1`, no en la red
  pública.
- **Subida de archivos** (imágenes de árbol, comprobantes de pago): se valida
  tipo de archivo (JPEG/PNG/WebP, +PDF para comprobantes) y tamaño máximo
  (5 MB), y el nombre en disco siempre se genera en el servidor — nunca se usa
  el nombre que manda el cliente (evita que alguien escriba fuera de la
  carpeta de uploads con un nombre tipo `../../algo`).
- **Stock**: si un pago con tarjeta falla o se cancela, el stock reservado en
  `/checkout/gift` se restaura automáticamente.

### Formulario de empresas (CRM de tomatocr.com)

- **Activar:** generar la clave con `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`, ponerla como `DARBOLES_API_KEY` en tomatocr.com (`sudo systemctl restart tomato`) y como `TOMATO_CRM_API_KEY` aquí, junto con `TOMATO_CRM_URL`; luego `sudo docker compose up -d backend`.
- **Comprobar:** `sudo docker compose logs backend | grep "solicitud de empresa"` muestra cada envío (sin datos personales): `enviada al CRM` es lo normal; `enviada por correo de respaldo … motivo=…` dice por qué no entró.
- **Si el motivo es `401` (las claves no coinciden):** comparar la clave que ve cada aplicación sin mostrarla, con su largo y una huella. Las dos líneas deben ser idénticas (43 caracteres para una clave de `token_urlsafe(32)`); el primer y último carácter delatan comillas o espacios pegados.

  En el servidor de darboles.com:
  ```bash
  cd ~/darboles && sudo docker compose exec backend python -c "import os,hashlib;k=os.environ.get('TOMATO_CRM_API_KEY','');print(len(k), hashlib.sha256(k.encode()).hexdigest()[:12], repr(k[:1]), repr(k[-1:]))"
  ```
  En el servidor de tomatocr.com (su entorno de producción está en `.venv`, con punto):
  ```bash
  cd /home/ubuntu/tomatocr && .venv/bin/python -c "from app.core.config import settings;import hashlib;k=settings.DARBOLES_API_KEY;print(len(k), hashlib.sha256(k.encode()).hexdigest()[:12], repr(k[:1]), repr(k[-1:]))"
  ```
  Ese comando lee el `.env`, no el servicio en marcha: después de corregir la clave hay que reiniciar (`sudo systemctl restart tomato`, unos 40 s) o seguirá respondiendo `401`. En darboles.com, un cambio de clave se aplica con `sudo docker compose up -d backend` (`restart` no vuelve a leer el `.env`).
- **Otros motivos:** `503` = tomatocr.com no tiene `DARBOLES_API_KEY` o no se reinició; `CRM sin configurar` = faltan `TOMATO_CRM_URL`/`TOMATO_CRM_API_KEY` aquí o no se recreó el contenedor; `no respondió en 10 s` / `sin conexión` = tomatocr.com caído.
- **Si la clave se filtra:** generar otra y cambiarla en los dos `.env` al mismo tiempo.
- **IP real:** el límite por IP usa `X-Real-IP`, que pone Nginx (`proxy_set_header X-Real-IP $remote_addr;` en `location /api/`). Solo se cree en ese encabezado cuando la conexión llega desde el propio servidor.
- **Límite en memoria:** se reinicia con cada deploy del backend; el backend debe seguir corriendo con un solo proceso de Uvicorn.

### Sincronización de árboles de TOMATO

El backend copia los árboles de los proyectos de reforestación de TOMATO desde `TOMATO_SYNC_URL` (docs/INTEGRACION_TOMATOCR.md → "Sincronización de árboles").

- **Cuándo corre:** una vez al día, a las `TOMATO_SYNC_HOUR`:00 hora de Costa Rica (3:00 por defecto). Al arrancar el backend solo corre si la última sincronización exitosa tiene más de 24 h, así un deploy no suma corridas. Siempre es una foto completa: si una página falla, no cambia nada y se conservan los datos anteriores.
- **Forzarla:** en /admin → Árboles Sembrados → **Sincronizar ahora**, o en el servidor:
  ```bash
  cd ~/darboles && sudo docker compose exec backend python -m app.services.tomato_sync
  ```
- **Ver cómo le fue:** el recuadro de /admin → Árboles Sembrados muestra la última sincronización exitosa y el error del último intento, si falló. En el log:
  ```bash
  sudo docker compose logs backend | grep "sincronización de TOMATO" | tail -5
  ```
- **`401` (clave rechazada):** `TOMATO_SYNC_API_KEY` de aquí y `DARBOLES_SYNC_API_KEY` de tomatocr.com deben ser idénticas. Para compararlas sin mostrarlas (largo y huella):
  ```bash
  cd ~/darboles && sudo docker compose exec backend python -c "import os,hashlib;k=os.environ.get('TOMATO_SYNC_API_KEY','');print(len(k), hashlib.sha256(k.encode()).hexdigest()[:12], repr(k[:1]), repr(k[-1:]))"
  ```
  ```bash
  cd /home/ubuntu/tomatocr && .venv/bin/python -c "from app.core.config import settings;import hashlib;k=settings.DARBOLES_SYNC_API_KEY;print(len(k), hashlib.sha256(k.encode()).hexdigest()[:12], repr(k[:1]), repr(k[-1:]))"
  ```
  Después de corregir: `sudo systemctl restart tomato` en tomatocr.com y `sudo docker compose up -d backend` aquí.
- **`503`:** tomatocr.com no tiene `DARBOLES_SYNC_API_KEY` configurada o no se reinició.
- **Un solo proceso:** el programador vive dentro del backend (APScheduler). Si algún día el backend corre con varios procesos de Uvicorn, cada uno sincronizaría por su cuenta: habría que pasarlo a un cron del servidor.

### ⚠️ Pendiente — necesita tu input, no lo inventamos

El callback `GET /tilopay-callback` solo lee los parámetros con los que
Tilopay redirige el navegador del comprador (`code=1` significa "pagado").
**No hay verificación server-to-server contra la API de Tilopay ni validación
de firma/HMAC** — no encontramos en el repo documentación del endpoint o
formato real de verificación de Tilopay, así que no se implementó una llamada
a ciegas (podría ser peor que no tener nada). Antes de confiar en este flujo
para pagos reales con tarjeta, hay que conseguir de Tilopay (soporte o panel
de comercio) el endpoint de verificación de transacción o el mecanismo de
firma de su webhook, e implementarlo en `backend/app/routers/payments.py`
(función `tilopay_callback`).
