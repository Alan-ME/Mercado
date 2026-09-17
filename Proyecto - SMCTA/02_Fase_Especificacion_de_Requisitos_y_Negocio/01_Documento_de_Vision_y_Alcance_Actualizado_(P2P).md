# Documento de Visión y Alcance Actualizado (P2P)

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 02_Fase_Especificacion_de_Requisitos_y_Negocio  
> **Código de Documento:** DOC-SMCTA-REQ-001  
> **Estado:** Especificación de Visión y Alcance v2.0 (Rediseño P2P)  

> ℹ️ **Nota General de Plantilla y Recomendación Técnica:**  
> Este documento reemplaza y actualiza formalmente la visión técnica original de SMCTA, consolidando la reorientación hacia un modelo de comercio electrónico White-Label con mercado secundario P2P sin riesgo de contrapartida. Se adopta el camino de especificación funcional más recomendado para estructurar proyectos de software multi-inquilino (*multi-tenant*). Los bloques demarcados como [COMPLETAR: ...] quedan dispuestos para registrar identificadores y parámetros de producción por cliente B2B.

## 1. Declaración de la Visión y Propósito Comercial Actualizado

---

El propósito central de SMCTA es proporcionar una solución de software de marca blanca (*White-Label*), altamente parametrizable e integrable en plataformas de e-commerce, que permita a las empresas emitir activos digitales de reserva ("Cupones de Valor") y ofrecer a sus clientes finales un **mercado secundario Peer-to-Peer (P2P) nativo**.

A diferencia de los modelos tradicionales de e-commerce o de las propuestas con contrapartida directa, SMCTA desacopla al comercio del riesgo de fluctuación monetaria. La plataforma actúa como un tercero facilitador de infraestructura y custodia (*matchmaker*), permitiendo que los usuarios negocien cupones entre sí bajo bandas de precios seguras, mientras la empresa emisora monetiza cada transacción a través de comisiones de servicio (*take-rates*).

## 2. Ficha de Registro de Instancia B2B (Tenant Registration Sheet)

---

Espacio reservado en formato de plantilla para registrar los datos del licenciatario B2B al momento del aprovisionamiento del software.

| Campo de Registro | Especificación / Valor por Defecto | Datos Reales del Tenant |
| --- | --- | --- |
| Razón Social / Licenciatario B2B: | Empresa cliente que adquiere el software White-Label. | [COMPLETAR: NOMBRE_EMPRESA_B2B] |
| Dominio / Instancia P2P: | https://marketplace.[tenant-domain].com | [COMPLETAR: URL_INSTANCIA] |
| Vertical de Aplicación Aprobada: | Eventos / Coleccionables / Reservas Exclusivas | [COMPLETAR: VERTICAL_SELECCIONADA] |
| Límite Max. de Cupones Emitidos / Lote: | 5,000 unidades por evento o venta especial. | [COMPLETAR: LIMITE_CUPONES] |
| Moneda Base de Operación: | Moneda local según país de operación. | [COMPLETAR: MONEDA_LOCAL] |

## 3. Alcance del Producto: Módulos Dentro y Fuera de Alcance (In-Scope vs. Out-of-Scope)

---

| Doble Dimensión | Funcionalidades IN-SCOPE (Dentro del Alcance) | Funcionalidades OUT-OF-SCOPE (Fuera del Alcance) |
| --- | --- | --- |
| Plataforma B2B (Tenant) | Panel de administración para parametrización de curvas y comisiones.Integración con pasarelas de pago y cuentas Escrow segregadas.Dashboard de analítica de liquidez, canjes e ingresos por comisiones.Generador de códigos QR dinámicos anti-captura para validación física. | Garantía o recompra de cupones con caja corporativa del comercio.Sistemas de logística o envío físico de mercadería general.Otorgamiento de créditos o financiamiento directo a usuarios. |
| Experiencia B2C (Usuarios) | Checkout integrado para compra primaria de cupones.Mercado P2P con libro de órdenes (*Order Book*) en tiempo real.Billetera digital (*Wallet*) para gestión y canje de cupones.Sistema de notificaciones push/email por ejecución de órdenes P2P. | Retiros de fondos sin validación previa de identidad (KYC básico).Transferencias de fondos P2P fuera del contexto de un cupón.Exportación de cupones a mercados de terceros no regulados. |

## 4. Perfiles de Usuario y Arquetipos de Interacción

---

### 4.1. Cliente B2B: El Comerciante / Administrador del Tenant

- Motivación Principal: Obtener ingresos anticipados por la venta de reservas, evitar el *scalping* externo no regulado y capturar una nueva fuente de ingresos pasivos vía comisiones por reventa P2P.
- Puntos de Control: Configuración de ventanas temporales de reventa, establecimiento de pisos y techos de precios (*Price Collar*), y supervisión de fondos retenidos en Escrow.

### 4.2. Cliente B2C Pragmático (El Consumidor Final)

- Motivación Principal: Adquirir un bien o servicio de alta demanda para su uso o consumo personal inmediato o programado.
- Flujo Típico: Compra el cupón en la fase primaria, lo almacena en su wallet digital y lo presenta mediante QR dinámico en el punto de venta para validar el canje.

### 4.3. Cliente B2C Estratega / Oportunista (El Usuario Trader P2P)

- Motivación Principal: Monetizar el valor de su reserva cuando no puede asistir a un evento o cuando la escasez incrementa el precio del cupón en el mercado secundario.
- Flujo Típico: Publica su cupón en el *Order Book* P2P fijando un precio dentro de la banda permitida, vende la posición a otro usuario y recibe el crédito abonado en su balance menos la comisión de servicio.

## 5. Reglas de Negocio de Alto Nivel para el Ciclo P2P

---

1. Exclusividad Mutua Operativa: Un cupón solo puede estar en uno de tres estados activos: *En Billetera (Listo para canje)*, *Publicado en Mercado P2P (Bloqueado para canje)* o *Canjeado/Cerrado*. El canje y la reventa se excluyen mutuamente.
2. Límites de Seguridad y Anti-Especulación: Ninguna orden P2P puede ser publicada fuera del rango $[P_{min}, P_{max}]$ dictado por el algoritmo de banda de precios del comercio. Se aplican límites máximos de cupones operables por usuario/día.
3. Protección de Fondos por Escrow Inviolable: El 100% del capital de emisión primaria permanece custodiado en la pasarela de pagos regulada hasta que el tenedor final valida el canje físico o expira el plazo del activo.

## 6. Anexo: Formulario de Firma y Validacion de Requisitos

---

Espacio reservado para formalizar la aprobación de este documento antes de proceder a la especificación detallada de reglas de negocio.

ACTA DE APROBACIÓN - VISIÓN Y ALCANCE P2P v2.0

El presente documento fija el marco funcional oficial para la plataforma SMCTA P2P. Cualquier cambio posterior en el alcance deberá ser tramitado mediante una solicitud formal de control de cambios (Change Request).

Líder de Producto / PM: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Líder Técnico de Proyecto: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
