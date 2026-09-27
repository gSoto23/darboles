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
DATABASE_URL=postgresql://darboles_user:tu_password_seguro@db/darboles_db
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
```

Guarda los cambios (`Ctrl+O`, `Enter`, `Ctrl+X`).

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

    # Enviar tráfico del Backend al puerto 8001
    location /api/ {
        proxy_pass http://localhost:8001/;
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

