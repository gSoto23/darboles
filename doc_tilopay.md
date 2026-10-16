# Tilopay: pago con tarjeta o SINPE Móvil

darboles.com cobra en línea con Tilopay por **redirección**: el comprador sale a la página
segura de Tilopay (tarjeta de crédito o débito, o SINPE Móvil si está activo en el panel de
Tilopay) y vuelve con el resultado. Dárboles nunca ve ni guarda datos de tarjetas.

Aparte existe el **SINPE Móvil con comprobante** (sin Tilopay): el comprador transfiere al
número configurado en /admin y un administrador confirma el pedido a mano.

## Flujo

```
/regalos → "Tarjeta o SINPE Móvil"
   │ POST /api/v1/payments/checkout/gift
   ▼
Backend: recalcula el total con los precios de la base, reserva stock, crea los Gift
(pending) y un CardPayment (pending) con el monto y el correo exactos.
   │ Tilopay /login → token ; /processPayment (hashVersion V2, capture 1) → URL
   ▼
Página de Tilopay ──► el comprador paga
   │ redirección: GET {BACKEND_URL}/api/v1/payments/tilopay-callback?txn_ref=…&code=…&auth=…&order=…&tpt=…&OrderHash=…
   │ (y/o aviso de servidor a servidor: POST /api/v1/payments/tilopay-webhook)
   ▼
Backend verifica el OrderHash → paid / failed / awaiting / review
   │ 303 → {FRONTEND_URL}/pago/resultado?estado=pagado|pendiente|verificando|fallido|no-encontrado&ref=…
   ▼
Página de resultado (no requiere sesión). Si se pagó: correo "Pago verificado" al comprador.
```

Después del pago, la logística sigue igual que con SINPE: en /admin el pedido pasa a
Enviado y luego a Entregado (ahí se generan los certificados y se envían a quien recibe).

## Verificación del retorno (la parte de seguridad)

Un pedido **solo** queda pagado si se cumplen todas estas condiciones, igual que en el plugin
oficial de Tilopay para WooCommerce (v3.1.3, `WCTilopay::computed_customer_hash` y
`TilopayHelper.php`):

1. `code == "1"`.
2. `OrderHash` de 64 caracteres igual al que calcula darboles.com.
3. Código de autorización (`auth`) de al menos 6 caracteres y **nunca usado en otro cobro**
   (índice único en `card_payments.auth_code`).
4. `order` igual al `txn_ref` del cobro.

**Fórmula del `OrderHash` (hashVersion V2)**, en `services/tilopay.py → compute_order_hash`:

```
clave   = tpt + "|" + TILOPAY_KEY + "|" + TILOPAY_PASSWORD
mensaje = http_build_query de PHP, en este orden:
          api_Key=TILOPAY_KEY, api_user=TILOPAY_USER, orderId=tpt, external_orden_id=txn_ref,
          amount=number_format(monto, 2)   (ej. 33000 → "33,000.00"),
          currency=CRC, responseCode=code, auth=auth, email=correo enviado a Tilopay
OrderHash = HMAC-SHA256(mensaje, clave) en hexadecimal
```

El monto y el correo salen de `card_payments`, es decir, de lo que se le envió a Tilopay, no
del retorno. Solo Tilopay y Dárboles conocen la llave y la contraseña, así que un retorno
armado a mano (por ejemplo, abrir `…/tilopay-callback?code=1`) no pasa.

| Resultado | Qué pasa |
| --- | --- |
| Pago válido | `CardPayment` y los `Gift` pasan a `paid`; correo "Pago verificado" al comprador. Si el pedido ya se había liberado por abandono, se vuelve a reservar el stock. |
| `code = Pending` (típico de SINPE Móvil) | `awaiting`: el pedido sigue reservado y **no** se libera a las 2 h. La confirmación llega por el webhook. |
| Rechazado o cancelado | `failed`; se libera el stock. No requiere hash: solo afecta al propio pedido. |
| Hash inválido, autorización repetida u orden distinta | `review`: el pedido **no cambia** y se envía una alerta a `PAYMENT_ALERT_EMAILS` para revisar el cobro en el panel de Tilopay. |
| Recargar la página de retorno | No repite nada (el cobro ya está `paid`). |
| Sin respuesta de Tilopay en 2 h | Un trabajo cada 15 min lo marca `expired` y libera el stock. |

Estados de `card_payments.status`: `pending`, `awaiting`, `paid`, `failed`, `expired`, `review`.

## Variables de entorno (backend)

```env
TILOPAY_USER=…            # usuario API (panel de Tilopay → Integraciones)
TILOPAY_PASSWORD=…        # contraseña API (también firma el OrderHash)
TILOPAY_KEY=…             # llave de integración
BACKEND_URL=https://darboles.com    # base del retorno: + /api/v1/payments/tilopay-callback
FRONTEND_URL=https://darboles.com   # base de /pago/resultado
PAYMENT_ALERT_EMAILS=darbolescr@gmail.com   # opcional; por defecto SENDER_EMAIL
```

El modo de pruebas o producción se elige **en el panel de Tilopay** ("Ambiente de pago"), no
aquí: la URL de la API es la misma (`https://app.tilopay.com/api/v1`).

## Configuración en el panel de Tilopay

- **Métodos de pago:** tarjetas y, si se quiere, SINPE Móvil.
- **Webhook / URL de notificación** (en "Gestión de URLs"):
  `https://darboles.com/api/v1/payments/tilopay-webhook`. Sin él, un SINPE Móvil que quede
  pendiente al volver no se confirmaría solo.

## Probar

- Pruebas automáticas (Tilopay simulado): `cd backend && venv/bin/python -m pytest tests/test_tilopay.py -q`.
- De punta a punta: con el panel en **modo pruebas**, comprar con una tarjeta de prueba de Tilopay
  y revisar que el pedido quede *Confirmado* en /admin y que llegue el correo. Si queda en
  `review` con "OrderHash inválido", revisar que `TILOPAY_KEY`, `TILOPAY_USER` y
  `TILOPAY_PASSWORD` sean los de la misma integración.
- Antes de pasar a producción: apagar el modo pruebas en el panel de Tilopay.

## Integridad del monto

El total que llega del navegador es solo informativo: el backend lo recalcula con
`TreeSpecies.price_crc × cantidad` + la tarifa de envío (que solo puede ser la de GAM o la de
fuera del GAM configuradas en /admin). Ese total es el que se envía a Tilopay y el que entra en
el hash.
