# Historias de Usuario y Criterios de Aceptacion

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 02_Fase_Especificacion_de_Requisitos_y_Negocio  
> **Codigo de Documento:** DOC-SMCTA-REQ-004  
> **Estado:** Especificacion Funcional de Requisitos v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento formaliza el catalogo de Historias de Usuario (User Stories) estructurado para guiar las fases de desarrollo backend, frontend y pruebas de calidad (QA). Todos los criterios de aceptacion se especifican bajo el estandar Given-When-Then (Dado que - Cuando - Entonces) para garantizar verificabilidad automatizada. Los bloques demarcados como [COMPLETAR: ...] permiten simular la asignacion de sprints y estimaciones de esfuerzo en cada ciclo de desarrollo.

## 1. Matriz de Control de Epicas e Historias de Usuario

---

| Epica ID | Nombre de la Epica | User Story ID | Titulo de la Historia de Usuario | Perfil / Rol | Estado / Sprint |
| --- | --- | --- | --- | --- | --- |
| EP-01 | Emision Primaria y Billetera Digital | US-01 | Compra de Cupón en Checkout Primario | Consumidor Pragmatico | [COMPLETAR: SPRINT_ID] |
| EP-01 | Emision Primaria y Billetera Digital | US-02 | Generacion de QR Dinamico para Canje Físico | Consumidor Pragmatico | [COMPLETAR: SPRINT_ID] |
| EP-02 | Mercado P2P y Motor de Ordenes | US-03 | Publicacion de Cupón en Mercado P2P | Consumidor Estratega (Trader) | [COMPLETAR: SPRINT_ID] |
| EP-02 | Mercado P2P y Motor de Ordenes | US-04 | Compra de Cupón en Mercado Secundario | Consumidor Estratega (Trader) | [COMPLETAR: SPRINT_ID] |
| EP-03 | Administracion White-Label y Parametrización | US-05 | Configuración de Bandas de Precio y Take-Rates | Administrador del Tenant (B2B) | [COMPLETAR: SPRINT_ID] |
| EP-03 | Administracion White-Label y Parametrización | US-06 | Validacion TPV y Liberacion de Fondos Escrow | Operador de Tienda / Comercio | [COMPLETAR: SPRINT_ID] |

## 2. Desglose Detallado de Historias de Usuario y Criterios BDD

---

### US-01: Compra de Cupón en Checkout Primario

Como Consumidor Pragmatico,

Quiero adquirir un cupón de reserva directamente en la tienda online del comercio,

Para asegurar mi derecho de acceso o adquisición del bien/servicio en mi billetera digital.

```gherkin
Scenario: Compra exitosa de cupón con ingreso de fondos a Escrow
  Given Dado que el usuario selecciona un producto habilitado para SMCTA con valor nominal de $100.00
  And la cuenta del usuario esta autenticada y con correo verificado
  When realiza el pago mediante la pasarela de pagos configurada
  Then el sistema emite un activo digital en estado "EN_WALLET"
  And transfiere $100.00 a la cuenta de custodia "Escrow Account" del Tenant
  And el cupón se visualiza de forma inmediata en la Billetera Digital del usuario.

Scenario: Rechazo de pago en checkout primario
  Given Dado que el usuario intenta pagar un cupón en el checkout
  When la pasarela de pagos rechaza la transaccion por fondos insuficientes
  Then el sistema NO emite el activo digital
  And muestra una alerta clara indicando la falla del pago sin alterar inventario.
```

### US-02: Generacion de QR Dinamico para Canje Físico

Como Consumidor Pragmatico o Tenedor Final,

Quiero visualizar un codigo QR dinamico y encriptado en mi billetera digital,

Para presentarlo en el establecimiento y validar mi canje sin riesgo de duplicacion o captura de pantalla.

```gherkin
Scenario: Generacion correcta de token de canje dinamico
  Given Dado que el usuario posee un cupón en estado "EN_WALLET"
  When abre la vista de detalle del cupón en la Billetera Digital
  Then el sistema genera un codigo QR dinamico con un token encriptado
  And el codigo QR rota automaticamente cada 30 segundos
  And deshabilita la opcion de captura de pantalla en la interfaz movil.

Scenario: Intento de generacion de QR para cupón publicado en P2P
  Given Dado que el usuario tiene un cupón en estado "PUBLICADO_P2P"
  When intenta abrir la vista de canje del cupón
  Then el sistema bloquea la visualizacion del QR
  And muestra un mensaje: "El cupón esta en oferta P2P. Cancele la publicacion para habilitar el canje".
```

### US-03: Publicacion de Cupón en Mercado P2P

Como Consumidor Estratega (Trader),

Quiero publicar mi cupón en el libro de ordenes P2P fijando un precio de reventa,

Para transferir mi reserva a otro usuario y recuperar o rentabilizar mi capital.

```gherkin
Scenario: Publicacion exitosa dentro de la banda permitida (Price Collar)
  Given Dado que el usuario posee un cupón en estado "EN_WALLET" con valor nominal de $100.00
  And el Tenant tiene un Price Collar parametrizado con Piso=50% ($50.00) y Techo=200% ($200.00)
  When el usuario ingresa un precio de venta de $140.00 y confirma la publicacion
  Then el sistema transiciona el estado del cupón a "PUBLICADO_P2P"
  And la orden se registra en el libro de ofertas visible para la comunidad.

Scenario: Rechazo de orden por violacion del Techo de Precio
  Given Dado que el usuario posee un cupón con valor nominal de $100.00
  And el Techo de Precio maximo esta fijado en $200.00
  When el usuario intenta publicar la orden a $250.00
  Then el sistema rechaza la solicitud de publicacion
  And muestra un error: "El precio excede el limite maximo permitido de $200.00".
```

### US-04: Compra de Cupón en Mercado Secundario

Como Consumidor Estratega o Usuario Tardío,

Quiero adquirir un cupón ofertado en el mercado secundario P2P,

Para obtener una reserva agotada en la venta primaria.

```gherkin
Scenario: Compra P2P exitosa con recalculo de comisiones y re-emisión
  Given Dado que existe una orden activa en estado "PUBLICADO_P2P" por un precio de $150.00
  And las comisiones son TakeRate_Vendedor=3.5% y TakeRate_Comprador=2.5%
  When un segundo usuario confirma la compra y paga el monto total de $153.75 ($150 + $3.75 fee)
  Then el sistema acredita $144.75 ($150 - $5.25 fee) al vendedor
  And asigna $9.00 netos a la cuenta de comisiones del comercio
  And invalida el token del vendedor anterior
  And emite un nuevo token en estado "EN_WALLET" para el comprador.
```

### US-05: Configuración de Bandas de Precio y Take-Rates (Panel B2B)

Como Administrador del Tenant (Comerciante),

Quiero ajustar los porcentajes de comisiones y los limites de reventa desde un panel de control,

Para adaptar el mercado P2P a las condiciones de mi negocio y proteger la marca.

```gherkin
Scenario: Modificacion exitosa de parametros de mercado
  Given Dado que el Administrador esta autenticado en el Dashboard B2B
  When modifica el TakeRate_Vendedor a 4.0% y guarda los cambios
  Then el sistema actualiza la parametrización en tiempo real
  And las nuevas ordenes P2P calculan las deducciones aplicando el 4.0%.
```

### US-06: Validacion TPV y Liberacion de Fondos Escrow

Como Operador de Tienda / TPV,

Quiero escanear el codigo QR del cliente en el punto de venta,

Para validar la autenticidad del cupón, entregar el stock y liberar el pago custodiado.

```gherkin
Scenario: Canje presencial exitoso en punto de venta
  Given Dado que un cliente presenta un QR correspondiente a un cupón en estado "EN_WALLET"
  When el operador escanea el codigo QR desde la aplicacion TPV
  Then el sistema valida la firma criptografica
  And cambia el estado del cupón a "CANJEADO"
  And emite un evento Webhook que transfiere el 100% del deposito primario en Escrow a la caja del comercio.
```

## 3. Formulario de Control y Firma de Aceptación de Requisitos (Fase 02)

---

Espacio reservado para certificar la finalización y aprobación de todos los requisitos funcionales de la Fase 02.

ACTA DE CIERRE Y APROBACIÓN DE FASE 02 - ESPECIFICACIÓN DE REQUISITOS Y NEGOCIO

Los cuatro documentos que componen la Fase 02 (DOC-SMCTA-REQ-001, DOC-SMCTA-REQ-002, DOC-SMCTA-REQ-003 y DOC-SMCTA-REQ-004) han sido revisados y aprobados, quedando fijados como la linea base de requisitos funcionales para el equipo de desarrollo de software.

Product Owner / PM: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Scrum Master / Lead Dev: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
