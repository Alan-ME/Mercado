# Guia de Componentes UI WhiteLabel

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario  
> **Codigo de Documento:** DOC-SMCTA-UX-002  
> **Estado:** Guia de Sistema de Diseño White-Label v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento especifica el sistema de componentes de interfaz de usuario (*Design System White-Label*), la arquitectura de tematizacion dinamica mediante tokens CSS/Tailwind y las pautas de accesibilidad para los widgets embebibles de SMCTA P2P. Las vistas previas graficas y componentes de Figma se referencian hacia la subcarpeta correspondiente del Drive Compartido. Los bloques demarcados como [COMPLETAR: ...] simulan la configuracion de estilos y paletas de marca por Tenant.

## 1. Sistema de Tematizacion Dinamica (Design Tokens & CSS Variables)

---

Para permitir que la interfaz del mercado P2P se adapte visualmente de forma instantanea a la identidad visual de cualquier comercio (Tenant), el frontend expone una capa de variables de estilo sobre el marco de diseño (*Tailwind / CSS Variables*):

| Token de Diseño | Variable CSS Global | Valor Por Defecto SMCTA | Proposito de Interfaz |
| --- | --- | --- | --- |
| color-primary | --smcta-brand-primary | #1A365D (Azul Corporativo) | Botones de accion principal, encabezados de tarjetas y navegacion. |
| color-accent | --smcta-brand-accent | #3182CE (Azul Brillante) | Highlights de precios P2P, estados activos y badges de plusvalia. |
| color-surface | --smcta-brand-surface | #FFFFFF / #F7FAFC | Fondos de tarjetas de cupones, contenedores y modales. |
| border-radius | --smcta-border-radius | 8px (Esquinas redondeadas) | Curvatura de botones, tarjetas de wallet e inputs de formularios. |
| font-family | --smcta-font-family | Arial, sans-serif | Tipografia base heredada del e-commerce anfitrión. |

## 2. Estructura y Marcadores de Componentes UI (Design System Assets)

---

Los componentes graficos y vistas de Figma exportadas deben ubicarse en la subcarpeta 📁 04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario/Componentes_UI/ del Drive Compartido:

### 2.1. Kit de Componentes Frontend White-Label (UI Component Kit)

Muestra los estados atomicos de botones, badges de estado del cupón (EN_WALLET, PUBLICADO_P2P, CANJEADO), tarjetas de activos y controles de deslizamiento (*Price Collar Slider*).

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `04_Fase_Diseño_UX_UI_y_Flujos_de_Usuario/Componentes_UI/01_Kit_Componentes_WhiteLabel_Figma.png`  
> *(Subir aquí la vista exportada del Kit de Componentes UI de Figma)*

## 3. Especificacion de Componentes Reutilizables (Core Widgets)

---

### 3.1. Componente A: Badge de Estado del Activo (Status Pill Widget)

- ST-02 EN_WALLET: Fondo Verde Claro (#DEF7EC) / Texto Verde Oscuro (#03543F). Indica cupón listo para canje.
- ST-03 PUBLICADO_P2P: Fondo Amarillo Claro (#FEF08A) / Texto Cafe Oscuro (#713F12). Indica cupón ofertado en el mercado secundario.
- ST-04 CANJEADO: Fondo Gris (#E5E7EB) / Texto Gris Oscuro (#374151). Estado final inactivo.

### 3.2. Componente B: Slider de Rango de Precio P2P (Price Collar Control)

Control interactivo que impide la entrada manual de valores fuera de la banda de precios. Muestra en tiempo real la advertencia de cumplimiento de la regla RN-02:

- Indicador Inferior: Piso de Descuento ($50.00)
- Indicador Superior: Techo de Apreciacion ($200.00)
- Feedback Visual: Si el usuario intenta escribir un monto fuera del rango, el borde del input cambia a rojo (#EF4444) y bloquea el boton "Confirmar Publicación".

## 4. Ficha de Registro de Tematizacion por Tenant B2B

---

Plantilla para documentar la configuracion de estilos y colores personalizados aplicados a una marca B2B específica.

| Parametro de Diseño B2B | Valor de Ejemplo Tenant | Registro Real del Tenant |
| --- | --- | --- |
| Nombre del Tenant B2B: | Urban Fashion Drops Ltd. | [COMPLETAR: NOMBRE_TENANT] |
| Color Primario de Marca: | #111827 (Negro Matte) | [COMPLETAR: HEX_COLOR_PRIMARIO] |
| Color Secundario / Acento: | #10B981 (Verde Esmeralda) | [COMPLETAR: HEX_COLOR_ACENTO] |
| Logo de Marca White-Label (Header): | https://cdn.tenant.com/logo.svg | [COMPLETAR: URL_LOGO_SVG] |

## 5. Anexo: Formulario de Cierre y Aprobación de la Fase 04

---

Con este documento se concluye formalmente la **Fase 04 de Diseño UX/UI y Flujos de Usuario**, dejando la experiencia de usuario y la guia de componentes White-Label totalmente definidas.

ACTA DE CIERRE Y APROBACIÓN DE FASE 04 - DISEÑO UX/UI Y FLUJOS DE USUARIO

Los dos documentos que integran la Fase 04 (DOC-SMCTA-UX-001 y DOC-SMCTA-UX-002) han sido revisados y aprobados por el equipo de diseño y producto para dar inicio a la Fase 05 de Gestion de Proyecto y Roadmap.

Lider de Diseño UI/UX: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Lider de Producto / PM: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
