---
doc_code: DOC-SMCTA-GOV-002
title: Glosario Maestro de Lenguaje Ubicuo, Fórmulas Financieras y Blindaje Legal
subtitle: Léxico Canónico bajo Domain-Driven Design (DDD) e ISO/IEC 2382 para Código, Contratos API e Interfaz B2C
phase: 06 — Gobernanza de Ingeniería y Blindaje Técnico Oficial
version: 2.1.0
date: Noviembre 2026
authors: Equipo de Ingeniería y Cumplimiento Normativo — Proyecto SMCTA
institution: Gobernanza Semántica y Prevención de Riesgo Regulatorio
---

## Resumen

En sistemas transaccionales desarrollados en paralelo por múltiples integrantes, la ambigüedad terminológica se traduce directamente en defectos de cálculo contable (por ejemplo, confundir comisión bruta con ingreso neto del comercio) y en contingencias legales severas (emplear terminología bursátil reservada a mercados de valores regulados dentro de una interfaz de consumo masivo). Este documento define de manera taxativa el **Lenguaje Ubicuo (*Ubiquitous Language*)** de **SMCTA v2**, vinculando cada concepto de negocio con su identificador exacto en TypeScript/SQL, su invariante algebraico y su vocabulario obligatorio en pantallas públicas.

---

## 1. Entidades y Actores del Dominio Multi-Tenant

| Término Canónico | Identificador en Código / SQL | Definición Formal e Invariante Semántico |
| :--- | :--- | :--- |
| **Tenant (Comercio Emisor B2B)** | `TenantConfigDTO` / `tenants` | Persona jurídica u organizador comercial (festival, cadena hotelera, cafetería de especialidad) que contrata la plataforma bajo marca blanca para emitir derechos de consumo propios y parametrizar su mercado secundario. |
| **Cupón / Derecho de Consumo** | `CouponDTO` / `coupons` | Activo digital nominativo que acredita el pago anticipado de un bien o servicio físico específico dentro de un único *Tenant*, con fecha de caducidad cierta (`expiration_date`). **No constituye moneda, acción ni título valor.** |
| **Consumidor Primario** | `currentOwnerId` (en `CHECKOUT`) | Usuario final que adquiere el cupón directamente del comercio emisor al precio nominal $P_{\text{nom}}$, originando el fondeo inicial de la cuenta de custodia. |
| **Vendedor Secundario (*Maker*)** | `sellerId` / `seller_id` | Titular legítimo de un cupón en estado `EN_WALLET` que publica una oferta de cesión onerosa en el libro de órdenes P2P del mismo *Tenant*. |
| **Comprador Secundario (*Taker*)** | `buyerId` / `buyer_id` | Usuario distinto del vendedor (`buyerId != sellerId`) que ejecuta la aceptación inmediata de una orden abierta `OPEN` pagando el precio total comprador. |
| **Terminal Punto de Venta (TPV)** | `/api/v1/tpv/validate-qr` | Dispositivo físico o interfaz operativa en puerta/barra del comercio encargada de escanear el QR rotativo, verificar su validez criptográfica y disparar la liberación del principal en custodia. |

---

## 2. Magnitudes Monetarias y Fórmulas Contables Inmutables

Todas las magnitudes monetarias se expresan con dos decimales exactos bajo redondeo bancario al par (`Decimal.ROUND_HALF_EVEN`). Queda prohibido alterar las definiciones siguientes en cualquier módulo del sistema:

| Concepto Financiero | Símbolo / Propiedad DTO | Definición Matemática Exacta | Regla de Contabilización |
| :--- | :--- | :--- | :--- |
| **Precio Nominal** | $P_{\text{nom}}$ / `nominalPrice` | Valor facial abonado en la emisión primaria del cupón ($P_{\text{nom}} > 0$). | Determina de forma invariable el monto retenido y liberado en `escrow_ledgers` (`CHECKOUT` y `REDEEM_RELEASE`). |
| **Precio de Oferta (*Asking Price*)** | $P_{\text{ask}}$ / `askingPrice` | Precio base propuesto por el vendedor en el mercado secundario P2P. | Debe cumplir $P_{\text{nom}} \cdot \frac{\phi_{\min}}{100} \le P_{\text{ask}} \le P_{\text{nom}} \cdot \frac{\phi_{\max}}{100}$. No modifica el capital en custodia. |
| **Banda de Precios (*Price Collar*)** | $[\phi_{\min}, \phi_{\max}]$ / `priceFloorPct`, `priceCeilingPct` | Límites porcentuales inferior y superior fijados por el *Tenant* sobre $P_{\text{nom}}$. | Previene tanto la reventa especulativa desmedida (*scalping*) como la erosión predatoria de precios en puerta. |
| **Comisión Vendedor (*Seller Take-Rate*)** | $\tau_s$ / `sellerFeeAmount` | $\text{round}_2\left(P_{\text{ask}} \cdot \frac{\tau_s}{100}\right)$ | Se deduce del `askingPrice` antes de acreditar el producido al vendedor secundario. |
| **Producido Neto Vendedor** | `netSellerProceeds` | $P_{\text{ask}} - \text{sellerFeeAmount}$ | Importe líquido percibido por el usuario que transfiere la titularidad del cupón. |
| **Cargo Comprador (*Buyer Take-Rate*)** | $\tau_b$ / `buyerFeeAmount` | $\text{round}_2\left(P_{\text{ask}} \cdot \frac{\tau_b}{100}\right)$ | Se adiciona sobre el `askingPrice` conformando el desembolso total del comprador secundario. |
| **Precio Total Comprador** | `totalBuyerPrice` | $P_{\text{ask}} + \text{buyerFeeAmount}$ | Monto efectivamente debitado al comprador en la liquidación atómica P2P. |
| **Comisión Bruta Secundaria** | `grossFee` | $\text{sellerFeeAmount} + \text{buyerFeeAmount}$ | Masa total de comisiones generada por una transacción de mercado secundario. |
| **Participación Plataforma (*Platform Share*)** | `platformShare` / `platform_fee` | $\text{round}_2\left(\text{grossFee} \cdot \frac{\sigma_{\text{plat}}}{100}\right)$ | Ingreso devengado por el operador tecnológico SaaS SMCTA sobre cada reventa. |
| **Comisión Neta del Comercio** | `tenantNetFee` / `tenant_fee_accumulated` | $\text{grossFee} - \text{platformShare}$ | Regalía secundaria neta acumulada a favor del comercio emisor sin costo de inventario adicional. |
| **Crédito de Barra (Saldo de Circuito Cerrado)** | `creditsBalance` / `users.balance` | $1\text{ Crédito} \equiv 1,00\text{ unidad nominal en el Tenant}$ | Unidad de cuenta interna no retirable en efectivo que liquida diferencias de valor en trueques P2P de productos y almacena el vuelto de canje del *Item Changer*. |
| **Permuta P2P de Productos (*Product Swap*)** | `requestedProductName` + `creditDelta` | $V_{\text{ofrecido}} \in \left[V_{\min}, V_{\max}\right]$ respecto a $V_{\text{solicitado}} + \Delta C$ | Intercambio atómico estilo *Steam Trade* donde dos usuarios permutan cupones de distintos productos (ej. empanadas por café) compensando la asimetría nominal con Créditos de Barra. |
| **Producto Descontinuado** | `isDiscontinued` (`BOOLEAN`) | Estado de catálogo dado de baja por el comercio emisor. | Inhabilita nuevas ventas primarias y bloquea ofertas P2P entre usuarios, habilitando el rescate bonificado en el *Item Changer*. |
| **Intercambiador de Equivalencias (*Item Changer*)** | `/api/v1/changer/swap` | $\sum V_{\text{entrada}} + C_{\text{usados}} \ge \sum P_{\text{nom}}(\text{salida})$ | Motor de permuta instantánea de doble panel (estilo *KeyDrop Skin Changer*) donde el usuario entrega cupones vigentes o descontinuados y elige productos activos equivalentes del catálogo. |
| **Incentivo por Descontinuación** | $\beta_{\text{disc}}$ / `discontinuedBonusPct` | $V_{\text{rescate}} = \text{round}_2\left(P_{\text{nom}} \cdot \left(1 + \frac{\beta_{\text{disc}}}{100}\right)\right)$ | Bonificación porcentual (ej. $+15\%$) otorgada automáticamente al usuario cuando introduce un cupón de producto descontinuado en el *Item Changer*, acreditando el sobrante en su saldo de Créditos de Barra. |
| **Breakage (Caducidad No Reclamada)** | Asiento `REFUND` / Política comercial | Remanente contractual o reembolso automático ejecutado cuando un cupón supera `expiration_date` sin haber sido canjeado. | En SMCTA v2 cierra contablemente la custodia mediante asiento compensatorio `-P_nom` (`uq_ledger_terminal_once`). |

---

## 3. Términos de Seguridad, Concurrencia y Máquina de Estados

| Término Técnico | Representación en Sistema | Significado Preciso |
| :--- | :--- | :--- |
| **Custodia Segregada (*Escrow*)** | Tabla `escrow_ledgers` | Patrimonio de afectación contablemente separado de la caja operativa del comercio y de la plataforma hasta el perfeccionamiento físico de la prestación. |
| **Invariante de Balance Cero** | `AuditReportDTO.difference === 0` | Igualdad obligatoria en todo instante $t$ entre el saldo algebraico del libro mayor y la suma nominal de los cupones vigentes (`EN_WALLET` + `PUBLICADO_P2P`). |
| **Versión de Token (`token_version`)** | `coupons.token_version` (`INT`) | Contador monótono creciente (Fencing / Epoch) embebido en la firma `HMAC-SHA256` del QR que revoca instantáneamente credenciales emitidas bajo estados o dueños anteriores. |
| **Ataque Boomerang** | Error `409 QR_STALE_TOKEN` | Intento fraudulento consistente en capturar un QR válido, vender el cupón en el mercado P2P y presentar la captura previa en el TPV antes que el nuevo propietario. |
| **Ventana de Cierre Pre-Evento** | `closureHoursBeforeEvent` | Cantidad de horas previas a `expiration_date` durante las cuales el mercado secundario rechaza nuevas publicaciones o compras (`423 MARKET_CLOSED_BEFORE_EVENT`) para estabilizar el padrón de ingreso en puerta. |
| **Cupo Diario Anti-Acaparamiento** | `maxDailyResalesPerUser` | Número máximo de publicaciones secundarias permitidas por usuario y día UTC dentro de un mismo *Tenant* (`429 DAILY_RESALE_LIMIT_REACHED`). |

---

## 4. Matriz de Blindaje Legal B2C: Vocabulario Permitido vs. Prohibido

Para preservar el encuadramiento jurídico de SMCTA como **plataforma comercial de cesión de derechos de consumo y reservas prepagas** (exenta de regímenes de oferta pública de valores negociables o captación bancaria), todo texto visible al consumidor final en interfaces, correos y términos de uso debe respetar estrictamente la siguiente tabla de sustitución léxica:

| Concepto Subyacente | Términos PROHIBIDOS en Interfaz B2C (Riesgo CNV / BCRA) | Términos OBLIGATORIOS / PERMITIDOS en Interfaz B2C |
| :--- | :--- | :--- |
| Unidad comercializable | *Acción, título valor, bono, security, derivado, criptoactivo, inversión* | **Cupón de consumo, pase digital, voucher prepago, reserva transferible** |
| Acción de publicación P2P | *Shortear, emitir deuda, especular, colocar posición financiera* | **Publicar cupón en reventa autorizada, ceder reserva, transferir pase** |
| Diferencia positiva de precio | *Rendimiento garantizado, dividendo, interés, renta financiera, ROI* | **Valor de transferencia acordado, precio dentro de banda del comercio** |
| Cuenta de resguardo | *Depósito bancario a la vista, fondo común de inversión, cuenta remunerada* | **Custodia de garantía comercial (Escrow sin devengamiento de intereses)** |
| Cartera del usuario | *Cuenta comitente, portafolio bursátil, bróker regulado* | **Billetera de cupones / Mis pases activos** |
| Saldo interno de compensación | *Criptomoneda, stablecoin, dinero electrónico convertible, saldo retirable a CBU/CVU* | **Créditos de Barra / Saldo de Canje interno (uso exclusivo en productos del local)** |
| Reemplazo de ítem dado de baja | *Indemnización financiera, rescate de bono, liquidación de derivado* | **Canje en Item Changer con incentivo comercial por producto descontinuado** |

> *Directriz vinculante para revisiones de código (Pull Requests):* Cualquier *commit* en `@smcta/web` que introduzca promesas de rentabilidad financiera o vocabulario de intermediación bursátil regulada en textos orientados al consumidor final debe ser rechazado durante la revisión de pares.
