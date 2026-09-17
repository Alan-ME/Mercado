# Hoja de Ruta - Rol 2: Ingeniero de Frontend White-Label, Billetera Digital y UX/UI

> **Rol:** Lead Frontend & UX/UI White-Label Engineer  
> **Área:** Experiencia de Usuario, Billetera Digital, Marketplace P2P y Sistema de Diseño Dinámico  
> **Objetivo:** Desarrollar una interfaz web/mobile moderna, reactiva y personalizable por Tenant en tiempo real, implementando la rotación de QR dinámico para canje y el control interactivo de bandas de precio P2P.

---

## 1. Documentación Base de Contexto (Lectura Obligatoria para tu IA)

Proporciona a tu IA asistente los siguientes documentos ubicados en el repositorio:
1. `05_Fase_Gestion_de_Proyecto_y_Roadmap/Hojas_de_Ruta_Distribuidas/00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md` (Estructura de DTOs, tokens y endpoints).
2. `04_Fase_Diseno_UX_UI_y_Flujos_de_Usuario/01_Especificacion_de_Flujos_UX_(Consumidor_vs_Trader).md` (Wireframes, arquitectura de información y patrones UX).
3. `04_Fase_Diseno_UX_UI_y_Flujos_de_Usuario/02_Guia_de_Componentes_UI_WhiteLabel.md` (Tokens de diseño, variables CSS y widgets core).
4. `02_Fase_Especificacion_de_Requisitos_y_Negocio/04_Historias_de_Usuario_y_Criterios_de_Aceptacion.md` (US-01 a US-04 con escenarios Gherkin).
5. `02_Fase_Especificacion_de_Requisitos_y_Negocio/01_Documento_de_Vision_y_Alcance_Actualizado_(P2P).md` (Perfiles Consumidor Pragmático vs. Estratega).

---

## 2. Stack Tecnológico Recomendado

- **Framework:** React 18+ o Next.js 14+ (App Router) con TypeScript estricto.
- **Estilos & Tematización:** Tailwind CSS configurado con variables CSS personalizadas (`--smcta-brand-primary`, `--smcta-brand-accent`, etc.) para permitir el cambio de marca sin recompilar la app.
- **Gestión de Estado & Caché:** TanStack Query (React Query) para sincronización con el servidor.
- **Desacoplamiento (Mocking):** `Mock Service Worker` (MSW) para simular inmediatamente los endpoints de Rol 1 y no bloquearte.
- **Componentes Criptográficos / QR:** `qrcode.react` o `react-qr-code`.
- **Iconos:** `lucide-react`.
- **Testing:** Vitest + React Testing Library.

---

## 3. Plan de Trabajo por Sprints

### Sprint 6: Arquitectura de Temas, Checkout Primario y Billetera Digital
- **Tarea 2.1:** Configurar la infraestructura del Design System Multi-Tenant:
  - Crear el proveedor de contexto `TenantThemeProvider` que cargue la configuración de marca (`GET /api/v1/tenant/config` o mock inicial) e inyecte dinámicamente las CSS Variables en `:root`.
- **Tarea 2.2 (US-01):** Desarrollar la pantalla y modal de **Checkout Primario**:
  - Selector de producto, resumen de compra con valor nominal ($100.00), visualización de sello de garantía "Custodia en Escrow Segregada" y confirmación de pago.
- **Tarea 2.3 (US-02 / TASK-003):** Construir la vista de **Billetera Digital (Wallet View)**:
  - Listado de tarjetas de cupones con indicador de estado visual (`EN_WALLET`, `PUBLICADO_P2P`, `CANJEADO`).
  - Botón interactivo "Generar QR de Canje".
  - Modal de canje a pantalla completa: cuenta regresiva visual circular de 30 segundos, rotación automática del token criptográfico y llamada para aumentar el brillo de la pantalla.
  - Bloqueo UX: Si el cupón está en `PUBLICADO_P2P`, ocultar el QR y mostrar advertencia con botón para "Cancelar oferta P2P".

### Sprint 7: Marketplace P2P y Slider de Control de Banda de Precios
- **Tarea 2.4 (US-03 / TASK-004):** Modal de **Publicación en Mercado Secundario P2P**:
  - Implementar el componente **Price Collar Slider**: un control deslizante restringido estrictamente entre $[P_{min}, P_{max}]$ (calculado según los porcentajes del tenant, ej. $50.00 a $200.00).
  - Cálculo en tiempo real en la UI del desglose financiero antes de enviar la orden:
    - Precio de venta propuesto ($P_{asking}$)
    - Comisión deducida al vendedor (3.5% = $X.XX)
    - **Total neto que recibirá el vendedor** ($X.XX)
    - Precio final con recargo que verá el comprador (2.5% = $X.XX)
- **Tarea 2.5 (US-04):** Vista del **Libro de Órdenes P2P (Marketplace)**:
  - Lista de ofertas filtradas por producto.
  - Tarjetas de oferta con badges visuales de oportunidad (si el precio está bajo el nominal, badge verde de descuento).
  - Botón de compra instantánea con confirmación de split de comisiones.
  - Manejo elegante de errores concurrentes: si la orden ya fue tomada por otro usuario (HTTP 423), mostrar toast animado: *"Esta orden acaba de ser tomada por otro usuario"*.

### Sprint 8: Pulido UX, Estados de Error y Modo Móvil PWA
- **Tarea 2.6:** Implementar transiciones suaves y microanimaciones (framer-motion o Tailwind transitions) para el cambio de estados del cupón.
- **Tarea 2.7:** Implementar prevención visual de capturas de pantalla (marcas de agua translúcidas con el ID del usuario y timestamp).
- **Tarea 2.8:** Pantalla de historial de transacciones con filtros: Compras primarias, Reventas P2P exitosas y Canjes en tienda.

### Sprint 9: Integración de API Real y Pruebas de Usabilidad
- **Tarea 2.9:** Sustituir la capa de MSW por el cliente HTTP real apuntando al Gateway / Backend Core.
- **Tarea 2.10:** Pruebas de verificación de todos los escenarios BDD de las Historias de Usuario (US-01 a US-04).

---

## 4. Prompt Maestro para Iniciar con tu IA Asistente

Copia y pega el siguiente prompt en tu IA (Claude, ChatGPT, Cursor, etc.):

```text
Actúa como Lead Frontend Developer y Especialista en Sistemas de Diseño UI/UX White-Label. Tu responsabilidad es crear la aplicación web para los usuarios finales de la plataforma SMCTA (Sistema de Mercado Comportamental y Trading de Activos).

CONTEXTO Y REGLAS OBLIGATORIAS:
1. Revisa los contratos de '00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md'. Todas las llamadas a endpoints deben respetar estrictamente los tipos e interfaces allí definidos.
2. Lee la guía de tokens y componentes de '04_Fase_Diseno_UX_UI_y_Flujos_de_Usuario/02_Guia_de_Componentes_UI_WhiteLabel.md' y los wireframes de '04_Fase_Diseno_UX_UI_y_Flujos_de_Usuario/01_Especificacion_de_Flujos_UX_(Consumidor_vs_Trader).md'.
3. Para trabajar de inmediato sin esperar al Backend, configura 'msw' (Mock Service Worker) simulando las respuestas de los endpoints.
4. El sistema debe permitir cambiar de colores y logos en tiempo de ejecución mediante CSS Variables (:root) según la configuración del Tenant.
5. Desarrolla el componente 'PriceCollarSlider' que impida físicamente al usuario ingresar un valor fuera de [P_min, P_max] y calcule en vivo el desglose de comisiones (take-rates de vendedor y comprador).
6. En la vista de billetera, el código QR debe rotar cada 30 segundos con una barra de progreso visual.

OBJETIVO INICIAL:
Comencemos por el Sprint 6. Inicializa el proyecto con React/Next.js y Tailwind CSS, crea la arquitectura de tematización dinámica con CSS Variables y el componente de la Billetera Digital con el QR rotativo dinámico de 30 segundos y mocks de cupones. Proporciona código limpio, tipado y visualmente prémium.
```
