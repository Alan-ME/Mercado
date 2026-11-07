---
doc_code: DOC-SMCTA-GOV-003
title: Especificación de Casos de Uso Críticos (Formato Cockburn Fully Dressed)
subtitle: Contratos Operativos Paso a Paso, Invariantes Pre/Post y Extensiones de Error para Custodia, P2P y TPV
phase: 06 — Gobernanza de Ingeniería y Blindaje Técnico Oficial
version: 2.1.0
date: Noviembre 2026
authors: Equipo de Ingeniería de Software — Proyecto SMCTA
institution: Especificación Formal de Requisitos bajo ISO/IEC/IEEE 29148 y Alistair Cockburn
toc: true
---

## Resumen

Mientras las historias de usuario ágiles capturan intenciones generales de producto, los flujos que movilizan valor en custodia, permutan productos entre usuarios bajo concurrencia o liberan fondos en terminales físicos exigen contratos deterministas sin margen de interpretación entre roles. Este documento especifica en formato **Alistair Cockburn *Fully Dressed*** los cinco casos de uso nucleares de **SMCTA v2.2** (`UC-01` a `UC-05`), detallando actores, intereses de los *stakeholders*, precondiciones verificables, garantías mínimas ante fallo (*rollback*), garantías de éxito y todas las ramificaciones exactas de códigos de error HTTP, incluyendo el **Trading P2P de Productos con Créditos de Barra (`UC-03`)** y el **Intercambiador de Productos Descontinuados con Incentivo estilo KeyDrop (`UC-05`)**.

---

## Autómata Finito de Estados del Cupón (`CouponState`)

Todos los casos de uso operan gobernados por el autómata determinista implementado en `packages/shared/src/stateMachine.ts` (`ALLOWED_TRANSITIONS`), cuya representación formal se ilustra a continuación:

<!-- FIGURE: FIG-STATE-MACHINE -->

---

## UC-01: Emisión Primaria de Cupón y Fondeo Inicial de Custodia Escrow

| Atributo Normativo | Especificación Formal |
| :--- | :--- |
| **Identificador y Endpoint** | `UC-01` — `POST /api/v1/checkout/primary` (`checkoutService.primaryCheckout`) |
| **Nivel y Alcance** | Nivel Usuario (*Sea-Level*) — Caja negra transaccional sobre `@smcta/backend` |
| **Actor Primario** | Consumidor Primario autenticado bajo el contexto de un *Tenant* válido |
| **Stakeholders e Intereses** | **Consumidor:** Obtener titularidad inmediata de su cupón respaldado al 100%. **Comercio (*Tenant*):** Asegurar que el pago quede constituido sin riesgo de contracargo informal. **Auditoría:** Impedir que exista un cupón en cartera sin su asiento `CHECKOUT` correlativo. |
| **Precondiciones** | 1. El encabezado `x-tenant-subdomain` o `Host` resuelve a un registro activo en `tenants`. 2. El usuario se encuentra identificado (`buyerId` / `x-user-id`). 3. `nominalPrice > 0` y `expirationDate` es una fecha futura válida en ISO-8601. |
| **Garantía Mínima (En Fallo)** | Transacción abortada (`ROLLBACK`); cero filas insertadas en `coupons`, `escrow_ledgers` ni `user_events`; cero emisiones en `EventHub`. |
| **Garantía de Éxito (Postcondición)** | Cupón creado en estado `EN_WALLET` con `token_version = 0`; asiento inmutable `CHECKOUT` por `+nominalPrice` registrado en `escrow_ledgers`; notificación persistida y emitida vía SSE post-`COMMIT`. |

### Escenario Principal de Éxito (`UC-01`)
1. El Consumidor selecciona uno o más productos en la tienda *White-Label* (o en el carrito `CartDrawer` de *BREW/DESK*) y envía la orden de compra primaria indicando `nominalPrice`, `productName` y `expirationDate`.
2. El middleware `tenantResolver` resuelve el *Tenant* activo e inyecta su configuración y `QrSecret` en el contexto de la petición.
3. `checkoutService` valida la estructura con Zod, verifica coherencia temporal respecto al reloj inyectado (`Clock.now()`) y abre una unidad de trabajo `SERIALIZABLE`.
4. El sistema inserta el registro inicial del cupón en `coupons` y ejecuta la transición formal `EMITIDO -> EN_WALLET` verificada por `assertTransition`.
5. El sistema inserta en `escrow_ledgers` el asiento `transaction_type = 'CHECKOUT'` con `amount_in_escrow = +nominalPrice`, protegido por el índice único parcial `uq_ledger_checkout_once`.
6. El sistema registra el evento `PRIMARY_PURCHASE` en `user_events` y confirma la transacción (`COMMIT`).
7. Una vez confirmado el `COMMIT`, el servicio publica el delta en `EventHub` (canal SSE `/api/v1/notifications/stream`) y responde `HTTP 201 Created` con el `CouponDTO`.

### Extensiones y Flujos Alternativos (`UC-01`)
- **2a. Subdominio inexistente o no registrado:** `tenantResolver` aborta antes de tocar servicios de dominio y devuelve `HTTP 404 Not Found` (`TENANT_NOT_FOUND`).
- **3a. Importe nominal nulo, negativo o fecha malformada:** El validador rechaza la carga útil con `HTTP 422 Unprocessable Entity` (`VALIDATION_ERROR`).
- **3b. Identidad de comprador ausente en modo producción (`enableDevRoutes = false`):** Rechazo inmediato con `HTTP 401 Unauthorized` (`UNAUTHORIZED_USER`).

---

## UC-02: Publicación de Oferta en Mercado Secundario P2P con Price Collar y Cuota Diaria

| Atributo Normativo | Especificación Formal |
| :--- | :--- |
| **Identificador y Endpoint** | `UC-02` — `POST /api/v1/p2p/orders` (`p2pService.publishOrder`) |
| **Actor Primario** | Titular actual del cupón (*Vendedor Secundario*) |
| **Stakeholders e Intereses** | **Vendedor:** Conocer de antemano su producido neto exacto y listar su cupón sin perder la garantía si cancela. **Comercio (*Tenant*):** Impedir sobreprecios abusivos o remates por debajo del piso autorizado y bloquear acaparadores. **Seguridad TPV:** Invalidar cualquier QR generado antes de listar el cupón. |
| **Precondiciones** | El cupón existe en el *Tenant* activo, pertenece a `sellerId` y su estado es exactamente `EN_WALLET`. |
| **Garantía Mínima (En Fallo)** | El cupón conserva estado `EN_WALLET` y su `token_version` intacto; no se inserta orden en `p2p_orders`. |
| **Garantía de Éxito (Postcondición)** | Cupón pasa a `PUBLICADO_P2P` con `token_version = token_version + 1`; se crea exactamente una orden `OPEN` en `p2p_orders` con el desglose decimal calculado. |

### Escenario Principal de Éxito (`UC-02`)
1. El Vendedor ajusta el precio deseado `askingPrice` en el control deslizante de su billetera (que muestra en vivo la banda permitida y su neto estimado) y confirma la publicación.
2. `p2pService` adquiere exclusión mutua sobre la clave `"coupon:" + couponId` mediante `LockManager`.
3. Dentro de una transacción `SERIALIZABLE`, el repositorio lee y bloquea la fila del cupón (`SELECT ... FOR UPDATE`), verificando pertenencia al *Tenant* y coincidencia exacta `coupon.currentOwnerId === sellerId`.
4. El sistema verifica que el cupón se encuentre en estado `EN_WALLET` y que el tiempo restante hasta `expirationDate` supere estrictamente `tenant.closureHoursBeforeEvent`.
5. El sistema invoca `validatePriceCollar(nominalPrice, askingPrice, priceFloorPct, priceCeilingPct)` confirmando que $P_{\text{ask}} \in [P_{\min}, P_{\max}]$.
6. El sistema contabiliza en `p2p_orders` las órdenes creadas por `sellerId` en el día UTC en curso y verifica que su cantidad sea menor que `tenant.maxDailyResalesPerUser`.
7. El sistema actualiza el cupón a `PUBLICADO_P2P` incrementando `token_version + 1` (revocando cualquier QR previo en poder del vendedor) e inserta la nueva orden `OPEN` en `p2p_orders`.
8. Tras confirmar el `COMMIT`, emite notificación SSE y responde `HTTP 201 Created` con `P2POrderDTO` y `commissionBreakdown`.

### Extensiones y Flujos Alternativos (`UC-02`)
- **3a. Usuario solicitante no es el dueño actual del cupón:** Aborta con `HTTP 403 Forbidden` (`FORBIDDEN_NOT_OWNER`).
- **4a. El cupón ya está publicado, canjeado o vencido:** Aborta con `HTTP 409 Conflict` (`COUPON_NOT_IN_WALLET`).
- **4b. Ventana de cierre pre-evento alcanzada ($\Delta t \le \text{closureHoursBeforeEvent}$):** Aborta con `HTTP 423 Locked` (`MARKET_CLOSED_BEFORE_EVENT`).
- **5a. Precio fuera de la banda paramétrica $[\phi_{\min}, \phi_{\max}]$:** Aborta con `HTTP 422 Unprocessable Entity` (`PRICE_COLLAR_VIOLATION`) informando piso y techo exactos en `details`.
- **6a. Superación del límite diario de reventas por usuario:** Aborta con `HTTP 429 Too Many Requests` (`DAILY_RESALE_LIMIT_REACHED`).

---

## UC-03: Ejecución Atómica de Compra Secundaria y Liquidación de Comisiones (Split P2P)

| Atributo Normativo | Especificación Formal |
| :--- | :--- |
| **Identificador y Endpoint** | `UC-03` — `POST /api/v1/p2p/orders/:orderId/buy` (`p2pService.buyOrder`) |
| **Actor Primario** | Comprador Secundario autenticado (`buyerId`) |
| **Stakeholders e Intereses** | **Comprador:** Adquirir titularidad exclusiva e inmediata sin riesgo de doble cobro ni reutilización del QR por el vendedor anterior. **Vendedor:** Cobrar `netSellerProceeds`. **Comercio y Plataforma:** Registrar sus respectivas fracciones de comisión (`tenantNetFee` y `platformShare`) manteniendo `amount_in_escrow = 0.00` de variación sobre el principal. |
| **Precondiciones** | Existe una orden `orderId` en estado `OPEN` dentro del *Tenant* activo. |
| **Garantía Mínima (En Fallo)** | Si ocurre colisión concurrente o fallo de validación, ni la titularidad del cupón ni el libro mayor sufren mutación; exactamente a lo sumo un comprador puede triunfar. |
| **Garantía de Éxito (Postcondición)** | Orden pasa a `MATCHED`; `coupons.current_owner_id = buyerId`, `state = 'EN_WALLET'` y `token_version = token_version + 1`; asiento `P2P_SPLIT` (`amount_in_escrow = 0.00`, `tenant_fee_accumulated = tenantNetFee`, `platform_fee = platformShare`) insertado en `escrow_ledgers`. |

### Escenario Principal de Éxito (`UC-03`)
1. El Comprador selecciona una oferta abierta en el libro de órdenes del recinto y solicita su compra inmediata.
2. `p2pService` intenta adquirir `locks.withLock("order:" + orderId, ttlMs)`.
3. Con el candado adquirido, inicia `BEGIN ISOLATION LEVEL SERIALIZABLE` y bloquea la orden (`SELECT ... FOR UPDATE`) y su cupón asociado.
4. Verifica que `order.status === 'OPEN'`, que `buyerId !== order.sellerId` (prohibición de auto-negociación / *wash trading*) y que el mercado no haya entrado en ventana de cierre pre-evento.
5. Calcula con aritmética decimal exacta `calculateCommissionBreakdown` obteniendo `sellerFeeAmount`, `buyerFeeAmount`, `netSellerProceeds`, `totalBuyerPrice`, `platformShare` y `tenantNetFee`.
6. Actualiza `p2p_orders` a `status = 'MATCHED'` persistiendo `buyer_id`, `matched_at` y las cuatro columnas monetarias del cierre.
7. Transfiere el cupón a `current_owner_id = buyerId`, estado `EN_WALLET` e incrementa `token_version + 1`.
8. Inserta en `escrow_ledgers` el asiento `P2P_SPLIT` con `amount_in_escrow = 0.00` (el principal nominal original permanece inalterado en custodia), `tenant_fee_accumulated = tenantNetFee` y `platform_fee = platformShare`.
9. Registra eventos `P2P_SOLD` (para el vendedor) y `P2P_BOUGHT` (para el comprador), ejecuta `COMMIT`, libera el candado propietario en Redis/memoria, despacha ambos eventos por SSE y responde `HTTP 200 OK`.

### Extensiones y Flujos Alternativos (`UC-03`)
- **2a. Orden bloqueada por otra compra concurrente en vuelo:** `LockManager` rechaza sin abrir transacción SQL devolviendo `HTTP 423 Locked` (`P2P_ORDER_LOCKED`).
- **4a. La orden ya fue adjudicada o cancelada milisegundos antes:** Aborta con `HTTP 409 Conflict` (`ORDER_NOT_OPEN`).
- **4b. Intento de autocompra (`buyerId === sellerId`):** Aborta con `HTTP 422 Unprocessable Entity` (`SELF_TRADE_FORBIDDEN`).
- **6a. Colisión de serialización en PostgreSQL (`SQLSTATE 40001`):** El manejador traduce el conflicto a rechazo controlado `HTTP 409/423` preservando atomicidad total (verificado con 50 compradores simultáneos en `QA-02`).

---

## UC-04: Validación Criptográfica de QR Dinámico y Liquidación de Custodia en TPV

| Atributo Normativo | Especificación Formal |
| :--- | :--- |
| **Identificador y Endpoint** | `UC-04` — `POST /api/v1/tpv/validate-qr` (`tpvService.validateAndRedeem`) |
| **Actor Primario** | Operador / Lector TPV del Comercio Emisor |
| **Precondiciones** | El consumidor exhibe un token QR generado por `GET /api/v1/coupons/:id/qr-token` dentro de los últimos 30 segundos. |
| **Garantía Mínima (En Fallo)** | Ante firma inválida, token vencido, recinto cruzado o versión obsoleta, el cupón no cambia de estado y **cero centavos** abandonan la cuenta de custodia. |
| **Garantía de Éxito (Postcondición)** | Cupón pasa al estado terminal `CANJEADO` (`token_version + 1`); se inserta asiento único `REDEEM_RELEASE` por `-nominalPrice` en `escrow_ledgers` (`uq_ledger_terminal_once`), cerrando en `0,00` el saldo retenido de ese cupón. |

### Escenario Principal de Éxito (`UC-04`)
1. El Lector TPV escanea el código QR rotativo de la pantalla del cliente y envía la cadena `token` al endpoint del *Tenant* del local.
2. `tpvService` decodifica el payload `base64url` y ejecuta `verifyQrToken(token, tenant.qrSecret, clock.now(), 30_000)`:
   - Recalcula `HMAC-SHA256` con el `QrSecret` del *Tenant* receptor y verifica igualdad en tiempo constante (`timingSafeEqual`).
   - Comprueba que `payload.tenantId === tenant.tenantId`.
   - Comprueba vigencia temporal $|t_{\text{actual}} - t_{\text{token}}| \le 30.000\text{ ms}$.
3. Adquiere candado sobre `"coupon:" + payload.couponId` y abre transacción `SERIALIZABLE` bloqueando el cupón (`FOR UPDATE`).
4. Verifica concordancia triple contra el estado persistido:
   - `coupon.state === 'EN_WALLET'` (no está publicado en P2P, ni ya canjeado, ni vencido).
   - `coupon.currentOwnerId === payload.ownerId`.
   - `coupon.tokenVersion === payload.version` (defensa anti-boomerang).
5. Ejecuta la transición irreversible `EN_WALLET -> CANJEADO` incrementando `token_version + 1`.
6. Inserta en `escrow_ledgers` el asiento `REDEEM_RELEASE` con `amount_in_escrow = -coupon.nominalPrice`.
7. Registra el evento `COUPON_REDEEMED`, confirma `COMMIT`, notifica por SSE a la billetera del consumidor y retorna `HTTP 200 OK` indicando `releasedToMerchant = nominalPrice`.

### Extensiones y Flujos Alternativos (`UC-04`)
- **2a. Firma alterada o QR perteneciente a otro comercio (*Tenant* cruzado):** Rechazo inmediato `HTTP 401 Unauthorized` (`QR_INVALID_SIGNATURE` / `QR_TENANT_MISMATCH` — verificado en `QA-04`).
- **2b. Captura de pantalla con antigüedad superior a 30 segundos:** Rechazo `HTTP 401 Unauthorized` (`QR_TOKEN_EXPIRED`).
- **4a. Captura reciente (< 30 s) pero el cupón fue publicado o revendido tras emitirla (`payload.version !== coupon.tokenVersion`):** Rechazo `HTTP 409 Conflict` (`QR_STALE_TOKEN`).
- **4b. Intento de doble escaneo sobre cupón ya redimido:** Rechazo `HTTP 409 Conflict` (`COUPON_ALREADY_REDEEMED` + salvaguarda física `uq_ledger_terminal_once`).

---

## UC-05: Rescate de Producto Descontinuado en el Item Changer y Canje de Combos en la Gold Area con Créditos Desbloqueados en TPV (Estilo KeyDrop)

| Atributo Normativo | Especificación Formal |
| :--- | :--- |
| **Identificador y Endpoints** | `UC-05` — `POST /api/v1/changer/swap` (Item Changer) y `POST /api/v1/changer/gold-redeem` (Gold Area) |
| **Actor Primario** | Consumidor titular de un cupón descontinuado (`DISCONTINUED`) o de Créditos Gold desbloqueados (`credits_balance`) |
| **Stakeholders e Intereses** | **Consumidor:** (a) Si su producto fue retirado del tablero, cambiarlo en el *Item Changer* por un producto equivalente activo (ej. un alfajor) recibiendo un incentivo en Créditos Gold; (b) Desbloquear los Créditos Gold ganados en sus trades P2P cuando su contraparte canjea el cupón en TPV y usarlos en la *Gold Area* para llevarse combos exclusivos. **Comercio (*Tenant*):** Cero devolución de efectivo por bajas de stock y garantía absoluta contra el farmeo de puntos (*wash-trading*), ya que los créditos de trade solo nacen cuando el producto se consume físicamente en barra. |
| **Precondiciones** | 1. Para *Item Changer*: el cupón de entrada pertenece a `userId`, está en `EN_WALLET` y su producto fue marcado como descontinuado (`isDiscontinued = true`). 2. Para *Gold Area*: el usuario posee `creditsBalance >= comboCostGold` (créditos ya desbloqueados tras el canje físico en TPV o por incentivo del *Changer*). |
| **Garantía Mínima (En Fallo)** | Transacción revertida (`ROLLBACK`); ni los cupones en billetera ni el saldo `users.balance` (`credits_balance`) sufren alteración. |
| **Garantía de Éxito (Postcondición)** | En *Item Changer*: el cupón descontinuado queda redimido por reemplazo (`token_version + 1`), se emite el nuevo cupón equivalente en `EN_WALLET` y se acredita el incentivo en `credits_balance`. En *Gold Area*: se debita `comboCostGold` de `credits_balance` y se emite el cupón del Combo Gold en `EN_WALLET`. |

### Escenario Principal de Éxito (`UC-05A` — Reemplazo de Producto Descontinuado en el Item Changer)
1. El Consumidor abre el **Item Changer** (interfaz de dos paneles estilo KeyDrop Skin Changer): a la izquierda selecciona su cupón de un producto retirado del tablero (ej. *Espresso Origen Colombia* descontinuado) y a la derecha elige del catálogo activo un producto equivalente (ej. un *Alfajor Artesanal* o *Mokaccino*).
2. El panel central calcula el valor reconocido aplicando el **Incentivo por Descontinuación ($\beta_{\text{disc}}$, ej. $+15\%$)** y muestra los **Créditos Gold de compensación** que se sumarán a su cuenta:
   $$V_{\text{rescate}} = \text{round}_2\left(P_{\text{nom}} \cdot \left(1 + \frac{\beta_{\text{disc}}}{100}\right)\right)$$
3. Al confirmar **"Intercambiar en Changer"**, el backend abre una transacción `SERIALIZABLE` bajo candado `LockManager`, quema el cupón descontinuado (`token_version + 1`), emite el nuevo cupón del producto equivalente en `EN_WALLET` y acredita directamente en `users.balance` los Créditos Gold de incentivo y remanente.

### Escenario Principal de Éxito (`UC-05B` — Desbloqueo de Créditos en TPV y Canje de Combos en Gold Area)
1. Cuando dos usuarios realizan un trueque libre P2P de productos distintos en `UC-03` (ej. un *Café* de `$10,00` por una *Empanada* de `$1,00`), el sistema registra `pending_reward_credits` en estado **Pendiente** sobre el cupón transferido.
2. Recién cuando el receptor acude al local y escanea el QR en `UC-04` (`POST /api/v1/tpv/validate-qr`), `tpvService` verifica que el cupón tenga créditos pendientes sin reclamar (`reward_claimed = false`), los transfiere atómicamente al saldo disponible `credits_balance` del usuario que entregó el producto y envía una alerta SSE en vivo.
3. Con sus Créditos Gold disponibles, el usuario ingresa a la **Gold Area** (tarjetas de combos con precios como `480 G`, `680 G`, `1200 G` estilo KeyDrop), selecciona un combo promocional y ejecuta el canje, debitándose los créditos y recibiendo el nuevo cupón en su billetera.

### Extensiones y Flujos Alternativos (`UC-05`)
- **1a. Intento de usar Créditos Gold que aún están en estado `Pendiente` (el otro usuario todavía no canjeó el cupón en la barra):** Rechazo `HTTP 422 Unprocessable Entity` (`INSUFFICIENT_UNLOCKED_CREDITS`) indicando cuántos créditos siguen pendientes de canje físico en TPV.
- **2a. Intento de farmear créditos pasándose el mismo cupón múltiples veces antes del TPV:** Como `reward_claimed` se marca en `true` en el primer y único canje físico en TPV, el cupón solo destraba recompensa una vez en toda su existencia.
- **3a. Selección en el panel derecho de un producto que también fue descontinuado:** Rechazo `HTTP 422 Unprocessable Entity` (`TARGET_PRODUCT_DISCONTINUED`).
