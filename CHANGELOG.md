# Changelog — Proyecto SMCTA

Todos los cambios relevantes de arquitectura, lógica de dominio, interfaz *White-Label* y documentación normativa de **SMCTA (Sistema de Mercado Comportamental y Trading de Activos)** se registran en este archivo siguiendo el estándar [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning 2.0.0](https://semver.org/lang/es/).

---

## [2.1.0] — 2026-11-05

### Added
- **Gobernanza Técnica y Suite Documental Académica (`Proyecto - SMCTA/Documentos MD/06_Gobernanza_Ingenieria_y_Blindaje_Tecnico/` y `Documentos PDF/`):** Incorporación de monografía de investigación arquitectónica, catálogo oficial `ADR-001..ADR-006`, glosario maestro de lenguaje ubicuo y blindaje legal B2C, casos de uso *Fully Dressed* (`UC-01..UC-04`), registro formal de cambios (`CR-001`, `CR-002`), estudio comparativo del estado del arte y bitácora forense de ingeniería, compilados en formato PDF académico minimalista.
- **Migración Integral `BREW/DESK Specialty Coffee` en React (`@smcta/web`):** Portabilidad completa de las maquetas originales de Dart/Flutter (`vers/diseños/`) al cliente web multi-tenant: catálogo especializado (`coffeeCatalog.ts`), carrito lateral (`CartDrawer.tsx`), ficha interactiva con curva temporal (`ProductDetailModal.tsx`), vista completa de carta (`CartaPage.tsx`) y panel maestro-detalle de ajustes (`SettingsPage.tsx`) (`9acebda`, `f4153fa`, `4766f27`).
- **Cuarto Tenant Oficial (`cafeteria`):** Alta idempotente de `BREW/DESK Specialty Coffee` en `apps/backend/src/db/seed.ts` como experiencia predeterminada de demostración comercial.

### Changed
- **Sincronización del Modelo de Datos Oficial (`DOC-SMCTA-ARQ-002`):** Actualización de `02_Diseno_de_Modelo_de_Datos_y_Entidades.md` para reflejar fielmente las 6 tablas productivas (`tenants`, `users`, `coupons`, `p2p_orders`, `escrow_ledgers`, `user_events`), índices únicos parciales y disparador de inmutabilidad `trg_escrow_ledgers_immutable`.
- **Renovación Estética y Separación Estructural de Documentación (Fases 01–06):** Eliminación de exportaciones HTML y archivos comprimidos obsoletos; organización limpia de `Proyecto - SMCTA/` en `Documentos MD/`, `Documentos PDF/` y `Planillas XLSX/`, con compilación directa de los 22 documentos bajo diseño académico minimalista (A4, márgenes $\ge 2\text{ cm}$, tipografía `Inter` + `JetBrains Mono`, acento único índigo `#4F46E5` y gráficos vectoriales SVG generados con métricas reales del repositorio).

---

## [2.0.0] — 2026-10-28

### Added
- **Monorepo Unificado en TypeScript Estricto (`7218327`, `ae7f0f4`):** Consolidación en workspaces locales `@smcta/shared`, `@smcta/backend`, `@smcta/web` y `@smcta/e2e` bajo Node.js 20+.
- **Aritmética Financiera Exacta y Motor Price Collar (`@smcta/shared`):** Implementación de `money.ts` (`decimal.js` con redondeo bancario `ROUND_HALF_EVEN`), `pricing.ts` (`validatePriceCollar`, `calculateCommissionBreakdown` con `platformShare`) y autómata determinista `stateMachine.ts`.
- **Canal Reactivo en Tiempo Real (`0b1f251`):** Sustitución de *polling* HTTP por `EventHub` con *Server-Sent Events* (`/api/v1/notifications/stream`), despacho estricto post-`COMMIT` y reconciliación contra `user_events`.
- **Pipeline Determinista de Calidad (`c12228b`):** Regla obligatoria ESLint `complexity <= 5` (`0` violaciones sobre 593 funciones), cobertura `v8 >= 80%` (`92.54%` sentencias reales), configuración SonarCloud y suite Playwright E2E (`QA-01..QA-04`).

### Fixed
- **Persistencia Idempotente e Inmutabilidad Append-Only (`4641e78`):** Eliminación de `DROP TABLE CASCADE` al arranque; creación de trigger PL/pgSQL `trg_escrow_ledgers_immutable` (`SQLSTATE 28000`), índices parciales anti-doble gasto y serialización transaccional `mutexChain` en `PGliteDatabase`.
- **Bloqueos Distribuidos Seguros por Propietario (`fad5b10`):** Liberación atómica en Redis mediante script Lua verificando token `owner` único y política de desalojo TTL en memoria.
- **Integridad Contable y Anti-Boomerang QR (`9d9d8bf`):** Corrección de doble resta de `platformShare` en `tenantNetFees`, introducción de `token_version` monótono en tokens `HMAC-SHA256` rotativos (30 s), encapsulamiento opaco `QrSecret` e inyección de reloj `Clock` determinista.

---

## [1.0.0-draft] — 2026-09-15 (Deprecado por `CR-001`)

### Removed
- **Modelo Conceptual v1 (*Market Maker* con Recompra Directa):** Descartado en Fase 01 antes de paso a producción tras auditoría de riesgos financieros y regulatorios (exposición a corridas de liquidez sobre caja propia, recategorización como derivado financiero ante CNV/BCRA e incentivos de fraude por capturas estáticas de QR). Reemplazado íntegramente por la arquitectura v2 P2P con custodia *Escrow* segregada.
