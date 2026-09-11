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

FOURGEEKS_API_KEY=...
TILOPAY_USER=...
TILOPAY_PASSWORD=...
TILOPAY_KEY=...
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu_correo
SMTP_PASSWORD=tu_password
SENDER_EMAIL=tu_correo
FRONTEND_URL=https://tudominio.com
# URL pública del backend (a la que Tilopay redirige al comprador tras pagar).
# Antes estaba hardcodeada a http://localhost:8001 — con eso el pago con
# tarjeta no podía completarse en producción.
BACKEND_URL=https://tudominio.com/api
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

### Subir archivos ignorados por Git
¡Atención! Carpetas como `backend/uploads/` (donde se guardan imágenes) suelen estar ignoradas en tu archivo `.gitignore` por seguridad y no llegarán al servidor con `git pull`. Debes copiarlas manualmente desde tu computadora local usando `scp`:

En la terminal de tu computadora (Mac/PC local):
```bash
scp -i /ruta/a/tu/llave.pem -r /ruta/local/a/darboles/backend/uploads/ ubuntu@IP_DEL_SERVIDOR:~/darboles/backend/
```

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

    # Enviar tráfico del Backend al puerto 8001
    location /api/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_addrs;
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
git pull origin main

# 1. Si cambiaste código de Python (Backend) o quieres inyectar base de datos
sudo docker compose up -d --build

# (Opcional) Si necesitas inyectar nuevos árboles
sudo docker compose exec backend python app/seed.py

# 2. Si cambiaste código de React/Next.js (Frontend)
npm install
npm run build
pm2 restart darboles-web
```
*(Nota: Recuerda usar `scp` para subir archivos que Git ignora, como el catálogo de imágenes)*

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
