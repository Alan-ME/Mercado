# Definición de Sectores y Casos de Uso Objetivo

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 01_Fase_Estrategia_y_Rediseño_de_Modelo  
> **Código de Documento:** DOC-SMCTA-EST-003  
> **Estado:** Especificación Estratégica de Mercado Objetivo v1.0  

> ℹ️ **Nota General de Plantilla y Recomendación Técnica:**  
> Este documento formaliza la delimitación de sectores comerciales aptos y no aptos para la implementación de la plataforma White-Label SMCTA P2P. La especificación adopta el camino de segmentación más recomendado para maximizar el valor de la reventa P2P y proteger la reputación e inventario de los clientes B2B. Los bloques demarcados con [COMPLETAR: ...] permiten simular la validación directa de cada nuevo caso de uso o sector comercial antes de su integración técnica.

## 1. Marco de Evaluacion y Criterios de Aptitud P2P

---

Para evitar que el modelo "agnóstico" choque contra la realidad física y comercial de ciertos inventarios (como se demostró en la auditoría técnica inicial con inventarios perecederos o sin escasez), SMCTA P2P establece cuatro vectores de evaluación obligatorios para habilitar un catálogo B2B:

1. Inelasticidad / Escasez Crítica: La oferta física o la capacidad del servicio debe ser finita en un marco temporal definido. Si la oferta se puede reponer instantáneamente sin límite, no existe incentivo orgánico para un mercado secundario P2P.
2. Perecederidad Controlada (Sensibilidad al Tiempo): El activo debe tener una fecha límite de uso bien definida (ej. fecha de concierto o check-in) o un ciclo de escasez programado (ej. preventa limitada). No debe ser un producto de degradación física diaria inmediata sin margen de re-comercialización.
3. Propensión a la Plusvalía Orgánica: El bien o servicio debe generar un deseo de compra secundario donde la demanda de última hora supere a la oferta del mercado primario.
4. Baja Fricción Logística de Transferencia: El activo debe poder transferirse digitalmente en milisegundos mediante reasignación de tokens o códigos QR dinámicos, sin requerir envíos físicos complejos durante la ventana P2P.

## 2. Matriz de Segmentación de Sectores y Casos de Uso

---

| Sector / Vertical | Nivel de Aptitud | Caso de Uso Tipificado | Estructura de Ventana y Parámetros P2P Recomendados |
| --- | --- | --- | --- |
| Boletería y Entradas (Eventos, Festivales, Deportes) | Tier 1: Óptimo (Core) | Preventa exclusiva de cupos agotados (*Sold Out*) con reventa P2P regulada. | Ventana: Hasta 2 horas antes del evento. <br> Price Collar: Piso 70% / Techo 250% <br> Take-Rate recomendado: 5% total. |
| Coleccionables y Ediciones Limitadas (Sneakers, Moda, Vinos) | Tier 1: Óptimo (Core) | Lotes exclusivos numerados en modalidad *Drop* con entrega física diferida. | Ventana: 7 a 14 días (durante la fase de producción/envío). <br> Price Collar: Piso 80% / Techo 300% <br> Take-Rate recomendado: 6% total. |
| Hotelería de Alta Temporada y Escapadas Exclusivas | Tier 2: Apto con Restricción | Reservas no reembolsables de fin de semana en fechas de ocupación 100%. | Ventana: Cierre obligatorio 72h antes del check-in. <br> Price Collar: Piso 60% / Techo 180% <br> Take-Rate recomendado: 4% total. |
| Cursos, Workshops y Membresías de Cupo Limitado | Tier 2: Apto con Restricción | Matrículas o plazas de formación ejecutiva con acceso restringido. | Ventana: Hasta 24h antes del inicio del curso. <br> Price Collar: Piso 80% / Techo 150% <br> Take-Rate recomendado: 4% total. |
| Retail General / Productos Recurrentes (Zapatillas de Línea, Café) | NO APTO (Descartado) | Inventario estándar de rotación continua y reposición masiva. | Deshabilitado: Riesgo de canibalización de venta primaria y falta de demanda secundaria. |
| Gastronomía Diaria / Alimentos Perecederos | NO APTO (Descartado) | Menús diarios, reservas de mesa estándar o insumos perecederos. | Deshabilitado: Cero valor de salvamento y altísimo riesgo de desabastecimiento. |

## 3. Análisis Detallado de Casos de Uso Prioritarios (Tier 1)

---

### 3.1. Caso de Uso A: Eventos y Festivales (Boletería de Alta Demandada)

En el sector de espectáculos, la reventa informal no regulada (*scalping*) captura millones de dólares en plusvalía sin dejar retorno al organizador y exponiendo a los usuarios a estafas. Con SMCTA P2P:

- Mecánica: El organizador emite cupones/entradas digitales. Al agotarse la fase primaria, los usuarios que no pueden asistir publican su derecho de acceso en el mercado P2P nativo de la ticketera.
- Beneficio B2B: El organizador captura un *take-rate* (ej. 5%) sobre cada reventa, garantizando autenticidad total mediante invalida-ción del QR anterior y emisión de un nuevo token para el comprador secundario.

### 3.2. Caso de Uso B: Drops de Ediciones Limitadas (Retail de Coleccionables)

Marcas de moda urbana, calzado deportivo de edición limitada o lotes de vinos de autor sufren especulación en plataformas externas (StockX, GOAT):

- Mecánica: La marca vende un "Cupón de Adquisición" previo a la fabricación o despacho del producto físico. Los usuarios negocian la reserva en el libro P2P interno mientras el producto se empaqueta.
- Beneficio B2B: La marca no solo vende la totalidad de su lote el Día 1, sino que monetiza el tráfico especulativo secundario dentro de su propio e-commerce White-Label.

## 4. Formulario de Validación para Nuevos Sectores (Tenant Onboarding)

---

Espacio en formato de plantilla para evaluar la viabilidad de nuevos clientes B2B que soliciten implementar el software SMCTA.

| Criterio de Evaluación B2B | Pregunta de Control | Registro de Evaluación del Tenant |
| --- | --- | --- |
| Nombre de la Empresa / Producto: | ¿Qué marca o catálogo solicita la integración P2P? | [COMPLETAR: NOMBRE_MARCA_B2B] |
| Análisis de Escasez: | ¿El inventario está acotado físicamente a menos de 1,000 unidades o cupos? | [COMPLETAR: SI / NO - CANTIDAD_LIMITADA] |
| Plazo de Caducidad: | ¿Existe una fecha de vencimiento bien delimitada? | [COMPLETAR: FECHA_O_DURACION_VENTANA] |
| Nivel de Riesgo Operativo: | ¿El no-canje del cupón genera pérdidas irreparables de stock? | [COMPLETAR: EVALUACIÓN_RIESGO_PERMITIDO] |
| Dictamen de Viabilidad SMCTA: | ¿Aprobado para despliegue P2P? | [COMPLETAR: APROBADO / RECHAZADO] |

## 5. Anexo: Cierre y Aprobación de la Fase 01 (Estrategia y Rediseño)

---

Con este documento se concluye la **Fase 01 de Estrategia y Rediseño de Modelo**. A partir de este hito, el proyecto cuenta con el blindaje legal-financiero, el diseño conceptual P2P v2 y la delimitación estricta de mercados objetivos.

ACTA DE CIERRE DE FASE 01 - ESTRATEGIA Y REDISEÑO DE MODELO

Los tres documentos de la Fase 01 (DOC-SMCTA-EST-001, DOC-SMCTA-EST-002 y DOC-SMCTA-EST-003) quedan formalmente integrados en el workspace del proyecto como marco conceptual definitivo para las fases de Requisitos, Arquitectura y Desarrollo.

Aprobado por Liderazgo Estratégico: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
