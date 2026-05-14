# Guía de Despliegue para Dárboles (VPS / Ubuntu)

Esta guía detalla los pasos paso a paso para desplegar el proyecto Dárboles (Frontend en Next.js, Backend en FastAPI y Base de Datos en PostgreSQL) en un servidor virtual privado (VPS) limpio con **Ubuntu 22.04 o superior**.

## 1. Preparación del Servidor

Conéctate a tu servidor mediante SSH y actualiza los paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Docker y Docker Compose
Requerido para aislar la base de datos y el backend.

```bash
sudo apt install docker.io docker-compose -y
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

Luego, levanta los contenedores en segundo plano (`-d`):

```bash
sudo docker-compose up -d --build
```

Para verificar que estén corriendo correctamente sin errores:
```bash
sudo docker-compose logs -f backend
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
