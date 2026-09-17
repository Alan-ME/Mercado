# Hoja de Ruta - Rol 3: Ingeniero de Integración, Infraestructura, Tenant Portal y QA / TPV

> **Rol:** Integration, Multi-Tenant Infrastructure, Admin B2B & QA Automation Lead  
> **Área:** API Gateway, Aislamiento Multi-Tenant, Portal de Administración B2B, Terminal TPV y Suite QA E2E  
> **Objetivo:** Conectar todos los componentes del ecosistema SMCTA, proporcionar las herramientas operativas para comercios (Portal de Configuración B2B y TPV de Canje) y garantizar la calidad técnica integral auditando los criterios del QA Checklist.

---

## 1. Documentación Base de Contexto (Lectura Obligatoria para tu IA)

Proporciona a tu IA asistente los siguientes documentos ubicados en el repositorio:
1. `05_Fase_Gestion_de_Proyecto_y_Roadmap/Hojas_de_Ruta_Distribuidas/00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md` (Contrato maestro de integración).
2. `03_Fase_Arquitectura_y_Diseño_de_Software/01_Especificacion_de_Arquitectura_Tecnica_y_Diagrama_C4.md` (Diagramas C4 y responsabilidades de microservicios).
3. `03_Fase_Arquitectura_y_Diseño_de_Software/03_Estrategia_Multitenancy_y_Parametrizacion.md` (Middleware de resolución de subdominio y aislamiento).
4. `01_Fase_Estrategia_y_Rediseño_de_Modelo/01_Matriz_de_Riesgos_y_Mitigacion_Legal_Financiera.md` (Salvaguardas de custodia y cuentas Escrow).
5. `05_Fase_Gestion_de_Proyecto_y_Roadmap/QA Checklist.xlsx` (Criterios de verificación técnica obligatorios).
6. `02_Fase_Especificacion_de_Requisitos_y_Negocio/04_Historias_de_Usuario_y_Criterios_de_Aceptacion.md` (US-05 Configuración B2B y US-06 Validación TPV).

---

## 2. Stack Tecnológico Recomendado

- **Orquestación Local:** Docker & Docker Compose (PostgreSQL 15, Redis 7, Gateway, Apps).
- **API Gateway & Middleware:** Node.js (TypeScript) con Express o Fastify como proxy inverso y resolutor de contexto.
- **Frontend B2B (Admin & TPV):** React / Vite con Tailwind CSS y lector de cámara HTML5 (`html5-qrcode`).
- **QA Automation & E2E Testing:** Playwright (con soporte BDD `@cucumber/cucumber` o TypeScript nativo).
- **Mocking de Pagos (PSP / Escrow):** Servicio ligero Express para simular webhooks de Stripe/MercadoPago.

---

## 3. Plan de Trabajo por Sprints

### Sprint 6: Infraestructura Docker, Gateway Multi-Tenant y Mock Escrow
- **Tarea 3.1:** Crear el archivo `docker-compose.yml` para levantar PostgreSQL 15, Redis 7 y las variables de entorno de red compartida para que los tres integrantes prueben localmente con un comando (`docker compose up`).
- **Tarea 3.2 (TASK-007):** Implementar el **Middleware de Resolución Multi-Tenant**:
  - Extraer el subdominio desde `req.headers.host` (ej: `eventos.smcta.local`).
  - Si no viene por host, admitir cabecera personalizada `x-tenant-id` (útil para apps móviles y desarrollo local).
  - Consultar en BD o caché de Redis la existencia del tenant.
  - Inyectar el objeto `tenant` en la petición (`req.tenant`) o retornar HTTP 404 (`TENANT_NOT_FOUND`).
  - Reenviar las peticiones al Backend Core (Rol 1) enriquecidas con la cabecera `x-tenant-id`.
- **Tarea 3.3 (TASK-002):** Construir el **Simulador de Pasarela de Pagos y Custodia (PSP Mock)**:
  - Endpoints para simular pagos exitosos y fallidos con disparo de webhooks a `/api/v1/checkout/primary`.

### Sprint 7: Portal de Administración B2B para Clientes Comerciales (US-05)
- **Tarea 3.4 (US-05):** Desarrollar la aplicación web **Tenant Admin Portal**:
  - Panel de control autenticado para administradores de comercio.
  - Formulario de configuración de parámetros de negocio:
    - Comisiones: Take-Rate Vendedor (1% a 10%), Take-Rate Comprador (0% a 10%).
    - Bandas de Precio: Piso Price Collar (10% a 90%), Techo Price Collar (100% a 500%).
    - Límites: Máximo de reventas diarias por usuario (1 a 20), Cierre de ventana en horas previas (1 a 72h).
  - Personalizador de Marca en Vivo: Selectores de color primario, secundario y subida de logotipo con previsualización en tiempo real.
  - Endpoint `PUT /api/v1/admin/tenant/config` para persistir cambios en la tabla `tenants`.

### Sprint 8: Aplicación de Terminal de Punto de Venta (TPV) y Webhook de Liberación (US-06)
- **Tarea 3.5 (US-06 / TASK-008):** Desarrollar la aplicación web **Terminal TPV (Scanner de Canje)**:
  - Vista optimizada para operadores de mostrador o dependientes de tienda.
  - Acceso a la cámara del dispositivo para escanear el código QR del cliente.
  - Envío del token extraído a `POST /api/v1/tpv/validate-qr`.
  - Feedback visual/sonoro: Pantalla verde con sonido de confirmación si el canje es válido, o pantalla roja con motivo de rechazo (cupón vencido, token expirado >30s, o cupón en venta P2P).
- **Tarea 3.6 (TASK-008):** Integrar el Webhook de Liberación de Escrow:
  - Al confirmarse el canje en el TPV, invocar el webhook que transfiere los fondos retenidos en Escrow hacia la cuenta bancaria del comercio.

### Sprint 9: Suite de Automatización QA E2E y Validación del Checklist
- **Tarea 3.7:** Implementar la suite de pruebas E2E automatizadas con Playwright cubriendo todos los criterios del **QA Checklist.xlsx**:
  - **Prueba QA-01 (TASK-004):** Intentar publicar una orden con precio fuera de banda (ej. $250 sobre nominal $100 con techo 200%). Comprobar recepción de código **HTTP 422**.
  - **Prueba QA-02 (TASK-005):** Ejecutar 20 peticiones concurrentes de compra sobre una misma orden P2P abierta. Comprobar que exactamente 1 sea aprobada y 19 sean rechazadas sin duplicidad de cupones ni inconsistencias.
  - **Prueba QA-03 (TASK-006):** Verificar que tras un ciclo completo (Compra Primaria -> Reventa P2P con Plusvalía -> Canje TPV), los asientos de `escrow_ledgers` sumen exactamente las comisiones del comercio, de SMCTA Core y la liberación al comercio.
  - **Prueba QA-04 (TASK-007):** Peticiones con subdominios `festival.smcta.local` y `hotel.smcta.local` deben resolver tenants completamente aislados sin fuga de datos entre sí.
- **Tarea 3.8:** Configurar pipeline de GitHub Actions que ejecute automáticamente la suite E2E en cada Pull Request.

---

## 4. Prompt Maestro para Iniciar con tu IA Asistente

Copia y pega el siguiente prompt en tu IA (Claude, ChatGPT, Cursor, etc.):

```text
Actúa como Ingeniero Principal de Integración, Infraestructura Multi-Tenant y Líder de QA Automation. Tu responsabilidad es coordinar el ecosistema de la plataforma SMCTA (Sistema de Mercado Comportamental y Trading de Activos), desarrollando el API Gateway con resolución de subdominios, el Portal Admin B2B, la aplicación de TPV para canje físico de cupones y la suite de pruebas automatizadas E2E.

CONTEXTO Y REGLAS OBLIGATORIAS:
1. Revisa los contratos y diagramas en '00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md' y '03_Fase_Arquitectura_y_Diseño_de_Software/01_Especificacion_de_Arquitectura_Tecnica_y_Diagrama_C4.md'.
2. El middleware de resolución Multi-Tenant debe seguir la especificación de '03_Fase_Arquitectura_y_Diseño_de_Software/03_Estrategia_Multitenancy_y_Parametrizacion.md'.
3. Desarrolla el Portal Admin B2B (US-05) y la app TPV de canje con lector de cámara QR (US-06).
4. La suite de automatización en Playwright debe validar obligatoriamente los 4 criterios de '05_Fase_Gestion_de_Proyecto_y_Roadmap/QA Checklist.xlsx':
   - TASK-004: HTTP 422 si precio viola Price Collar.
   - TASK-005: Aislamiento atómico en compras P2P concurrentes.
   - TASK-006: Auditoría y cálculo de precisión decimal en escrow_ledgers.
   - TASK-007: Resolución de tenant_id en tiempo de ejecución vía subdominio o cabecera x-tenant-id.

OBJETIVO INICIAL:
Comencemos por el Sprint 6. Genera el archivo 'docker-compose.yml' (PostgreSQL 15, Redis 7, Gateway Express), el middleware de contexto Multi-Tenant con resolución por subdominio y el simulador de pasarela de pagos/escrow mock con webhooks. Proporciona código completo, modular y listo para ejecutar.
```
