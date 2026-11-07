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

## CR-003: Evolución hacia Trading P2P Libre de Productos (Estilo Steam), Item Changer de Descontinuados y Gold Area de Créditos Desbloqueables al Canje en TPV (Estilo KeyDrop)

### 1. Identificación y Motivación Regulatoria, Económica y Anti-Fraude
- **Origen del Cambio:** Redefinición estratégica del modelo de intercambio secundario para eliminar de raíz las fricciones bancarias/regulatorias del comercio por dinero y gamificar la rotación real de productos en el local (*BREW/DESK Specialty Coffee* y comercios adheridos).
- **Problemas Resueltos por este Giro:**
  1. **Eliminación Total de Dinero en el P2P entre Usuarios (Trueque Libre Producto por Producto):** En lugar de vender cupones por dinero fiduciario entre particulares (lo que exigía pasarelas PSP con *split* bancario, KYC y riesgo regulatorio BCRA/UIF), el mercado P2P pasa a ser **intercambio libre de Producto por Producto** (ej. un usuario que tiene un *Café* de `$10,00` y hoy desea una *Empanada* de `$1,00` o un *Alfajor* lo cataloga en el tablero; otro usuario que posee la *Empanada* acepta y ambos cupones permutan su titularidad mano a mano). Como ambos productos ya fueron abonados en la tienda primaria, la contabilidad de custodia del comercio permanece 100% intacta sin mover un centavo bancario.
  2. **Solución al Problema de Productos Descontinuados mediante el *Item Changer* (Estilo KeyDrop Skin Changer):** Si el comercio retira o descontinúa un producto de su carta (`is_discontinued = true`), en vez de forzar un reembolso bancario que drena la caja del local, el usuario deposita su cupón descontinuado en el panel izquierdo del **Item Changer**, elige en el panel derecho un producto equivalente activo (ej. un alfajor o un *Mokaccino*) y recibe automáticamente un **Incentivo de Compensación en Créditos Gold** (más cualquier diferencia de valor a su favor convertida en créditos).
  3. **Sistema de Créditos Gold con Desbloqueo Diferido al Canje en TPV (*Proof-of-Consumption*) y *Gold Area*:** Para incentivar a los usuarios a intercambiar en el P2P (incluso entregando un producto de mayor valor nominal por otro de menor valor que desean consumir en el momento), cada trade P2P otorga **Créditos Gold**. Sin embargo, para **impedir el farmeo infinito entre cuentas cómplices (*wash-trading*)**, dichos créditos quedan en estado **Pendiente (`pending_credits`)** y **SOLO se desbloquean cuando el otro usuario canjea físicamente en el TPV del local el cupón que recibió en el trade**. Una vez desbloqueados, los créditos se utilizan en la **Gold Area** (inspirada en KeyDrop Gold Area / Puntos de Steam) para canjear combos y promociones exclusivas.

### 2. Especificación Técnica y Reglas Invariantes del Nuevo Modelo (v2.2)

1. **Pilar 1 — Trading P2P Libre de Producto por Producto entre Usuarios (Estilo Steam Trade Offers):**
   - El titular de un cupón vigente en `EN_WALLET` publica su oferta en el tablero P2P indicando qué producto tiene (`offeredProduct`) y qué producto del catálogo busca recibir a cambio (`requestedProduct`).
   - El comercio es libre entre usuarios: no se exige igualdad de precios nominales ni pago de dinero o créditos entre las partes para perfeccionar el trueque.
   - Al aceptar la oferta otro usuario que posee un cupón `EN_WALLET` del producto buscado, el backend ejecuta dentro de una transacción `SERIALIZABLE` el cruce atómico de propietarios (`owner_id` de ambos cupones se intercambia) e incrementa `token_version + 1` en ambos activos para invalidar cualquier captura previa de QR.

2. **Pilar 2 — Recompensa de Créditos Gold Diferida al Canje Físico en TPV (Anti-Farmeo):**
   - Al concretarse un trueque P2P entre dos productos distintos (`offeredProduct != requestedProduct`), el sistema calcula la recompensa de **Créditos Gold** proporcional al valor del cupón intercambiado ($R_{\text{trade}} = \text{round}_0(P_{\text{nom}} \cdot \kappa_{\text{gold}})$) y la registra como **pendiente de desbloqueo** vinculada al cupón transferido (`pending_reward_credits`, `reward_recipient_id`).
   - **Condición Inquebrantable de Desbloqueo (`RN-07`):** Los créditos **NO** se acreditan como disponibles al momento del trade web. Recién cuando el nuevo tenedor presenta el QR en la barra y `tpvService.validateAndRedeem` transiciona el cupón al estado terminal `CANJEADO`, la misma transacción `SERIALIZABLE` transfiere `pending_reward_credits` hacia el saldo disponible `credits_balance` del usuario que entregó el cupón y marca `reward_claimed = true`.
   - **Candados Anti-Abuso:** (a) Cada cupón físico puede desbloquear recompensa de trade **una única vez en toda su vida útil** (`reward_claimed`), por lo que pasarse el mismo cupón 20 veces entre dos amigos antes de ir a la barra no multiplica los créditos; (b) intercambiar dos cupones del mismo producto (`Café` por `Café`) devenga `0` créditos.

3. **Pilar 3 — *Item Changer* para Productos Descontinuados y *Gold Area* para Canje de Combos (Estilo KeyDrop):**
   - **Item Changer (Doble Columna):** Cuando el comercio marca un producto como `DISCONTINUED`, el sistema bloquea su publicación en el P2P entre usuarios y habilita su ingreso en el *Item Changer*. El usuario coloca su cupón descontinuado a la izquierda, el panel central le reconoce su valor más el **Incentivo por Descontinuación ($\beta_{\text{disc}}$, ej. $+15\%$)**, selecciona a la derecha su producto equivalente activo (ej. un alfajor) y recibe al instante el nuevo cupón junto con los **Créditos Gold de incentivo y remanente** directamente desbloqueados en su cuenta:
     $$C_{\text{incentivo}} = \text{round}_0\left(\left(P_{\text{nom}}(\text{descontinuado}) \cdot \left(1 + \frac{\beta_{\text{disc}}}{100}\right) - P_{\text{nom}}(\text{equivalente})\right) \cdot \kappa_{\text{gold}}\right) + B_{\text{fijo}}$$
   - **Gold Area (Catálogo de Combos y Promos por Créditos):** Los usuarios utilizan sus Créditos Gold disponibles (`credits_balance`, expresados en unidades `G` / Créditos, ej. `480 G`, `680 G`, `1200 G` como en KeyDrop Gold Area) para desbloquear **Combos Especiales y Promociones de Barra**, emitiéndose un cupón `EN_WALLET` listo para consumir.

### 3. Análisis de Impacto sobre la Arquitectura Existente

| Componente / Documento | Impacto y Reutilización de Activos Existentes |
| :--- | :--- |
| **`@smcta/shared` (Dominio)** | Reutilización íntegra de `money.ts`, `stateMachine.ts` y DTOs; adición de contratos para trueque P2P de productos, cálculo de `pendingCredits`, rescate en *Item Changer* y catálogo de *Gold Area*. |
| **`@smcta/backend` (Core)** | `p2pService` ejecuta el *swap* atómico de dos cupones y registra `pending_reward_credits`; `tpvService` desbloquea los créditos al escanear el QR en barra (`CANJEADO`); nuevo servicio para *Item Changer* y *Gold Area*. |
| **`@smcta/web` (UX / UI)** | Tres vistas integradas: (1) **Trueque P2P de Productos** estilo Steam, (2) **Item Changer** de dos paneles con filtros laterales para productos retirados estilo KeyDrop y (3) **Gold Area** de tarjetas de combos canjeables con Créditos Gold. |
| **Blindaje Legal, Contable y Anti-Abuso** | **Cero** dinero moviéndose entre usuarios; **cero** drenaje de efectivo por bajas de stock; **cero** farmeo artificial gracias al bloqueo de créditos hasta el canje físico en TPV. |
