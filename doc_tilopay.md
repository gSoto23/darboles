# Documentación: Integración de Tilopay y Conversión a Colones (CRC)

## Resumen del Flujo
La plataforma Dárboles fue migrada para operar íntegramente en Colones (CRC) e integrada con la pasarela de pagos Tilopay. El flujo transaccional para pagos con tarjeta sigue el modelo de **Tokenización y Redirección**.

### 1. Migración a Moneda Local (CRC)
- La base de datos y modelos (e.g., `tree_species`) fueron migrados para manejar la columna `price_crc` (entero) en lugar de `price_usd` (flotante).
- Toda la tienda renderiza únicamente precios en Colones, con el símbolo `₡`.
- Todas las dependencias en la tasa de cambio fija (`EXCHANGE_RATE = 515`) fueron erradicadas para mayor precisión en la facturación y consistencia en el backend.

### 2. Flujo de Checkout con Tilopay
El archivo `backend/app/services/tilopay.py` maneja la interacción con la API de la pasarela:
1. **Generación del Token (`/login`):** Utiliza las credenciales `TILOPAY_USER` y `TILOPAY_PASSWORD` para obtener un `access_token` temporal, válido para la sesión.
2. **Creación del Checkout (`/processPayment`):** Se envía un payload con la llave primaria (`TILOPAY_KEY`), la información del cliente, el **total en colones recalculado en el servidor** (nunca el que manda el navegador — ver sección 5), y la **URL de retorno (callback)**.
3. **Redirección Segura:** Tilopay responde con una URL transaccional (`checkout_url`). El frontend de Dárboles intercepta esta URL y rutea al usuario fuera del sitio mediante `window.location.href = checkout_url`.

### 3. Webhooks y Callbacks
- Ruta: `GET /api/v1/payments/tilopay-callback`
- Una vez finalizada la transacción dentro del portal seguro de Tilopay (ya sea exitosa o denegada), Tilopay redirige al cliente de vuelta a este endpoint en el servidor de Dárboles (URL construida con `BACKEND_URL`, ver sección 4 — antes estaba hardcodeada a `http://localhost:8001` y por eso no funcionaba en producción).
- **Validación:** Dárboles captura los `Query Parameters` proporcionados (como `txn_ref`, `code`, `description`).
  - Si `code == "1"`: El pago es exitoso. La base de datos actualiza el estado de la compra a `paid`.
  - Si ocurre otro código o se cancela, la compra cambia a `failed` y se restaura el stock reservado.
- Tras la actualización del estado, se devuelve un `RedirectResponse` a `{FRONTEND_URL}/dashboard`, cerrando exitosamente la experiencia del cliente.
- ⚠️ **Limitación conocida**: esta validación es solo por parámetros de query,
  sin verificación server-to-server contra Tilopay ni firma/HMAC. No
  implementamos esa verificación porque no tenemos documentación del endpoint
  real de Tilopay para hacerlo — ver el pendiente en `DEPLOYMENT.md` sección 8.

### 4. Variables de Entorno Requeridas (`.env` del Backend)
```env
TILOPAY_USER=tu_usuario
TILOPAY_PASSWORD=tu_password
TILOPAY_KEY=tu_llave_primaria
FRONTEND_URL=http://localhost:3000
# URL pública del backend, usada para construir el callback que se le pasa a
# Tilopay. En producción debe ser la URL real (ej. https://darboles.com/api).
BACKEND_URL=http://localhost:8001
```

### 5. Integridad del monto cobrado
El `/checkout/gift` recibe `total_amount_crc` del cliente, pero **solo lo usa
como referencia**: el monto real que se envía a Tilopay se recalcula siempre
en el servidor sumando `TreeSpecies.price_crc × cantidad` (+ el costo de envío
declarado por línea) para cada árbol del carrito, consultado directo en base
de datos. Así, aunque alguien manipule el total en el navegador antes de
enviarlo, lo que se cobra siempre corresponde a los precios reales.
