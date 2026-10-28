# SMCTA P2P v2 — Sistema de Mercado Comportamental y Trading de Activos

Implementación **ejecutable y completa** del proyecto SMCTA (rediseño P2P v2, White-Label) especificado en las 5 fases de la carpeta `Proyecto - SMCTA`. Cubre las Historias de Usuario US-01…US-06, las reglas de negocio RN-01…RN-06, las tareas TASK-001…TASK-008 y los 4 criterios del `QA Checklist.xlsx`.

---

## ▶️ Cómo ejecutar (Visual Studio Code · F5)

1. Abrí en VS Code **esta carpeta** (`implementation/`).
2. Instalá dependencias una sola vez (terminal integrada):
   ```bash
   npm install
   ```
3. Andá al panel **Run and Debug** (Ctrl+Shift+D) → seleccioná **“SMCTA · App completa (F5)”** → presioná **F5**.
   - Una tarea previa compila `shared` + el frontend, VS Code lanza el backend **bajo el depurador** (podés poner breakpoints) y la salida aparece en la **consola integrada** (Debug Console / Terminal).
4. Se abre `http://localhost:8080` con la app completa.

> No necesitás Docker, PostgreSQL ni Redis instalados: el proyecto arranca con **PostgreSQL embebido (PGlite)** y locks en proceso. Todo self-contained.

**Alternativas:**
```bash
npm run dev     # backend + frontend con hot-reload (Vite en :5173, API proxy a :8080)
npm start       # build de producción y servir todo desde :8080
npm test        # pruebas unitarias + integración del backend (Vitest)
npm run test:e2e# suite E2E Playwright (QA-01..04)
docker compose up   # ruta "documentada": Postgres 15 + Redis 7 + app
```

---

## 🧱 Stack y decisión técnica

Los documentos recomiendan **Node.js + TypeScript** (Fastify, `decimal.js`, validación con Zod), **React + Tailwind**, **PostgreSQL 15+**, **Redis 7** y **Playwright**. Se implementó **ese stack**.

Para que además arranque con **F5 sin instalar nada**, la persistencia y los locks usan **arquitectura hexagonal (puertos y adaptadores)**:

| Puerto | Adaptador por defecto (F5) | Adaptador “documentado” |
| --- | --- | --- |
| Base de datos | **PGlite** — motor **PostgreSQL real (WASM)** en proceso, corre el **DDL exacto** de `ARQ-002` con transacciones `SERIALIZABLE` | PostgreSQL en red (`pg`) con `DATABASE_URL` |
| Locks concurrencia | **En proceso** (atómico en el event-loop), esquema de clave `lock:coupon:{id}` | **Redis** (`ioredis`) con `REDIS_URL` |

Cambiar a la ruta documentada es solo definir `DATABASE_URL` / `REDIS_URL` (ver `.env.example`) — la lógica de negocio es idéntica.

---

## 🗺️ Arquitectura

Monorepo con workspaces npm:

```
implementation/
├─ packages/shared/     Contratos del Protocolo (DTOs, enums, códigos de error),
│                       matemática monetaria decimal (RN-03), Price Collar (RN-02),
│                       máquina de estados del cupón.
├─ apps/backend/        Fastify + PGlite/pg + lock manager. Rol 1 (Backend Core & Motor P2P)
│                       + Rol 3 (Gateway multi-tenant, Admin, TPV, PSP mock).
├─ apps/web/            React + Vite + Tailwind. Rol 2 (Frontend White-Label, Wallet,
│                       Marketplace) + UIs de Admin B2B y TPV (Rol 3).
└─ e2e/                 Playwright — QA Checklist (QA-01..04).
```

Las tres **hojas de ruta por rol** conviven en un solo sistema cohesivo y ejecutable: el backend expone **todos** los endpoints del `00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md`; el frontend implementa las vistas de Consumidor, Trader, Admin B2B y TPV como rutas de una misma SPA.

---

## ✅ Trazabilidad de consignas → implementación

### Historias de Usuario (Fase 02)
| US | Descripción | Implementación |
| --- | --- | --- |
| US-01 | Checkout primario + Escrow | `services/checkoutService.ts`, `routes/checkout.ts`, UI `pages/Storefront.tsx` |
| US-02 | QR dinámico de canje (30s) | `domain/qrToken.ts`, `services/walletService.ts`, UI `components/QrCanje.tsx` |
| US-03 | Publicar en mercado P2P | `services/p2pService.ts › publishOrder`, UI `pages/Marketplace.tsx` + `PriceCollarSlider` |
| US-04 | Comprar en mercado secundario | `services/p2pService.ts › buyOrder`, UI `Marketplace.tsx` (toast de concurrencia) |
| US-05 | Config bandas y take-rates (B2B) | `services/adminService.ts`, `routes/admin.ts`, UI `pages/AdminPortal.tsx` |
| US-06 | Validación TPV + liberación Escrow | `services/tpvService.ts`, `routes/tpv.ts`, UI `pages/TpvPage.tsx` |

### Reglas de negocio (REQ-002)
| RN | Regla | Implementación |
| --- | --- | --- |
| RN-01 | Exclusividad mutua (canje ⇎ reventa) | `shared/stateMachine.ts`, guardas en wallet/p2p services |
| RN-02 | Banda de precios (Price Collar) | `shared/pricing.ts` → `PRICE_COLLAR_VIOLATION` (422) |
| RN-03 | Split de comisiones | `shared/money.ts › computeCommission` (validado vs `.xlsx`) |
| RN-04 | Caducidad / breakage | `services/escrowService.ts › expireDueCoupons` |
| RN-05 | Límite de reventas/usuario/día | `p2pService` → `DAILY_RESALE_LIMIT_REACHED` (429) |
| RN-06 | Cierre de ventana antes del evento | `p2pService.publishOrder` → `P2P_WINDOW_CLOSED` |

### Máquina de estados
`EMITIDO → EN_WALLET ⇄ PUBLICADO_P2P → CANJEADO / VENCIDO` — `shared/stateMachine.ts`, enum `coupon_state` en el DDL.

### Tareas técnicas (Sprint Backlog)
| TASK | Implementación |
| --- | --- |
| TASK-001/002 Checkout + Escrow/PSP | `checkoutService.ts`, `routes/checkout.ts` (`/psp/pay` mock) |
| TASK-003 QR HMAC-SHA256 30s | `domain/qrToken.ts` |
| TASK-004 Endpoint P2P + Price Collar | `p2pService.publishOrder`, `routes/p2p.ts` |
| TASK-005 Lock anti race-condition | `infra/lockManager.ts` + transacción `SERIALIZABLE` |
| TASK-006 Matching FIFO + split + auditoría | `p2pService.buyOrder`, `escrowService.auditEscrow` |
| TASK-007 Middleware multi-tenant | `plugins/tenantResolver.ts` |
| TASK-008 TPV + webhook liberación | `tpvService.ts` |

### QA Checklist (`QA Checklist.xlsx`)
| QA | Verificación | Prueba |
| --- | --- | --- |
| QA-01 | Price Collar → HTTP 422 | `e2e/…/qa01-price-collar.spec.ts` + `backend/…/integration.test.ts` |
| QA-02 | Concurrencia: 1 ganador / N rechazos | `e2e/…/qa02-concurrency.spec.ts` (20 simultáneos) |
| QA-03 | Auditoría de balance = 0 | `e2e/…/qa03-escrow-audit.spec.ts` |
| QA-04 | Aislamiento multi-tenant | `e2e/…/qa04-tenant-isolation.spec.ts` |

### Arquitectura y datos (Fase 03)
- **C4 / microservicios (ARQ-001):** módulos desacoplados — Gateway/tenant resolver, Motor P2P (matching + Price Collar), Cupones/Wallet, Escrow/Pagos, Admin/TPV.
- **Modelo de datos (ARQ-002):** DDL exacto en `apps/backend/src/db/schema.sql` (`tenants`, `users`, `coupons`, `p2p_orders`, `escrow_ledgers` + enums).
- **Multitenancy (ARQ-003):** `plugins/tenantResolver.ts` (subdominio o `x-tenant-id`), filtrado por `tenant_id` en todos los repos.

### UX/UI (Fase 04)
- Flujos Consumidor vs Trader → páginas separadas; **Design Tokens White-Label** vía CSS variables (`TenantThemeProvider`); badges de estado, `PriceCollarSlider`, calculadora de comisiones en vivo (`FeeBreakdown`), QR rotativo con marca de agua anti-captura.

### Endpoints y errores (Protocolo)
Todos los endpoints del §3 y los códigos de error del §4 (`PRICE_COLLAR_VIOLATION` 422, `COUPON_NOT_IN_WALLET` 409, `P2P_ORDER_LOCKED` 423, `DAILY_RESALE_LIMIT_REACHED` 429, `QR_TOKEN_EXPIRED` 401, `TENANT_NOT_FOUND` 404) — `shared/errors.ts`, `plugins/errorHandler.ts`.

### Ítems adicionales cubiertos
| Consigna | Implementación |
| --- | --- |
| Notificaciones push/email por ejecución de órdenes (Visión, in-scope B2C) | `eventRepo.ts` (feed in-app + hook de entrega externa), campana en la UI (`NotificationBell.tsx`) |
| Historial de transacciones con filtros (UX §1 / Tarea 2.8) | `routes/activity.ts`, `pages/HistoryPage.tsx` |
| Analítica de canjes: tasa de conversión (Propuesta §6.2) | `escrowService.auditEscrow`, `pages/AuditPage.tsx` |
| Documentación Swagger/OpenAPI (Tarea 1.10) | `/api/docs` (`@fastify/swagger`) |
| Lector de QR por cámara en TPV (Rol 3, `html5-qrcode`) | `components/QrCameraReader.tsx` en `pages/TpvPage.tsx` |
| Prueba de 50 compras concurrentes (Tarea 1.9) | `integration.test.ts` + `qa02-concurrency.spec.ts` |

---

## 👥 Datos de demostración

Al arrancar se siembran 3 tenants (elegibles en la UI o vía header `x-tenant-id`):

| Tenant | Subdominio | Usuarios demo |
| --- | --- | --- |
| Ticketera Festival Live | `festival` | Ana, Beto, Caro |
| Escapadas Premium Hotels | `hotel` | Diego, Emma |
| Urban Fashion Drops | `sneakers` | Fabio, Gina |

La consola de arranque imprime los `userId` reales para pruebas por API.

---

## 🔌 Endpoints principales

```
GET  /api/v1/tenant/config
POST /api/v1/checkout/primary
GET  /api/v1/coupons/my-wallet?ownerId=...
GET  /api/v1/coupons/:id/qr-token
POST /api/v1/p2p/orders
GET  /api/v1/p2p/orders
POST /api/v1/p2p/orders/:id/buy
POST /api/v1/p2p/orders/:id/cancel
POST /api/v1/tpv/validate-qr
GET  /api/v1/escrow/audit/:tenant_id
POST /api/v1/escrow/webhook-release
PUT  /api/v1/admin/tenant/config
GET  /api/v1/notifications?userId=...      # centro de notificaciones
POST /api/v1/notifications/read
GET  /api/v1/transactions?userId=...&type= # historial con filtros
```
Todas requieren contexto de tenant (subdominio o cabecera `x-tenant-id`).

**Documentación interactiva (Swagger/OpenAPI):** `http://localhost:8080/api/docs`
