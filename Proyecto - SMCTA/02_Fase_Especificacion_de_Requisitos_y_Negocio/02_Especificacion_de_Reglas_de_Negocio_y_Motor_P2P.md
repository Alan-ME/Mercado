# Especificación de Reglas de Negocio y Motor P2P

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 02_Fase_Especificacion_de_Requisitos_y_Negocio  
> **Código de Documento:** DOC-SMCTA-REQ-002  
> **Estado:** Especificación Técnica de Reglas v2.0  

> ℹ️ **Nota General de Plantilla y Recomendación Técnica:**  
> Este documento detalla las reglas de negocio deterministas, la máquina de estados del activo digital y los algoritmos que gobiernan el motor de emparejamiento de órdenes P2P para la solución White-Label SMCTA. Adopta la especificación más rigurosa para evitar comportamientos ambiguos o vectores de manipulación. Los bloques demarcados como [COMPLETAR: ...] permiten simular la configuración de parámetros operativos específicos de cada cliente B2B.

## 1. Máquina de Estados Finitos del Cupón (Coupon State Machine)

---

Todo cupón emitido por el sistema SMCTA debe responder a una máquina de estados estrictamente determinista con transacciones atómicas:

+-------------------+
| 01. EMITIDO | (Pago inicial en Escrow)
+---------+---------+
|
+---------------+---------------+
| |
v v
+-------------------+ +-------------------+
| 02. EN_WALLET | <-------> | 03. PUBLICADO | (Bloqueado para Canje)
| (Listo p/ Canje) | | _P2P |
+---------+---------+ +---------+---------+
| |
+---------------+---------------+
|
+---------------+---------------+
| |
v v
+-------------------+ +-------------------+
| 04. CANJEADO | | 05. VENCIDO |
| (Entrega Stock) | | (Expirado) |
+-------------------+ +-------------------+

| Estado ID | Nombre del Estado | Descripción y Reglas Operativas | Permite Canje | Permite Reventa P2P |
| --- | --- | --- | --- | --- |
| ST-01 | EMITIDO | Estado inicial tras confirmación de pago primario en Checkout. Fondos ingresan a Escrow. | No (Transitorio) | No |
| ST-02 | EN_WALLET | El cupón está asignado a la billetera digital del usuario actual. Genera token/QR dinámico. | Sí | Sí |
| ST-03 | PUBLICADO_P2P | El cupón está ofertado en el libro de órdenes P2P. Se deshabilita la generación de QR de canje. | No (Bloqueado) | En ejecución |
| ST-04 | CANJEADO | El comercio validó el QR en TPV/Store. Estado terminal. Desbloquea la liberación del Escrow al comercio. | No (Terminal) | No |
| ST-05 | VENCIDO | Superó la fecha u hora límite de la ventana. Estado terminal. Ejecuta la regla de expiración B2B. | No (Terminal) | No |

## 2. Catálogo de Reglas de Negocio Inflexibles (Business Rules)

---

### RN-01: Exclusividad Mutua y Bloqueo de Estado

Un cupón en estado PUBLICADO_P2P no puede ser presentado para canje físico o virtual bajo ninguna circunstancia. Para poder canjearlo, el usuario debe cancelar explícitamente la orden P2P activa, retornando el activo a EN_WALLET.

### RN-02: Algoritmo de Banda de Precios Controlada (Price Collar Enforcer)

El motor de órdenes rechazará automáticamente cualquier publicación cuyo precio $P_{propuesto}$ incumpla el rango configurado por el Tenant B2B:

$$V_0 \times (1 - \delta_{piso}) \le P_{propuesto} \le V_0 \times (1 + \Delta_{techo})$$

- Ejemplo Estándar: Si $V_0 = 100$, $\delta_{piso} = 0.3$ (30%) y $\Delta_{techo} = 1.5$ (150%), el sistema solo aceptará órdenes entre $70.00 y $250.00.

### RN-03: Asignación de Comisiones y Descuento Automático (Take-Rate Split)

Al completarse la transacción P2P por un monto de cierre $P_{cierre}$:

1. El comprador abona: $P_{total\_comprador} = P_{cierre} \times (1 + TakeRate_{comprador})$
2. El vendedor recibe: $P_{neto\_vendedor} = P_{cierre} \times (1 - TakeRate_{vendedor})$
3. El comerciante (Tenant) acumula en su cuenta de comisiones: $Fee_{total} = (P_{cierre} \times TakeRate_{comprador}) + (P_{cierre} \times TakeRate_{vendedor})$

### RN-04: Caducidad y Manejo Automático de Expiración (Breakage Policy)

Al llegar la estampa de tiempo $T_{expiracion}$ configurada para el lote de cupones:

- Todas las órdenes en estado PUBLICADO_P2P se cancelan automáticamente y pasan a VENCIDO.
- Los cupones en EN_WALLET pasan a VENCIDO.
- El motor de Escrow ejecuta la regla de liberación de fondos según la política parametrizada por el Tenant (ej. liberación del 100% de la venta primaria al comerciante por concepto de reserva no utilizada).

## 3. Registro de Parametrización de Reglas por Tenant

---

Plantilla para registrar los valores exactos que gobernaran las reglas de negocio de un cliente B2B específico.

| Código de Regla | Parámetro Configurable | Valor Estándar SMCTA | Configuración del Tenant |
| --- | --- | --- | --- |
| RN-02-CONF | Piso de Descuento Max ($\delta_{piso}$): | 0.50 (50% del valor nominal) | [COMPLETAR: PISO_PORCENTAJE] |
| RN-02-CONF | Techo de Revalorización Max ($\Delta_{techo}$): | 2.00 (200% de apreciación) | [COMPLETAR: TECHO_PORCENTAJE] |
| RN-03-CONF | Take-Rate Vendedor ($TakeRate_{vendedor}$): | 3.50% | [COMPLETAR: FEE_VENDEDOR] |
| RN-03-CONF | Take-Rate Comprador ($TakeRate_{comprador}$): | 2.50% | [COMPLETAR: FEE_COMPRADOR] |
| RN-05-CONF | Límite Max. Órdenes P2P / Usuario / Día: | 5 publicaciones activas. | [COMPLETAR: LIMITE_ORDENES] |
| RN-06-CONF | Cierre de Ventana P2P Antes de Evento: | 2 horas antes del evento ($T_{evento} - 2h$). | [COMPLETAR: HORAS_CIERRE_PREVIO] |

## 4. Lógica del Motor de Emparejamiento de Órdenes (Order Matcher Logic)

---

El motor P2P opera bajo el principio de **Cruce Continuo de Órdenes con Prioridad Precio-Tiempo (FIFO)**:

1. Recepción de Orden: El cliente emite una orden de venta o compra. El sistema valida firma digital del token, balance de billetera y cumplimiento de la regla RN-02 (Banda de Precios).
2. Bloqueo de Activo: Se transiciona el cupón al estado PUBLICADO_P2P en una transacción con aislamiento de base de datos *SERIALIZABLE* para evitar condiciones de carrera (*Race Conditions*).
3. Emparejamiento (Matching): Si existe una orden de compra coincidente ($P_{compra} \ge P_{venta}$), se ejecuta la transacción en el precio fijado por la orden más antigua.
4. Transferencia y Re-Emisión Tokenizada: Se invalida el token/QR del vendedor anterior y se emite un nuevo token encriptado asignado a la wallet del comprador, transicionando el cupón de nuevo a EN_WALLET.

## 5. Anexo: Formulario de Control y Firmas de Especificación Técnica

---

Espacio reservado para la validación de las reglas de negocio por el equipo de desarrollo backend y QA.

ACTA DE VALIDACIÓN TÉCNICA - REGLAS DE NEGOCIO Y MOTOR P2P

Se certifca que la máquina de estados y las reglas de negocio descritas son técnicamente viables y libres de ambigüedad para su implementación en la arquitectura backend.

Líder de Desarrollo Backend: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Líder de QA / Pruebas: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
