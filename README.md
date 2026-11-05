# SMCTA P2P v2 — Sistema de Mercado Comportamental y Trading de Activos

Este repositorio unifica en la raíz el monorepo ejecutable de **SMCTA v2 (White-Label)** junto con toda la documentación formal de ingeniería de las cinco fases académicas dentro de `Proyecto - SMCTA/`. Cubre de punta a punta las historias `US-01`..`US-06`, las reglas de negocio `RN-01`..`RN-06`, el backlog técnico `TASK-001`..`TASK-008` y los cuatro escenarios obligatorios del `QA Checklist.xlsx`.

---

## Cómo levantar el proyecto rápido (VS Code con F5 o consola)

No hace falta tener Docker, PostgreSQL ni Redis corriendo en tu máquina para probar o corregir la entrega.. por defecto el sistema levanta sobre **PGlite** (motor PostgreSQL real compilado a WASM corriendo el DDL íntegro con aislamiento `SERIALIZABLE`) y un gestor de locks en memoria con validación de propietario y limpieza por TTL.

1. Abrí la raíz de este repositorio en Visual Studio Code y corré una sola vez en la terminal:
   ```bash
   npm install
   ```
2. Tocá **F5** eligiendo **SMCTA · App completa (F5)** en el panel *Run and Debug*. Eso compila `@smcta/shared` y el frontend, levanta el backend bajo el debugger y te abre `http://localhost:8080` listo para usar.

Si preferís manejarlo por terminal tenés todos los comandos en la raíz:

```bash
npm run dev             # Backend (:8080) + Vite con hot-reload (:5173)
npm start               # Compila todo y sirve API + SPA desde :8080
npm run lint:complexity # Verifica complejidad ciclomática estricta (CC <= 5 por función)
npm test                # Suite unitaria y de integración con Vitest
npm run test:coverage   # Cobertura v8 (>= 80%) + reporte LCOV para SonarCloud
npm run test:e2e        # Suite E2E con Playwright validando QA-01..QA-04
npm run docs:pdf        # Compila los 22 documentos desde Documentos MD/ hacia Documentos PDF/
docker compose up --build # Despliegue completo con PostgreSQL 15 + Redis 7 + App
```

---

## Estructura unificada del repositorio

Sacamos del medio los microservicios duplicados que habían quedado a mitad de camino y dejamos una única fuente de verdad compilable en la raíz, conservando intactos los entregables documentales de cátedra:

```text
.
├─ packages/shared/       Contratos compartidos (DTOs, errores tipados), aritmética decimal
│                         exacta (RN-03), bandas de Price Collar (RN-02) y máquina de estados.
├─ apps/backend/          Fastify + PostgreSQL (PGlite / pg) + locks (memoria / Redis Lua) +
│                         canal SSE en tiempo real, validación QR HMAC con tokenVersion y TPV.
├─ apps/web/              SPA React + Vite + Tailwind con tematización White-Label en vivo,
│                         Tienda, Billetera con QR rotativo, Mercado P2P, Historial, Admin y TPV.
├─ e2e/                   Pruebas de extremo a extremo en Playwright (QA-01..QA-04).
├─ scripts/               Compilador tipográfico y motor de gráficos vectoriales SVG (docs:pdf).
└─ Proyecto - SMCTA/      Documentación oficial separada por formato (Fases 01 a 06):
   ├─ Documentos MD/      Fuentes editables en Markdown de arquitectura, requisitos y gobernanza.
   ├─ Documentos PDF/     Los 22 entregables compilados en PDF A4 académico listos para imprenta.
   └─ Planillas XLSX/     Matrices financieras, backlog, roadmap y QA Checklist en Excel.
```

Para pasar del modo embebido a PostgreSQL 15 y Redis 7 en red no hay que tocar ni una línea de dominio: alcanza con definir `DATABASE_URL` y `REDIS_URL` (fijate `.env.example` o `docker-compose.yml`).

---

## Decisiones de arquitectura, concurrencia y seguridad aplicadas

La lógica de custodia y reventa secundaria tiene varias trampas clásicas donde un prototipo común hace agua bajo carga, así que blindamos los puntos calientes directamente en base de datos e infraestructura:

- **Libro mayor append-only real (`escrow_ledgers`):** además de eliminar cualquier `DROP TABLE` destructivo del arranque, la tabla tiene índices únicos parciales (`uq_ledger_checkout_once` y `uq_ledger_terminal_once`) y un trigger en PostgreSQL (`trg_escrow_ledgers_immutable`) que aborta con `SQLSTATE 28000` cualquier intento de `UPDATE` o `DELETE`.
- **Concurrencia sin carreras ni deadlocks:** tanto en `pg` (con `SET LOCAL lock_timeout = '2s'`, `statement_timeout = '5s'` y backoff exponencial con jitter ante `40001`) como en `PGlite` (serializando transacciones en la conexión única WASM), el matching P2P, la cuota diaria de reventas (`RN-05`) y el webhook de liberación del PSP corren adentro de `withLock` + `SERIALIZABLE`. Los locks distribuidos en Redis liberan únicamente mediante script Lua comparando el `ownerToken` de quien adquirió el candado.
- **Anti-replay de QR y defensa de secretos:** el secreto HMAC de cada tenant viaja encapsulado en el Value Object opaco `QrSecret` (que redacta automáticamente en `toString`, `toJSON` y `util.inspect` para no regalar llaves en logs), y cada reventa incrementa `token_version` dentro del payload firmado. Si A le vende un cupón a B y B se lo revende a A en menos de 30 segundos, el QR viejo de A rebota igual.
- **Contabilidad neta al centavo:** en cada split P2P se registra el ingreso neto real del comercio (`tenantNetFees = totalFees - platformShare`) separado del fee de SMCTA Core, cerrando la conciliación de custodia con diferencia `0.00`.
- **Tiempo real por SSE sin polling basura:** el centro de notificaciones (`NotificationBell.tsx`) dejó de pegarle a la base cada 20 segundos con `setInterval` y ahora escucha `GET /api/v1/notifications/stream` vía `EventSource`, empujando eventos recién después del `COMMIT` para no filtrar notificaciones fantasma si una transacción reintenta.

---

## Trazabilidad rápida contra la consigna

| Código | Requisito | Dónde vive |
| --- | --- | --- |
| `US-01` | Checkout primario y custodia Escrow | `apps/backend/src/services/checkoutService.ts`, `apps/web/src/pages/Storefront.tsx` |
| `US-02` | QR dinámico HMAC rotativo cada 30s | `apps/backend/src/domain/qrToken.ts`, `apps/backend/src/services/walletService.ts`, `apps/web/src/components/QrCanje.tsx` |
| `US-03` | Publicación P2P con Price Collar | `apps/backend/src/services/p2pService.ts`, `apps/web/src/components/PriceCollarSlider.tsx` |
| `US-04` | Compra secundaria atómica y split | `apps/backend/src/services/p2pService.ts`, `apps/web/src/pages/Marketplace.tsx` |
| `US-05` | Configuración B2B y marca White-Label | `apps/backend/src/services/adminService.ts`, `apps/web/src/pages/AdminPortal.tsx` |
| `US-06` | Lectura TPV y liberación al comercio | `apps/backend/src/services/tpvService.ts`, `apps/web/src/pages/TpvPage.tsx` |
| `RN-01..06` | Exclusividad, bandas, take-rates, caducidad, tope diario y ventana horaria | `packages/shared/src/`, `apps/backend/src/services/` |
| `QA-01..04` | Banda 422, 50 compras simultáneas, auditoría en 0 y aislamiento multi-tenant | `e2e/tests/`, `apps/backend/src/tests/` |

---

## Tenants precargados y endpoints principales

Al iniciar sobre una base vacía se siembran cuatro comercios aislados para probar directo desde la interfaz o pasando la cabecera `x-tenant-subdomain`: `cafeteria` (*BREW/DESK Specialty Coffee*, vista por defecto), `festival` (Ana, Beto, Caro), `hotel` (Diego, Emma) y `sneakers` (Fabio, Gina). La documentación interactiva OpenAPI queda expuesta en `http://localhost:8080/api/docs`.

```text
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
POST /api/v1/escrow/expire
PUT  /api/v1/admin/tenant/config
GET  /api/v1/notifications?userId=...
GET  /api/v1/notifications/stream?userId=...&tenant=...
POST /api/v1/notifications/read
GET  /api/v1/transactions?userId=...&type=...
```
