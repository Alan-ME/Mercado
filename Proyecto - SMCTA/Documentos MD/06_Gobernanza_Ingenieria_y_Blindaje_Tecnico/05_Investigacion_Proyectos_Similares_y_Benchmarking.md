---
doc_code: DOC-SMCTA-GOV-005
title: Investigación de Proyectos Similares y Benchmarking del Estado del Arte
subtitle: Análisis Comparativo Estructural, Financiero y Criptográfico frente a Plataformas Globales de Ticketing y Prepago
phase: 06 — Gobernanza de Ingeniería y Blindaje Técnico Oficial
version: 2.1.0
date: Noviembre 2026
authors: Equipo de Investigación y Arquitectura — Proyecto SMCTA
institution: Estudio Sistemático Comparativo (Metodología DESMET)
---

## Resumen

Toda propuesta de ingeniería sólida requiere situarse con honestidad frente a las soluciones consolidadas del mercado, identificando qué mecanismos probados adopta, qué vulnerabilidades ajenas corrige y en qué nicho específico aporta valor diferencial. Este documento evalúa sistemáticamente seis arquitecturas industriales de referencia —**StubHub / Viagogo**, **StockX**, **Ticketmaster SafeTix**, **Starbucks Rewards**, **Steam Community Market / Trade Offers** y **KeyDrop Skin Changer**— contrastándolas en ocho dimensiones técnicas, económicas y regulatorias frente a **SMCTA v2.2**.

---

## 1. Taxonomía de Plataformas Analizadas

1. **Mercados Abiertos de Reventa de Entradas (*Open Secondary Ticketing* — ej. StubHub, Viagogo):** Operan como tableros agregadores donde vendedores externos fijan libremente el precio de reventa. Al carecer de integración nativa con la base de datos primaria del emisor en muchos recintos, dependen de garantías financieras post-evento para indemnizar al comprador si el código PDF ya había sido utilizado en puerta.
2. **Bolsas de Bienes Físicos Autenticados (*Bid/Ask Commodity Marketplaces* — ej. StockX, GOAT):** Introducen una interfaz de libro de órdenes transparente con historial de cotizaciones (inspiración directa de la visualización analítica en *BREW/DESK*), pero requieren logística postal hacia un centro físico de inspección humana, imponiendo latencias de liquidación de varios días e inviabilidad para servicios perecederos o gastronomía diaria.
3. **Ecosistemas Cerrados con Credencial Dinámica (*First-Party Dynamic Ticketing* — ej. Ticketmaster Presence / SafeTix):** Resuelven eficazmente el fraude por captura de pantalla mediante tokens criptográficos rotativos vinculados a la titularidad en base de datos, pero operan como monopolio monomarca de alta comisión, sin ofrecer infraestructura *White-Label* ligera para comercios medianos, hoteles independientes o cafeterías de especialidad.
4. **Sistemas Prepagos de Fidelización (*Closed-Loop Stored Value* — ej. Starbucks Rewards):** Acumulan miles de millones de dólares en saldo anticipado (*float* comercial), pero bloquean por completo al consumidor: si el cliente no puede asistir o cambia de preferencia, carece de un canal legítimo para transferir su crédito o cupón promocional a otro consumidor.
5. **Mercados de Permuta P2P y Saldo de Circuito Cerrado (*Closed-Loop Item Trading* — ej. Steam Community Market & Trade Offers):** Permiten catalogar ítems digitales de inventario para intercambiarlos entre usuarios pares (ítem por ítem) o liquidarlos contra un saldo interno de billetera (*Steam Wallet*) que **nunca puede retirarse hacia cuentas bancarias externas**. Este diseño erradica de raíz la regulación de transmisión de dinero entre particulares, aunque carece de mecanismos de redención física en comercios reales.
6. **Balanceadores Instantáneos de Equivalencia (*Automated Item Changers* — ej. KeyDrop Skin Changer):** Sustituyen la espera de una contraparte humana por una interfaz de doble columna donde el usuario selecciona a la izquierda los objetos que desea entregar, visualiza en el centro el valor comercial reconocido en moneda local/créditos y elige a la derecha los objetos que desea recibir del catálogo activo filtrando por precio, categoría y rareza. SMCTA v2.2 adapta este patrón exacto para resolver el problema de **productos gastronómicos descontinuados** otorgando un incentivo porcentual de compensación y conservando el remanente en créditos de barra.

---

## 2. Evaluación Cuantitativa de Capacidades Arquitectónicas

La siguiente visualización compara el grado de cobertura estructural (escala normalizada `0–100%` sobre cinco invariantes técnicos auditables: custodia segregada nominal, acotamiento bilateral de volatilidad, invalidación criptográfica instantánea en puerta, multi-tenancy *White-Label* y liquidación instantánea sin logística física):

<!-- FIGURE: FIG-BENCHMARK-RADAR -->

---

## 3. Matriz Comparativa Detallada en Ocho Ejes de Ingeniería

| Dimensión Evaluada | StubHub / StockX | Ticketmaster SafeTix | Starbucks Rewards | Steam Trade / KeyDrop Changer | SMCTA v2.2 (Arquitectura Híbrida) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Topología de Intercambio** | Libro externo en dinero fiduciario | Reventa interna monetaria | Prepago unilateral sin reventa | **Permuta P2P de ítems + Changer de doble panel con créditos** | **Trading P2P por Productos (Steam) + Item Changer con Créditos (KeyDrop)** |
| **2. Riesgo de Fraude por Captura QR** | Alto en PDF / Envío postal en StockX | Muy bajo (TOTP rotativo 15 s) | Medio-Bajo (ligado a sesión) | No aplica (activos solo virtuales) | **Nulo (`HMAC-SHA256` 30 s + `token_version` monótono en cada swap)** |
| **3. Control Anti-Especulación** | Nulo (sobreprecios libres) | Parcial según jurisdicción | No aplica | Libre en Steam; spread fijo en KeyDrop | **Nativo por *Tenant*: *Price Collar* $[\phi_{\min}, \phi_{\max}]$ + cupo diario** |
| **4. Manejo de Producto Descontinuado** | Reembolso bancario forzoso | Reembolso / reprogramación | Pérdida o queja en mostrador | Conversión en *Item Changer* por ítem equivalente | **Rescate en *Item Changer* con Incentivo ($\beta_{\text{disc}} = +15\%$) + vuelto en créditos** |
| **5. Regalías y Retención de Caja B2B** | **0%** para el comercio original | Compartido con promotor | 100% primario; 0% secundario | 100% circuito cerrado (*Wallet* sin retiro bancario) | **100% caja retenida en local + comisión en créditos/puntos por swap** |
| **6. Arquitectura *White-Label* B2B** | No | Limitada a grandes estadios | No (app propietaria única) | No (ecosistema cerrado de videojuegos) | **Nativa por subdominio + CSS Design Tokens + vista *BREW/DESK*** |
| **7. Latencia de Permuta / Canje** | Horas a días hábiles | Instantánea en BD | Inexistente | Instantánea contra pool o al aceptar oferta | **Sub-segundo (`~7 ms` bajo aislamiento `SERIALIZABLE`)** |
| **8. Exposición Regulatoria PSP / BCRA** | Alta (dispersión de dinero a terceros) | Media (recaudación regulada) | Dinero electrónico según país | **Muy baja (créditos cerrados no retirables en efectivo)** | **Mínima (permuta de productos y créditos comerciales de circuito cerrado)** |

---

## 4. Hallazgos Clave Aplicados al Diseño de SMCTA v2.2

1. **Síntesis de Steam Trade + KeyDrop Changer aplicada a Gastronomía y Experiencias (`CR-003`):** El análisis comparativo demostró que combinar la **catalogación P2P de productos entre usuarios** de Steam (por ejemplo, cambiar un *Combo de Empanadas / Sándwich* por un *Café de Especialidad*) con el **balanceador visual de dos columnas de KeyDrop** sustentado en un **Saldo de Créditos de Circuito Cerrado** resuelve simultáneamente tres problemas críticos: (a) elimina el requerimiento de un PSP bancario que liquide dinero entre particulares, (b) soluciona la diferencia de precios nominales entre productos distintos mediante el vuelto en créditos y (c) aporta liquidez instantánea cuando un producto es descontinuado.
2. **Incentivo Positivo ante Descontinuación en Lugar de Reembolso Bancario:** Cuando un comercio da de baja un ítem estacional, el *Item Changer* toma el cupón descontinuado reconociendo un **bonus adicional parametrizable** (ej. $+15\%$) para que el usuario elija libremente un producto equivalente (como un alfajor o un *Mokaccino*) y conserve la diferencia en créditos, transformando una fricción operativa en fidelización sin salida de efectivo de la caja del comercio.
3. **Superioridad del Versionado Monótono sobre la Simple Ventana Temporal:** La adición de `coupons.token_version` en SMCTA cierra matemáticamente cualquier intento de presentar una captura del QR del producto original tras haberlo permutado en el P2P o reemplazado en el *Item Changer*.
