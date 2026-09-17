# Especificacion de Arquitectura Tecnica y Diagrama C4

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 03_Fase_Arquitectura_y_Diseño_de_Software  
> **Codigo de Documento:** DOC-SMCTA-ARQ-001  
> **Estado:** Especificacion de Arquitectura y Diseño Técnico v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento establece la arquitectura del sistema White-Label SMCTA P2P bajo el modelo C4 (Contexto, Contenedores, Componentes y Codigo). En cumplimiento con las directivas del proyecto, los diagramas visuales no se embeben directamente en este texto; en su lugar, se dejan los marcadores explícitos con la ruta y nomenclatura exacta para vincular las imagenes que se almacenaran en la subcarpeta del Drive Compartido. Los bloques demarcados como [COMPLETAR: ...] permiten simular la configuracion de infraestructura y microservicios por Tenant.

## 1. Especificacion de Componentes e Infraestructura de Microservicios

---

La arquitectura de SMCTA se diseña como una plataforma orientada a microservicios desacoplados (*Event-Driven Microservices*), garantizando alta disponibilidad, aislamiento de inquilinos (*tenants*) y procesamiento concurrente sin condiciones de carrera.

| Modulo / Servicio | Tecnologia Recomendada | Responsabilidad Tecnica Primaria |
| --- | --- | --- |
| API Gateway / Multi-Tenant Router | Node.js / Express / Kong Gateway | Enrutamiento dinamico por subdominio de Tenant, autenticación JWT, rate-limiting y resolucion de contexto multi-tenant. |
| Motor P2P / Order Matching Engine | Node.js / Go / Redis PubSub | Procesamiento concurrente FIFO del libro de ordenes P2P, validacion de Price Collar y ejecucion atomica de transacciones. |
| Servicio de Cupones y Wallet Digital | Node.js / PostgreSQL / WebSockets | Gestion de maquina de estados de cupones (ST-01 a ST-05), rotacion de tokens QR dinamicos anti-captura y envio de notificaciones. |
| Servicio de Escrow y Payment Pipeline | Node.js / Stripe / MercadoPago APIs | Orquestacion de pagos primarios, segregación en cuentas de custodia temporales y ejecucion de Webhooks de liberacion. |
| Panel Admin B2B & TPV Scanner | React / Flutter Web & Mobile | Interfaz de administracion White-Label para parametrizacion de comisiones, monitoreo de Escrow y escaneo TPV de canje. |

## 2. Estructura de Diagramas del Modelo C4 (Marcadores de Archivos)

---

A continuacion se especifican los cuatro niveles del modelo C4. Los diagramas graficos correspondientes deben ubicarse en la subcarpeta 📁 03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_C4/ del Drive Compartido con los nombres de archivo indicados.

### 2.1. Nivel 1: Diagrama de Contexto del Sistema (System Context Diagram)

Describe las interacciones de alto nivel entre los usuarios finales (Pragmaticos y Traders), los administradores B2B, los operadores TPV y los sistemas externos (Pasarelas de Pago / Escrow) con la plataforma SMCTA.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_C4/01_Diagrama_C4_Contexto.png`  
> *(Subir aquí el esquema de Contexto C4 del proyecto SMCTA P2P)*

### 2.2. Nivel 2: Diagrama de Contenedores (Container Diagram)

Muestra las aplicaciones ejecutables y almacenes de datos que constituyen el sistema: Frontend Web/Mobile (White-Label), API Gateway, Microservicios Backend, Base de Datos PostgreSQL Multi-Tenant y Cache Redis.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_C4/02_Diagrama_C4_Contenedores.png`  
> *(Subir aquí el esquema de Contenedores C4 con BD PostgreSQL y Caches)*

### 2.3. Nivel 3: Diagrama de Componentes del Motor P2P (Component Diagram)

Detalla la estructura interna del microservicio Order Matching Engine: OrderBook Manager, PriceCollar Enforcer, Matching Engine Worker y Transaction Ledger Writer.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_C4/03_Diagrama_C4_Componentes_Motor_P2P.png`  
> *(Subir aquí el esquema interno del Motor de Ordenes)*

### 2.4. Nivel 4: Diagrama de Secuencia de Compra P2P (Sequence Diagram)

Describe la traza paso a paso desde que el Comprador P2P hace clic en "Comprar Cupón" hasta la invalidación del token anterior, re-emisión en wallet y liberacion/split de comisiones.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_C4/04_Diagrama_Secuencia_Transaccion_P2P.png`  
> *(Subir aquí el flujo secuencial de llamadas API y base de datos)*

## 3. Registro de Ficha Tecnica de Despliegue e Infraestructura

---

Plantilla para documentar la infraestructura cloud y proveedores seleccionados por el cliente B2B o equipo de operaciones.

| Parametro de Infraestructura | Especificacion Recomendada | Registro Real de Produccion |
| --- | --- | --- |
| Proveedor de Nube (Cloud Provider): | AWS / GCP / Render Cloud | [COMPLETAR: PROVEEDOR_NUBE] |
| Motor de Base de Datos Relacional: | PostgreSQL v15+ (Managed Cluster) | [COMPLETAR: INSTANCIA_POSTGRES] |
| Cache en Memoria & PubSub: | Redis Enterprise v7+ | [COMPLETAR: INSTANCIA_REDIS] |
| Pasarela de Pagos / Escrow PSP: | Stripe Connect / MercadoPago Marketplace | [COMPLETAR: PROVEEDOR_PASARELA] |
| Monitoreo y Logs en Vivo: | Datadog / Prometheus + Grafana | [COMPLETAR: SERVICIO_MONITOREO] |

## 4. Anexo: Formulario de Firma y Aprobacion de Arquitectura (Fase 03)

---

Espacio reservado para certificar la validacion de la arquitectura de software por el equipo de ingeniería.

ACTA DE APROBACIÓN TÉCNICA - ARQUITECTURA C4 Y COMPONENTES

La arquitectura de microservicios y especificaciones de diagramas C4 quedan aprobadas para guiarse en el desarrollo de la base de datos y modulos backend.

Arquitecto Principal de Software: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Lider de Infraestructura / DevOps: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
