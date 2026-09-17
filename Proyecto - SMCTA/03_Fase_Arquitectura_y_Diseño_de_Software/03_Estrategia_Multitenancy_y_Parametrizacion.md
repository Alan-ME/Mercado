# Estrategia Multitenancy y Parametrizacion

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 03_Fase_Arquitectura_y_Diseño_de_Software  
> **Codigo de Documento:** DOC-SMCTA-ARQ-003  
> **Estado:** Especificacion de Arquitectura Multi-Inquilino v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento especifica la estrategia de aislamiento multi-inquilino (*Multi-Tenancy*), resolucion dinamica de contexto B2B y parametrizacion en tiempo real para el software White-Label SMCTA P2P. Se adopta la arquitectura de aislacion lógica discriminada por fila (*Discriminator Column*) con soporte para esquemas dedicados. Los diagramas de arquitectura de red multi-tenant se referencian hacia la subcarpeta correspondiente del Drive. Los bloques demarcados como [COMPLETAR: ...] simulan la configuracion de infraestructura y subdominios B2B.

## 1. Estrategia de Aislamiento Multi-Tenant (Isolation Model)

---

Para garantizar que multiples comerciantes (Tenants) operen sobre la misma plataforma SaaS de forma segura, aislada y eficiente en costes, SMCTA adopta una estrategia híbrida basada en tres pilares de arquitectura:

| Capa de Arquitectura | Estrategia Seleccionada | Mecanismo Técnico de Aislamiento |
| --- | --- | --- |
| Base de Datos Relacional | Discriminator Column / Row-Level Security (RLS) | Cada consulta SQL incluye obligatoriamente WHERE tenant_id = '...' en el ORM/Driver. En entornos de alta seguridad se activa PostgreSQL RLS para prevencion de fugas de datos. |
| Cache & PubSub (Redis) | Key Namespacing Separado | Todas las claves del libro de ordenes P2P y sesiones se prefijan mediante tenant:{tenant_id}:orderbook. |
| Capa de Computo (API Gateway) | Context Middleware Resolver | El Gateway intercepta la cabecera HTTP X-Tenant-ID o el subdominio (ej. ticketera.smcta.io) e inyecta el contexto en el Request Pipeline. |

## 2. Estructura y Marcadores de Diagramas Multi-Tenant

---

Los esquemas graficos de resolucion de subdominios y aislamiento de red deben ubicarse en la subcarpeta 📁 03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_Multitenancy/ del Drive Compartido:

### 2.1. Diagrama de Flujo de Resolucion Multi-Tenant (Tenant Resolution Flow)

Muestra el viaje de una peticion HTTP desde el DNS del subdominio B2B, pasando por el API Gateway, la inyección del contexto TenantContext y el filtrado en base de datos.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_Multitenancy/01_Diagrama_Resolucion_Contexto_Tenant.png`  
> *(Subir aquí el diagrama de flujo de resolución de subdominio y enrutamiento Multi-Tenant)*

## 3. Implementacion Tecnica del Middleware de Contexto (Express / Node.js)

---

```typescript
// MIDDLEWARE DE RESOLUCION DE TENANT (NODE.JS / EXPRESS)
import { Request, Response, NextFunction } from 'express';
import { db } from '../database';

export const tenantResolverMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extraccion por Subdominio o Cabecera Personalizada
        const host = req.headers.host || '';
        const tenantHeader = req.headers['x-tenant-id'] as string;
        
        let tenantSubdomain = host.split('.')[0]; // Ej: 'eventos' de 'eventos.smcta.com'
        
        // 2. Consulta en Cache/DB
        const tenant = await db.tenants.findFirst({
            where: {
                OR: [
                    { subdomain: tenantSubdomain },
                    { tenant_id: tenantHeader }
                ]
            }
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant B2B no encontrado o inactivo' });
        }

        // 3. Inyección en el Contexto de la Petición
        req.tenantContext = {
            tenantId: tenant.tenant_id,
            sellerFee: tenant.seller_take_rate,
            buyerFee: tenant.buyer_take_rate,
            priceFloorPct: tenant.price_floor_pct,
            priceCeilingPct: tenant.price_ceiling_pct
        };

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Falla al resolver el contexto Multi-Tenant' });
    }
};
```

## 4. Registro de Aprovisionamiento y Mapeo de Subdominios B2B

---

Plantilla para documentar el registro de clientes B2B (*Tenants*) activos en la plataforma.

| Identificador Tenant | Subdominio Asignado | Dominio Personalizado (CNAME) | Estado de Instancia |
| --- | --- | --- | --- |
| TENANT-PROD-001 | ticketera.smcta.io | entradas.eventos.com | [COMPLETAR: ACTIVO / INACTIVO] |
| TENANT-PROD-002 | sneakers.smcta.io | drops.urbanfashion.com | [COMPLETAR: ACTIVO / INACTIVO] |
| TENANT-DEV-TEST | sandbox.smcta.io | N/A (Entorno de Pruebas) | [COMPLETAR: ACTIVO / INACTIVO] |

## 5. Anexo: Formulario de Cierre y Aprobación de la Fase 03

---

Con este documento se concluye la **Fase 03 de Arquitectura y Diseño de Software**, dejando el sistema 100% especificado en sus componentes de microservicios, esquemas relacionales SQL y estrategia multi-inquilino.

ACTA DE CIERRE Y APROBACIÓN DE FASE 03 - ARQUITECTURA Y DISEÑO DE SOFTWARE

Los tres documentos que integran la Fase 03 (DOC-SMCTA-ARQ-001, DOC-SMCTA-ARQ-002 y DOC-SMCTA-ARQ-003) han sido revisados y aprobados por la jefatura técnica para dar inicio a las fases de UX/UI y Desarrollo.

Arquitecto de Software Lead: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Director de Ingeniería / CTO: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
