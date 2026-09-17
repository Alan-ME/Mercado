# Propuesta de Rediseño de Arquitectura P2P v2

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 01_Fase_Estrategia_y_Rediseño_de_Modelo  
> **Código de Documento:** DOC-SMCTA-EST-002  
> **Estado:** Propuesta de Arquitectura v2 para Revisión y Aprobación  

> ℹ️ **Nota General de Plantilla y Recomendación Técnica:**  
> Este documento establece formalmente el nuevo paradigma arquitectónico P2P para el producto White-Label SMCTA, reestructurando la lógica conceptual expuesta en el Documento de Visión original y resolviendo las fallas del modelo con contrapartida directa. En aquellos puntos donde se requiera parametrización del negocio, se especifica el camino arquitectónico más recomendado. Se reservan bloques demarcados como [COMPLETAR: ...] para ser alimentados con las métricas y configuraciones definitivas del despliegue B2B.

## 1. Resumen de Transformación Arquitectónica: v1 vs. v2

---

La versión v1 de SMCTA concebía el sistema como un mecanismo donde el comerciante recompraba cupones utilizando un algoritmo dinámico de valoración interna, obligando al comercio a asumir el riesgo de liquidez y fluctuación. La versión **SMCTA Architecture v2** transforma el motor en una **Plataforma Facilitadora de Mercado Secundario Peer-to-Peer (P2P)**.

| Dimensión de Diseño | Modelo Original (SMCTA v1) | Nuevo Modelo Rediseñado (SMCTA P2P v2) |
| --- | --- | --- |
| Rol del Comercio (Tenant B2B) | Contrapartida directa / Market Maker (Garantiza recompra con su propio balance). | Emisor primario y Facilitador de Plataforma (Matchmaker) sin riesgo de balance. |
| Contraparte del Usuario (Trader B2C) | El comercio (Caja corporativa). | Otro usuario final dentro del mercado P2P (Comprador secundario). |
| Determinación de Precio Dinámico | Algoritmo cerrado dictado por la plataforma/comercio. | Libre oferta y demanda acotada por bandas algorítmicas de seguridad (Piso/Techo). |
| Fuente de Monetización B2B | Margen retail menos pérdidas por recompra de plusvalías. | Ingreso por venta primaria (100% Escrow liberado) + Take-Rates por transacción P2P (3% - 5%). |
| Manejo de Liquidez y Caja | Pasivo contingente flotante a la vista (Riesgo de Bank Run). | Segregación estrita en Escrow regulado con liberación automática post-canje o expiración. |

## 2. Registro de Parametrización para Clientes B2B (Tenant Config)

---

Espacio reservado para registrar la configuración por defecto de la instancia P2P antes de pasar a desarrollo y despliegue.

| Parámetro de Configuración | Valor Recomendado / Por Defecto | Registro Real del Tenant |
| --- | --- | --- |
| Identificador de Tenant / Proyecto: | tenant-default-p2p | [COMPLETAR: ID_TENANT_B2B] |
| Comisión por Publicación (Listing Fee): | $0.00 (Incentiva liquidez de oferta) | [COMPLETAR: MONTO_O_PORCENTAJE] |
| Take-Rate Vendedor (Seller Fee %): | 3.5% sobre valor de cierre P2P | [COMPLETAR: PORCENTAJE_VENDEDOR] |
| Take-Rate Comprador (Buyer Fee %): | 2.5% sobre valor de cierre P2P | [COMPLETAR: PORCENTAJE_COMPRADOR] |
| Duración Máxima de Publicación P2P: | 24 horas (Renovación automática opcional) | [COMPLETAR: HORAS_EXPIRACION_ORDEN] |
| Banda de Fluctuación Permitida (Price Collar): | Min: 50% de Emisión / Max: 300% de Emisión | [COMPLETAR: PISO_Y_TECHO_PORCENTAJE] |

## 3. Diagrama de Flujos de Información y Ciclo de Vida del Activo v2

---

A continuación se representa la topología del flujo P2P y la segregación de fondos en custodia:

+-----------------------------------------------------------------------------------+
| CICLO DE VIDA P2P - SMCTA v2 |
+-----------------------------------------------------------------------------------+

1. EMISIÓN PRIMARIA (E-Commerce Checkout)
[ Cliente A ] -------- Pago 100% --------> [ Pasarela / Escrow Account ]
| |
+<------- Emisión de Cupón / NFT de Reserva ---------+

2. VENTANA DE TRADING SECUNDARIO (Mercado P2P)
[ Cliente A (Vendedor) ] -- Publica Cupón a $130 --> [ Order Book P2P ]
|
[ Cliente B (Comprador) ] -- Paga $130 + 2.5% Fee --------->+
|
+------------------+------------------+
| |
( $130 - 3.5% Fee ) ( Comisiones 6% )
| |
v v
[ Caja Cliente A ] [ Cuenta Fee Comercio ]
(Transferencia P2P) (Ingreso Neto B2B)

3. LIQUIDACIÓN FINAL Y CANJE (Consumo o Expiración)
[ Cliente B (Tenedor Final) ] -- Presenta Cupón / QR --> [ Comercio B2B ]
|
Valida Canje / Entrega Stock
|
[ Pasarela / Escrow Account ] ----- Libera Depósito $100 ----> [ Caja Comercio B2B ]

## 4. Especificación del Motor de Órdenes P2P y Banda de Precios

---

Para evitar volatilidad descontrolada, manipulación de mercado o prácticas de *scalping* predatorio, la arquitectura P2P v2 integra un **Motor de Emparejamiento de Órdenes (Order Matcher)** protegido por algoritmos de control de precio.

### 4.1. Algoritmo de Banda de Precios Dinámica (Price Collar Mechanism)

El administrador de la tienda B2B puede configurar límites superiores e inferiores sobre el valor nominal de emisión ($V_0$) para que las órdenes P2P se mantengan dentro de márgenes razonables de mercado:

$$P_{min} = V_0 \times (1 - \delta_{piso})$$

$$P_{max} = V_0 \times (1 + \Delta_{techo})$$

- Piso de Protección ($P_{min}$): Evita que pánicos de reventa devalúen excesivamente la percepción de marca del comercio (ej. $\delta_{piso} = 0.5 \rightarrow$ Precio mínimo = 50% de la emisión).
- Techo Especulativo ($P_{max}$): Previene la especulación desmedida o monopolización de cupones en eventos masivos (ej. $\Delta_{techo} = 2.0 \rightarrow$ Precio máximo = 300% de la emisión).

### 4.2. Tipos de Órdenes Soportadas por la Plataforma

1. Orden P2P a Precio Fijo (Limit Order): El usuario vendedor especifica el monto exacto en moneda local que desea recibir por su cupón. La orden permanece en el libro de ofertas hasta que un comprador la acepta o se agota la ventana de publicación.
2. Orden de Liquidación Rápida (Market Sell Order): El usuario acepta la oferta de compra disponible más alta existente en el libro de órdenes en ese instante, ejecutando el traspaso inmediatamente.

## 5. Estructura Monetaria, Reglas de Escrow y Distribución de Fees

---

El núcleo de la estabilidad financiera en SMCTA v2 reside en el desacoplamiento de los fondos de emisión respecto a los fondos de reventa.

### 5.1. Reglas de Manejo de la Cuenta Escrow (Custodia Primaria)

- Inviolabilidad del Capital Primario: Los $100 ingresados durante la compra inicial permanecen en la cuenta de custodia temporal (*Escrow*) bajo la titularidad técnica de la pasarela de pago regulada. El comercio no puede disponer de este dinero para operabilidad diaria.
- Condiciones de Desbloqueo del Escrow (Release Triggers):

1. Evento de Canje Exitoso: Cuando el tenedor actual del cupón valida el código QR o token en la tienda física/virtual, el sistema envía un evento *WEBHOOK_REDEEM_SUCCESS* que transfiere automáticamente el 100% del fondo de custodia a la cuenta de liquidación del comercio.
2. Evento de Expiración del Cupón: Si finaliza la ventana temporizada sin canje ni reventa activa, el contrato ejecuta la regla de vencimiento (ej. liberación del 100% al comercio o retención de *breakage fee* según los T&C del cliente B2B).

### 5.2. Muestra de Distribución Monetaria por Transacción P2P (Ejemplo Práctico)

A continuación se ilustra una transacción P2P donde el Cliente A revende un cupón emitido originalmente a $100 al Cliente B por un precio de mercado P2P de $150, bajo un esquema de comisiones del 3.5% vendedor y 2.5% comprador:

| Actor / Entidad | Flujo Financiero Entrada / Salida | Resultado Neto en Caja |
| --- | --- | --- |
| Cliente A (Vendedor P2P) | Recibe $150 (Precio P2P) - $5.25 (3.5% Fee) | +$144.75 (Ganancia neta: +$44.75 sobre su compra inicial de $100). |
| Cliente B (Comprador P2P) | Paga $150 (Precio P2P) + $3.75 (2.5% Fee) | -$153.75 (Adquiere la propiedad del cupón y el derecho de canje). |
| Comercio B2B (Tenant) | Recibe $5.25 (Fee Vendedor) + $3.75 (Fee Comprador) | +$9.00 (Ingreso neto inmediato por facilitación P2P). El depósito de $100 original sigue en Escrow. |

## 6. Arquitectura de Interfaces B2B y Experiencia B2C (White-Label)

---

La solución se estructura bajo una arquitectura de microservicios o módulos desacoplados (*headless*), facilitando la integración White-Label en plataformas existentes (Shopify, WooCommerce, Custom React/Flutter apps).

### 6.1. Componentes Frontend B2C (Embeddable Widgets)

- Widget Checkout Tradicional con Módulo SMCTA: Permite adquirir el producto con la opción de "Modo Reserva Especulativa P2P" o "Modo Compra Directa".
- Panel P2P Marketplace (Hub del Trader): Interfaz interactiva donde los usuarios ven el libro de órdenes local, gráficos de historial de precio P2P del lote y botones directos de "Publicar en Mercado" o "Comprar Cupón".
- Wallet Digital de Cupones (QR Dinámico): Interfaz móvil/web que genera un código QR de alta seguridad de un solo uso (con rotación de token anti-captura) para la presentación y canje físico.

### 6.2. Panel de Administración B2B (Tenant Dashboard)

- Gestor de Parámetros P2P: Control en tiempo real para activar/desactivar la reventa P2P por producto, ajustar comisiones (*take-rates*), definir ventanas de trading (ej. abrir mercado 48h antes de un evento) y fijar las bandas de precios.
- Monitor de Salud Financiera y Escrow: Métrica en vivo del balance acumulado en la cuenta Escrow, ingresos acumulados por comisiones P2P y tasa de conversión de cupones canjeados frente a vencidos.

## 7. Anexo: Formulario de Firma y Aprobación de Arquitectura v2

---

Espacio reservado para la firma de la jefatura técnica y del representante del proyecto antes de habilitar la fase de desarrollo.

ACTA DE APROBACIÓN TÉCNICA - REDISEÑO ARQUITECTURA P2P v2

Por la presente, el equipo directivo y técnico valida la transición de la arquitectura SMCTA v1 hacia la arquitectura P2P v2 especificada en este documento, confirmando que resuelve los riesgos de selección adversa, iliquidez y encuadre regulatorio.

Líder de Arquitectura / CTO: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Líder de Producto / PM: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
