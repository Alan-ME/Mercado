---
doc_code: DOC-SMCTA-GOV-004
title: Registro Formal de Solicitudes de Cambio (CR-001 a CR-003)
subtitle: Control de Configuración y Trazabilidad de Pivotes Estructurales bajo Estándar IEEE 828 e ISO/IEC/IEEE 12207
phase: 06 — Gobernanza de Ingeniería y Blindaje Técnico Oficial
version: 2.2.0
date: Noviembre 2026
authors: Comité de Control de Cambios e Ingeniería — Proyecto SMCTA
institution: Gestión de Configuración y Auditoría de Alcance del Proyecto
---

## Resumen

En proyectos desarrollados por equipos distribuidos, los cambios de rumbo no documentados generan desalineación entre el código ejecutado y los artefactos de planificación iniciales, exponiendo a los integrantes a cuestionamientos sobre alcance, tecnología o criterios de aceptación. Este registro formaliza bajo estándar **IEEE 828** las tres solicitudes de cambio mayor (*Change Requests*) aprobadas en el ciclo de vida de **SMCTA**: el pivote fundacional del modelo económico-legal (`CR-001`), la unificación tecnológica de las maquetas visuales en React (`CR-002`) y la evolución del mercado secundario hacia **permuta P2P de productos, créditos de circuito cerrado e intercambiador de equivalencias con incentivo por descontinuación (`CR-003`)**.

---

## Tabla Resumen de Control de Cambios Aprobados

| Código CR | Denominación Oficial del Cambio | Severidad | Estado | Fecha Cierre | Referencia / Verificación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **CR-001** | Reingeniería de *Market Maker* Directo (v1) a Mercado P2P con *Escrow* Segregado (v2) | Crítica (Estructural) | **Implementado** | 2026-10-28 | `7218327`, `4641e78`, `9d9d8bf` |
| **CR-002** | Migración de Maquetas `BREW/DESK` desde Dart/Flutter (`vers/`) hacia React (`@smcta/web`) | Alta (Frontend / UX) | **Implementado** | 2026-11-05 | `9acebda`, `f4153fa`, `4766f27` |
| **CR-003** | Evolución a Trading P2P por Productos (Estilo Steam), Créditos Internos e *Item Changer* con Bonus por Descontinuación (Estilo KeyDrop) | Crítica (Modelo / Producto) | **Aprobado (v2.2)** | 2026-11-06 | `DOC-SMCTA-GOV-001` (`ADR-007`), `RN-07`, `RN-08`, `UC-05` |

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
   - Construcción de `Storefront.tsx` fiel a la maqueta *BREW/DESK* cuando el recinto activo es `cafeteria` (manteniendo intacta la adaptabilidad camaleónica *White-Label* para `festival`, `hotel` y `sneakers`).
   - Implementación de `CartaPage.tsx` (búsqueda instantánea + filtros por categoría), `ProductDetailModal.tsx` (curva SVG suavizada con selectores `24h / 7d / 30d` y estadísticas semanales), `CartDrawer.tsx` + `cart.tsx` (conectados directamente al checkout real con custodia *Escrow*) y `SettingsPage.tsx` (panel maestro-detalle completo de dos columnas para Cuenta, Seguridad, Privacidad, Apariencia y Recursos).
3. **Semilla Oficial de Base de Datos:** Registro automático del cuarto *Tenant* `cafeteria` (*BREW/DESK Specialty Coffee*, collar `70%–150%`, comisiones `2,5% / 1,5%`) en `apps/backend/src/db/seed.ts` y actualización de `dbIntegrity.test.ts`.

### 3. Verificación de Calidad Post-Cambio
- **Complejidad Ciclomática:** `npm run lint:complexity` aprobado con **0 errores** ($CC \le 5$ estricto en los nuevos componentes `SettingsPage.tsx`, `CartDrawer.tsx`, `ProductDetailModal.tsx`, `CartaPage.tsx` y `cart.tsx`).
- **Suite Automatizada:** `40/40` pruebas Vitest y `8/8` pruebas Playwright E2E aprobadas sin regresiones.

---

## CR-003: Evolución del Mercado P2P Monetario hacia Permuta de Productos (Estilo Steam), Créditos de Circuito Cerrado e Intercambiador por Descontinuación (Estilo KeyDrop)

### 1. Identificación y Motivación Regulatoria, Económica y Operativa
- **Origen del Cambio:** Revisión estratégica de producto e ingeniería sobre las fricciones operativas, impositivas y de liquidez del comercio secundario en gastronomía y retail (*BREW/DESK Specialty Coffee*).
- **Problemas Resueltos por este Giro:**
  1. **Eliminación de Liquidación Monetaria entre Particulares (Riesgo PSP / BCRA):** En un mercado P2P liquidado directamente en moneda fiduciaria entre usuarios, cada operación secundaria requiere mover dinero bancario de la cuenta del comprador a la del vendedor y retener comisiones en tránsito, encuadrando a la plataforma como Proveedor de Servicios de Pago (PSP) o sub-adquirente sujeto a KYC financiero, retenciones impositivas (SIRTAC/IIBB) y contracargos de tarjeta. Al transformar la negociación secundaria en **intercambio de productos respaldado por Créditos de Barra de Circuito Cerrado (`credits_balance`)**, el dinero fiduciario ingresa una única vez en la compra primaria al comercio y **jamás vuelve a retirarse hacia cuentas bancarias externas**.
  2. **Solución al Problema de Productos Descontinuados o Sin Stock sin Drenaje de Caja:** En el esquema anterior, si el comercio descontinuaba un producto de estación (ej. *Espresso Origen Colombia* o un combo temporal), la única salida limpia era reembolsar efectivo al cliente, provocando pérdida directa de caja y comisiones bancarias hundidas. Mediante la introducción del **Intercambiador de Equivalencias (*Item Changer* inspirado en KeyDrop Skin Changer)**, el usuario deposita su cupón descontinuado a la izquierda, recibe automáticamente un **Incentivo por Descontinuación** ($\beta_{\text{disc}}$, ej. `+15%` de bonificación sobre el valor nominal) y selecciona a la derecha cualquier combinación de productos activos equivalentes (ej. un alfajor o un *Mokaccino*), reteniendo la diferencia sobrante en su saldo de créditos internos.

### 2. Especificación Técnica y Matemática del Nuevo Modelo (v2.2)

1. **Trading P2P de Productos entre Usuarios (Inspirado en Steam Community Market / Trade Offers):**
   - El titular de un cupón vigente en `EN_WALLET` (ej. un *Combo de Empanadas* o *Sándwich + Latte* de valor nominal `$4,20`) publica su activo en el catálogo de intercambio especificando qué producto desea recibir a cambio (ej. un *Espresso Origen Colombia* de `$2,80`) y/o la compensación en **Créditos de Barra** requerida para equilibrar la operación.
   - Para evitar el bloqueo por falta de coincidencia exacta de precios entre productos de distinta categoría, el sistema incorpora el **Saldo de Créditos de Circuito Cerrado (`users.balance` / `credits_balance`)**, donde $1\text{ Crédito} \equiv 1,00\text{ USD/ARS}$ de poder de canje nominal dentro del mismo *Tenant*.
   - La validación de banda paramétrica (*Price Collar* $[\phi_{\min}, \phi_{\max}]$ en `@smcta/shared/src/pricing.ts`) se preserva íntegramente como **Banda de Equivalencia de Trueque**, garantizando que la valuación total solicitada (valor nominal del producto pedido + delta de créditos) permanezca dentro del rango autorizado por el comercio sobre el producto ofrecido:
     $$P_{\text{nom}}(\text{ofrecido}) \cdot \frac{\phi_{\min}}{100} \le P_{\text{nom}}(\text{solicitado}) + \Delta C \le P_{\text{nom}}(\text{ofrecido}) \cdot \frac{\phi_{\max}}{100}$$

2. **Intercambiador de Equivalencias (*Item Changer* Estilo KeyDrop) e Incentivo por Descontinuación:**
   - La interfaz de cambio presenta dos paneles simétricos conectados por una balanza central de equivalencia en créditos/ARS:
     - **Panel Izquierdo ("Tus artículos a intercambiar"):** Selección de uno o varios cupones de la billetera del usuario, más el uso opcional de sus créditos acumulados.
     - **Panel Derecho ("Objetos del catálogo a recibir"):** Grilla filtrable por categoría, rango de valor y disponibilidad con todos los productos activos del comercio.
   - **Regla de Valuación Diferencial (Activo Vigente vs. Producto Descontinuado):**
     - Si el usuario intercambia contra la barra un cupón de un producto **vigente** por simple cambio de preferencia del día, se aplica la tasa estándar de recambio del comercio ($\tau_{\text{swap}}$).
     - Si el comercio marcó el producto como **DESCONTINUADO (`is_discontinued = true`)**, el sistema bloquea su publicación en el P2P entre usuarios (protegiendo a terceros compradores) y habilita el rescate bonificado en el *Changer*, reconociendo al tenedor un poder de canje incrementado por el porcentaje de incentivo $\beta_{\text{disc}}$ (ej. $15\%$):
       $$V_{\text{reconocido}} = \text{round}_2\left(P_{\text{nom}} \cdot \left(1 + \frac{\beta_{\text{disc}}}{100}\right)\right)$$
   - **Acreditación del Vuelto en Créditos (`Credit Change`):** Si el usuario entrega un café descontinuado valuado con incentivo en $V_{\text{reconocido}} = 3,22\text{ créditos}$ y elige a la derecha un producto activo de $P_{\text{nuevo}} = 2,80\text{ créditos}$, el motor quema atómicamente el cupón descontinuado, emite el nuevo cupón en estado `EN_WALLET` (`token_version = 0`) y acredita la diferencia exacta $\Delta C = +0,42\text{ créditos}$ en el saldo del usuario dentro de la misma transacción `SERIALIZABLE`.

### 3. Análisis de Impacto sobre la Arquitectura Existente

| Componente / Documento | Impacto y Reutilización de Activos Existentes |
| :--- | :--- |
| **`@smcta/shared` (Dominio)** | Reutilización del 100% de `money.ts` (`ROUND_HALF_EVEN`), `pricing.ts` (`Price Collar`) y `stateMachine.ts`; adición de cálculo de equivalencia de trueque y bonificación por descontinuación. |
| **`@smcta/backend` (Core)** | Preservación de `LockManager`, `QrSecret`, `qrToken` (`token_version` rota en cada trueque de producto) y `escrow_ledgers` (`trg_escrow_ledgers_immutable`); extensión para permuta de productos y `Changer` de descontinuados. |
| **`@smcta/web` (UX / UI)** | Evolución de `Marketplace.tsx` incorporando el catálogo de trueque P2P por productos (estilo Steam) y la vista de doble panel *Item Changer* con filtros laterales (estilo KeyDrop). |
| **Blindaje Legal y Financiero** | Reducción a **cero** del riesgo de intermediación de pagos entre particulares (BCRA/UIF), al operar exclusivamente con derechos de consumo y créditos comerciales cerrados no retirables en efectivo. |
