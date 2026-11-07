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
| Modo Tienda Primaria (E-Commerce Storefront) | Consumidor Pragmatico | Ficha de Producto con **Gráfico de Demanda y Actividad P2P (`1D / 1S / 1M`)**, cupones ofrecidos/buscados, trueques frecuentes y precio fijo de carta. Checkout de Emisión Primaria con depósito en custodia Escrow. Billetera Digital (*Wallet*) con QR dinámico y contador de Créditos Gold Disponibles y Pendientes. |
| Modo Mercado Secundario (P2P Hub + Item Changer + Gold Area) | Consumidor Estratega (Trader) | **Tablero de Permuta P2P Libre (Sin Precios Monetarios)**: muestra exclusivamente el Producto Ofrecido $\leftrightarrow$ Producto Buscado (foto, nombre y categoría) y el bonus de **Créditos Gold (`+G`)** desbloqueable al canjear en TPV. **Item Changer (Doble Columna)** para productos descontinuados con incentivo $\beta_{\text{disc}} = +15\%$. **Gold Area** para canjear Créditos Gold desbloqueados por combos y promociones. |

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

### 3.2. Pantalla B: Modal de Ficha de Producto (`ProductDetailModal`) y Tablero de Permuta P2P Sin Precios

- **Gráfico de Demanda y Popularidad en lugar de Fluctuación de Precio (`ProductDetailModal.tsx`):** Dado que en el modelo v2.2 el precio de carta es fijo y el mercado secundario opera por trueque de productos sin dinero, el gráfico curvo (`1D / 1S / 1M`) representa el **volumen de pedidos y actividad de trueques P2P** (sin signos monetarios en el eje vertical). La ficha técnica lateral informa:
  - **Pedidos y trades hoy:** ej. `178` (`+18% DEMANDA HOY`).
  - **Ofrecidos en P2P:** cantidad de cupones disponibles para trueque inmediato.
  - **Lo buscan en P2P:** cantidad de usuarios interesados en recibir este ítem.
  - **Se cambia mucho por:** productos más frecuentes en permutas mano a mano (ej. `Combo Medialuna · Affogato`).
  - **Recompensa al tradear:** ej. `+55 G (al canje TPV)`.
- **Regla UX de Omisión de Precios en el Intercambio P2P:** En la vista de intercambio P2P entre usuarios **no se muestran precios en dólares/moneda** sobre los cupones; se visualiza únicamente la tarjeta visual del producto que se entrega, el producto que se recibe y la recompensa de **Créditos Gold (`+G`)** que se desbloqueará cuando el receptor escanee el QR en la barra. Esto elimina el freno psicológico de comparar precios nominales distintos y centra la decisión en el deseo real de consumo gastronómico.
- **Pantalla C — Item Changer (Productos Descontinuados) y Gold Area (Combos por Créditos):**
  - **Item Changer (Doble Columna estilo KeyDrop):** Exclusivo para cupones cuyo producto fue marcado como `DISCONTINUED`. El panel izquierdo recibe el ítem retirado y el panel derecho permite filtrar y elegir un producto activo equivalente aplicando el incentivo por descontinuación ($\beta_{\text{disc}} = +15\%$).
  - **Gold Area:** Grilla de tarjetas promocionales y combos especiales con su costo expresado en **Créditos Gold (`480 G`, `680 G`, `1200 G`)**, canjeables únicamente con créditos ya desbloqueados tras el consumo físico en el TPV.

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
