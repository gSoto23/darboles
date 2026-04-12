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
2. **Creación del Checkout (`/processPayment`):** Se envía un payload con la llave primaria (`TILOPAY_KEY`), la información del cliente, el total a pagar en colones, y la **URL de retorno (callback)**.
3. **Redirección Segura:** Tilopay responde con una URL transaccional (`checkout_url`). El frontend de Dárboles intercepta esta URL y rutea al usuario fuera del sitio mediante `window.location.href = checkout_url`.

### 3. Webhooks y Callbacks
- Ruta: `GET /api/v1/payments/tilopay-callback`
- Una vez finalizada la transacción dentro del portal seguro de Tilopay (ya sea exitosa o denegada), Tilopay redirige al cliente de vuelta a este endpoint en el servidor de Dárboles.
- **Validación:** Dárboles captura los `Query Parameters` proporcionados (como `txn_ref`, `code`, `description`). 
  - Si `code == "1"`: El pago es exitoso. La base de datos actualiza el estado de la compra a `paid`.
  - Si ocurre otro código o se cancela, la compra cambia a `failed`.
- Tras la actualización del estado, se devuelve un `RedirectResponse` a `http://localhost:3000/dashboard`, cerrando exitosamente la experiencia del cliente.

### 4. Variables de Entorno Requeridas (`.env` del Backend)
```env
TILOPAY_USER=tu_usuario
TILOPAY_PASSWORD=tu_password
TILOPAY_KEY=tu_llave_primaria
FRONTEND_URL=http://localhost:3000
```
