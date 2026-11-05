---
doc_code: DOC-SMCTA-GOV-004
title: Registro Formal de Solicitudes de Cambio (CR-001 y CR-002)
subtitle: Control de Configuración y Trazabilidad de Pivotes Estructurales bajo Estándar IEEE 828 e ISO/IEC/IEEE 12207
phase: 06 — Gobernanza de Ingeniería y Blindaje Técnico Oficial
version: 2.1.0
date: Noviembre 2026
authors: Comité de Control de Cambios e Ingeniería — Proyecto SMCTA
institution: Gestión de Configuración y Auditoría de Alcance del Proyecto
---

## Resumen

En proyectos desarrollados por equipos distribuidos, los cambios de rumbo no documentados generan desalineación entre el código ejecutado y los artefactos de planificación iniciales, exponiendo a los integrantes a cuestionamientos sobre alcance, tecnología o criterios de aceptación. Este registro formaliza bajo estándar **IEEE 828** las dos solicitudes de cambio mayor (*Change Requests*) aprobadas e implementadas en el ciclo de vida de **SMCTA**: el pivote fundacional del modelo económico-legal (`CR-001`) y la unificación tecnológica de las maquetas visuales en React (`CR-002`).

---

## Tabla Resumen de Control de Cambios Aprobados

| Código CR | Denominación Oficial del Cambio | Severidad | Estado | Fecha Cierre | Commits de Verificación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **CR-001** | Reingeniería de *Market Maker* Directo (v1) a Mercado P2P con *Escrow* Segregado (v2) | Crítica (Estructural) | **Implementado** | 2026-10-28 | `7218327`, `4641e78`, `9d9d8bf` |
| **CR-002** | Migración de Maquetas `BREW/DESK` desde Dart/Flutter (`vers/`) hacia React (`@smcta/web`) | Alta (Frontend / UX) | **Implementado** | 2026-11-05 | `9acebda`, `f4153fa`, `4766f27` |

---

## CR-001: Reingeniería del Modelo Económico y Transaccional (v1 Market Maker a v2 P2P Escrow)

### 1. Identificación y Motivación Técnica-Regulatoria
- **Origen del Cambio:** Auditoría interna de riesgos financieros, legales y de seguridad operativa documentada en `01_Matriz_de_Riesgos_y_Mitigacion_Legal_Financiera.md`.
- **Defecto en Línea Base Anterior (v1):** El modelo original asumía que la plataforma recompraría cupones contra su propia liquidez a precios variables y validaría consumos con códigos QR estáticos. Ello generaba: (a) insolvencia matemática ante eventos cancelados o retiros masivos simultáneos, (b) exposición penal/administrativa por intermediación financiera no autorizada y (c) vulnerabilidad trivial ante capturas de pantalla duplicadas.

### 2. Especificación Técnica del Cambio Aplicado
1. **Sustitución del Motor de Liquidez:** Eliminación total de tesorería compradora propia; incorporación de la tabla `p2p_orders` para intercambio exclusivo entre usuarios pares.
2. **Introducción de Bandas Paramétricas (*Price Collar*):** Restricción obligatoria $[\phi_{\min}, \phi_{\max}]$ por *Tenant* validada en `@smcta/shared/src/pricing.ts` (`422 PRICE_COLLAR_VIOLATION`).
3. **Contabilidad de Custodia Segregada (*Escrow*):** Creación del libro mayor `escrow_ledgers` protegido por el disparador `trg_escrow_ledgers_immutable` (`SQLSTATE 28000`), reteniendo exactamente el 100% de `nominalPrice` hasta redención en TPV (`REDEEM_RELEASE`) o vencimiento (`REFUND`).
4. **Criptografía Dinámica de Puerta:** Sustitución de códigos fijos por tokens rotativos de 30 segundos firmados con `HMAC-SHA256` por *Tenant* y versionados con `token_version`.

### 3. Análisis de Impacto por Rol del Equipo

| Dimensión / Rol | Impacto Técnico y Entregables Actualizados |
| :--- | :--- |
| **Rol 1 (Backend Core)** | Implementación de `checkoutService`, `p2pService`, `escrowService`, `tpvService`, `LockManager` (Redis Lua / Memoria) y aislamiento `SERIALIZABLE`. |
| **Rol 2 (Frontend UX)** | Separación clara entre Tienda Primaria, Billetera con QR vivo rotativo y Libro de Órdenes P2P con control deslizante acotado al *Price Collar*. |
| **Rol 3 (Gateway / QA)** | Resolución multi-tenant por cabecera/subdominio (`tenantResolver`), consola de conciliación contable B2B y suite Playwright `QA-01..QA-04`. |
| **Presupuesto / Riesgo** | Reducción del capital de riesgo operativo requerido en caja propia a **$0,00**; eliminación de contingencia regulatoria bursátil. |

---

## CR-002: Unificación de Frontend y Migración de Maquetas `BREW/DESK` (Dart/Flutter a React)

### 1. Identificación y Motivación de Ingeniería
- **Origen del Cambio:** Revisión de alineación visual entre las maquetas de diseño creadas en `vers/` (prototipo en Dart/Flutter para el vertical de cafetería *BREW/DESK Specialty Coffee*) y la SPA productiva multi-tenant en `apps/web` (React 19 + TypeScript).
- **Problema Detectado:** Coexistían en el repositorio dos implementaciones desconectadas: en `vers/` residían las pantallas con la identidad visual exacta acordada por diseño (portada oscura de barra con promociones cromáticas, modal de producto con gráfico temporal de precios, vista completa de carta y pantalla de ajustes de doble columna estilo maestro-detalle), pero codificadas en Dart sin integración con el backend ni con el motor P2P; mientras que `apps/web` poseía toda la integración transaccional real pero utilizaba tarjetas genéricas que no reflejaban la maqueta aprobada para cafetería.

### 2. Especificación Técnica del Cambio Aplicado
1. **Preservación Histórica sin Deuda de Compilación (`f4153fa`):** El directorio `vers/` quedó archivado explícitamente como respaldo documental de diseño original (maquetas en `vers/diseños/` y código Dart de referencia), fuera del *pipeline* productivo de *NPM Workspaces*.
2. **Portabilidad Fiel de Vistas y Activos a `@smcta/web` (`9acebda`, `4766f27`):**
   - Incorporación de activos gráficos optimizados en `apps/web/public/images/carta/` y modelado tipado del menú en `apps/web/src/data/coffeeCatalog.ts`.
   - Construcción de `Storefront.tsx` fiel a la maqueta *BREW/DESK* cuando el recinto activo es `cafeteria` (manteniendo intacta la adaptabilidad camaleónica *White-Label* para `festival`, `hotel` y `cafe`).
   - Implementación de `CartaPage.tsx` (búsqueda instantánea + filtros por categoría), `ProductDetailModal.tsx` (curva SVG suavizada con selectores `24h / 7d / 30d` y estadísticas semanales), `CartDrawer.tsx` + `cart.tsx` (conectados directamente al checkout real con custodia *Escrow*) y `SettingsPage.tsx` (panel maestro-detalle completo de dos columnas para Cuenta, Seguridad, Privacidad, Apariencia y Recursos).
3. **Semilla Oficial de Base de Datos:** Registro automático del cuarto *Tenant* `cafeteria` (*BREW/DESK Specialty Coffee*, collar `70%–135%`, comisiones `2,0% / 1,5%`) en `apps/backend/src/db/seed.ts` y actualización de `dbIntegrity.test.ts`.

### 3. Verificación de Calidad Post-Cambio
- **Complejidad Ciclomática:** `npm run lint:complexity` aprobado con **0 errores** ($CC \le 5$ estricto en los nuevos componentes `SettingsPage.tsx`, `CartDrawer.tsx`, `ProductDetailModal.tsx`, `CartaPage.tsx` y `cart.tsx`).
- **Suite Automatizada:** `40/40` pruebas Vitest y `8/8` pruebas Playwright E2E aprobadas sin regresiones.
