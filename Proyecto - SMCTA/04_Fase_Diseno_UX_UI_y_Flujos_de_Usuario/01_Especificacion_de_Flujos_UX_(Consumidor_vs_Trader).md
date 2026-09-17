# Especificacion de Flujos UX (Consumidor vs. Trader)

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario  
> **Codigo de Documento:** DOC-SMCTA-UX-001  
> **Estado:** Especificacion de Experiencia de Usuario v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento especifica los mapas de viaje del usuario (*User Journeys*), arquitectura de informacion y wireframes conceptuales diferenciados para el **Consumidor Pragmatico** (compra y canje convencional) y el **Consumidor Estratega / Trader** (reventa P2P y monitoreo de ofertas). Los diagramas visuales e interfaces gráficas se referencian hacia la subcarpeta correspondiente del Drive Compartido. Los bloques demarcados como [COMPLETAR: ...] permiten simular métricas de usabilidad e itinerarios de pruebas UX por Tenant.

## 1. Arquitectura de Navegacion y Mapa de Pantallas (Information Architecture)

---

La interfaz de usuario White-Label se desacopla en dos vistas principales de interacción según el perfil de intencionalidad del usuario final:

| Modulo de Navegacion | Perfil Principal | Pantallas y Micro-Interacciones Clave |
| --- | --- | --- |
| Modo Tienda Primaria (E-Commerce Storefront) | Consumidor Pragmatico | Ficha de Producto con Selector "Compra Directa" vs. "Reserva Especulativa P2P".Checkout de Emision Primaria con confirmacion de deposito en custodia Escrow.Billetera Digital (*Wallet*) con tarjeta de cupón y codigo QR dinamico. |
| Modo Mercado Secundario (P2P Hub) | Consumidor Estratega (Trader) | Libro de Ordenes P2P (*Order Book*) con listado de ofertas activas y filtros.Formulario de Publicacion P2P con validacion visual de Banda de Precios (*Price Collar*).Calculadora de Comisiones en vivo (desglose de Fee Vendedor/Comprador).Historial de Transacciones P2P y Balance Acumulado. |

## 2. Estructura y Marcadores de Diagramas UX (Wireframes & User Journeys)

---

Los diagramas de flujos de pantallas y wireframes conceptuales deben ubicarse en la subcarpeta 📁 04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario/Diagramas_UX/ del Drive Compartido:

### 2.1. Mapa de Flujo del Consumidor Pragmatico (User Journey: Compra y Canje)

Detalla el recorrido desde la seleccion del producto en tienda, confirmacion de pago, almacenamiento en Wallet y escaneo de QR en el punto de venta TPV.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario/Diagramas_UX/01_User_Journey_Consumidor_Pragmatico.png`  
> *(Subir aquí el diagrama de flujo de pantalla para compra primaria y canje QR)*

### 2.2. Mapa de Flujo del Consumidor Estratega (User Journey: Reventa P2P)

Detalla la experiencia de publicacion en el libro de ordenes P2P, alertas de variacion de precio, ejecucion del match y acreditación de fondos.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario/Diagramas_UX/02_User_Journey_Trader_P2P.png`  
> *(Subir aquí el diagrama de flujo de pantalla para publicacion y compra en Mercado P2P)*

## 3. Especificacion de Wireframes y Patrones de Interaccion

---

### 3.1. Pantalla A: Wallet Digital de Cupones (Vista de Canje)

- Componente Principal: Tarjeta de activo con contador regresivo de expiración y boton destacado "Generar QR de Canje".
- Patron de Seguridad UX: Al presionar el boton, la pantalla incrementa el brillo al 100%, deshabilita capturas de pantalla (*screenshot prevention*) y despliega un QR dinamico que rota un token criptografico cada 30 segundos.
- Estado Bloqueado P2P: Si el cupón esta publicado en el mercado secundario, la tarjeta reemplaza el boton de QR por una etiqueta informativa: Cupón en Venta P2P ($140.00) - Cancelar Orden para Canjear.

### 3.2. Pantalla B: Formulario de Publicacion P2P (Marketplace Modal)

- Control de Rango (Price Collar Slider): Barra deslizante que limita la entrada de precio exclusivamente dentro del rango $[P_{min}, P_{max}]$ configurado por el comercio (ej. entre $50.00 y $200.00).
- Desglose Transparente de Comisiones:

- Precio de Venta Ingresado: $150.00
- Comisión por Servicio Vendedor (3.5%): -$5.25
- Monto Neto a Recibir: $144.75

## 4. Registro de Pruebas de Usabilidad e Itinerarios UX

---

Plantilla para documentar los resultados de las sesiones de pruebas de usabilidad con usuarios finales.

| Prueba / Escenario UX | Metrica de Exito (KPI) | Resultado Registrado |
| --- | --- | --- |
| Tiempo Medio de Compra Primaria: | Menos de 45 segundos en Checkout. | [COMPLETAR: TIEMPO_REGISTRADO] |
| Comprension de Bloqueo QR por P2P: | > 90% de usuarios entienden la restriccion. | [COMPLETAR: PORCENTAJE_TASA] |
| Facilidad de Publicacion P2P: | Menos de 3 clics desde la Billetera. | [COMPLETAR: PASOS_OBSERVADOS] |

## 5. Anexo: Formulario de Firma y Aprobacion de Especificacion UX

---

Espacio reservado para certificar la validacion de las especificaciones UX/UI por el equipo de diseño y producto.

ACTA DE APROBACIÓN TÉCNICA - ESPECIFICACIÓN DE FLUJOS UX

Los mapas de flujo, patrones de interaccion y especificaciones de pantalla quedan aprobados para guiar la creacion de la Guía de Componentes UI White-Label.

Lider de Diseño UX/UI: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Lider de Producto / PM: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
