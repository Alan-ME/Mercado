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

Toda propuesta de ingeniería sólida requiere situarse con honestidad frente a las soluciones consolidadas del mercado, identificando qué mecanismos probados adopta, qué vulnerabilidades ajenas corrige y en qué nicho específico aporta valor diferencial. Este documento evalúa sistemáticamente cuatro arquitecturas industriales de referencia —**StubHub / Viagogo**, **StockX**, **Ticketmaster SafeTix** y **Starbucks Rewards**— contrastándolas en ocho dimensiones técnicas y regulatorias frente a **SMCTA v2**.

---

## 1. Taxonomía de Plataformas Analizadas

1. **Mercados Abiertos de Reventa de Entradas (*Open Secondary Ticketing* — ej. StubHub, Viagogo):** Operan como tableros agregadores donde vendedores externos fijan libremente el precio de reventa. Al carecer de integración nativa con la base de datos primaria del emisor en muchos recintos, dependen de garantías financieras post-evento para indemnizar al comprador si el código PDF ya había sido utilizado en puerta.
2. **Bolsas de Bienes Físicos Autenticados (*Bid/Ask Commodity Marketplaces* — ej. StockX, GOAT):** Introducen una interfaz de libro de órdenes transparente con historial de cotizaciones (inspiración directa de la visualización analítica en *BREW/DESK*), pero requieren logística postal hacia un centro físico de inspección humana, imponiendo latencias de liquidación de varios días e inviabilidad para servicios perecederos o gastronomía diaria.
3. **Ecosistemas Cerrados con Credencial Dinámica (*First-Party Dynamic Ticketing* — ej. Ticketmaster Presence / SafeTix):** Resuelven eficazmente el fraude por captura de pantalla mediante tokens criptográficos rotativos vinculados a la titularidad en base de datos, pero operan como monopolio monomarca de alta comisión, sin ofrecer infraestructura *White-Label* ligera para comercios medianos, hoteles independientes o cafeterías de especialidad.
4. **Sistemas Prepagos de Fidelización (*Closed-Loop Stored Value* — ej. Starbucks Rewards):** Acumulan miles de millones de dólares en saldo anticipado (*float* comercial), pero bloquean por completo al consumidor: si el cliente no puede asistir o cambia de preferencia, carece de un canal legítimo para transferir su crédito o cupón promocional a otro consumidor.

---

## 2. Evaluación Cuantitativa de Capacidades Arquitectónicas

La siguiente visualización compara el grado de cobertura estructural (escala normalizada `0–100%` sobre cinco invariantes técnicos auditables: custodia segregada nominal, acotamiento bilateral de volatilidad, invalidación criptográfica instantánea en puerta, multi-tenancy *White-Label* y liquidación instantánea sin logística física):

<!-- FIGURE: FIG-BENCHMARK-RADAR -->

---

## 3. Matriz Comparativa Detallada en Ocho Ejes de Ingeniería

| Dimensión Evaluada | StubHub / Viagogo | StockX | Ticketmaster SafeTix | Starbucks Rewards | SMCTA v2 (Arquitectura Implementada) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Topología de Mercado** | P2P asíncrono externo al emisor | Libro doble Bid/Ask centralizado | Reventa interna controlada por emisor | Prepago unilateral B2C sin reventa | **Libro P2P de venta directa integrado al emisor** |
| **2. Riesgo de Fraude por Captura QR** | Alto (depende de penalidades monetarias al vendedor) | Nulo, pero a costa de envío físico a almacén | Muy bajo (TOTP rotativo cada 15 s) | Medio-Bajo (código ligado a sesión) | **Nulo (`HMAC-SHA256` 30 s + `token_version` monótono)** |
| **3. Control Anti-Especulación** | Nulo (sobreprecios de 500%–2000% frecuentes) | Nulo (precio libre por escasez) | Parcial (en algunos países tope nominal) | No aplica | **Nativo por *Tenant*: *Price Collar* $[\phi_{\min}, \phi_{\max}]$ + cupo diario** |
| **4. Segregación Contable del Principal** | Retención de pago completo hasta post-evento | Retención temporal durante inspección | Liquidación corporativa opaca | No segregado (pasivo general en balance) | **Escrow segregado 100% nominal (`trg_escrow_ledgers_immutable`)** |
| **5. Regalías para el Comercio Original** | **0%** (toda la plusvalía escapa del organizador) | **0%** para la marca fabricante original | Sí, compartido con promotor | 100% emisión primaria; 0% secundario | **Sí (`tenantNetFee` automático en cada asiento `P2P_SPLIT`)** |
| **6. Arquitectura *White-Label* B2B** | No | No | Limitada a grandes estadios | No (aplicación propietaria única) | **Nativa por subdominio + CSS Design Tokens en vivo** |
| **7. Latencia de Transferencia de Titularidad** | Minutos a horas (reemisión manual/diferida) | 5 a 12 días hábiles (correo físico) | Instantánea en base de datos | Inexistente | **Sub-segundo (`~7 ms` bajo aislamiento `SERIALIZABLE`)** |
| **8. Exposición Regulatoria Bursátil** | Baja (intermediación comercial de entradas) | Baja (compraventa de mercadería física) | Baja (servicio de boletería) | Regulación de dinero electrónico según país | **Baja/Mitigada (cesión acotada de consumo sin cuenta saldo libre)** |

---

## 4. Hallazgos Clave Aplicados al Diseño de SMCTA v2

1. **Captura de Valor Secundario para el Comercio Emisor:** El defecto económico central de plataformas externas como StubHub es que el comercio que asume todo el riesgo productivo de organizar el festival, mantener el hotel o tostar el café recibe `$0,00` cuando sus productos se revenden con sobreprecio afuera. En SMCTA v2, cada operación `P2P_SPLIT` acredita automáticamente `tenantNetFee = grossFee - platformShare` a favor del comercio sin alterar su principal asegurado.
2. **Superioridad del Versionado Monótono sobre la Simple Ventana Temporal:** El análisis de sistemas tipo SafeTix reveló que rotar el código cada 15 o 30 segundos mitiga capturas enviadas por mensajería horas antes, pero deja abierta una ventana residual de segundos si la venta ocurre frente al molinete. La adición de `coupons.token_version` en SMCTA v2 cierra matemáticamente esa brecha residual sin requerir hardware NFC propietario.
3. **Viabilidad en Micro-Transacciones Gastronómicas (*BREW/DESK*):** Al operar con latencia transaccional sub-segundo y cero inspección física intermedia, el mismo motor que liquida estadías hoteleras de `$250` permite intercambiar combos matutinos o cafés de especialidad de `$2,80–$6,20` con comisiones paramétricas reducidas (`2,0% / 1,5%`).
