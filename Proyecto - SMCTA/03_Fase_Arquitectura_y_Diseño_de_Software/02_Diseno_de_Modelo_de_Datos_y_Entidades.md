# Diseno de Modelo de Datos y Entidades

---

> **Proyecto:** Sistema de Mercado Comportamental y Trading de Activos (SMCTA)  
> **Fase:** 03_Fase_Arquitectura_y_Diseño_de_Software  
> **Codigo de Documento:** DOC-SMCTA-ARQ-002  
> **Estado:** Especificacion de Modelo de Datos Relacional SQL v2.0  

> ℹ️ **Nota General de Plantilla y Recomendacion Tecnica:**  
> Este documento establece el esquema relacional de base de datos (PostgreSQL 15+) estructurado para soportar multi-inquilino (*multi-tenant*), auditoria inmutable de transacciones y el libro de ordenes P2P. Los diagramas Entidad-Relación (ERD) gráficos se referencian hacia la subcarpeta correspondiente del Drive Compartido. Los bloques demarcados como [COMPLETAR: ...] permiten simular la asignación de claves de encriptación y parámetros de base de datos por ambiente.

## 1. Catalogo de Entidades Principales del Sistema

---

| Entidad / Tabla | Proposito Tecnico y Contenido | Estrategia Multi-Tenant |
| --- | --- | --- |
| tenants | Almacena la configuracion general, branding, llaves de API y parametros de comisiones del cliente B2B. | Entidad Raiz (Tenant ID Master) |
| users | Usuarios finales (Compradores, Vendedores, Traders) asignados o compartidos entre tenants. | Clave Foranea tenant_id |
| coupons | Representa las unidades digitales de valor (cupones de reserva), estado actual y token QR encripado. | Clave Foranea tenant_id + Indice B-Tree |
| p2p_orders | Libro de ordenes de compra y venta P2P activas, canceladas y ejecutadas. | Clave Foranea tenant_id + Estado P2P |
| escrow_ledgers | Registro inmutable de contabilidad de la cuenta de custodia (Escrow) y comisiones calculadas. | Clave Foranea tenant_id + Hash Auditable |

## 2. Estructura y Marcadores de Diagramas de Base de Datos (ERD)

---

Los diagramas graficos del esquema de datos relacional deben ubicarse en la subcarpeta 📁 03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_ERD/ del Drive Compartido con los siguientes nombres de archivo:

### 2.1. Diagrama Entidad-Relación General (General ERD Schema)

Muestra las relaciones entre Tenants, Usuarios, Cupones, Libro de Ordenes P2P y Registros Contables de Escrow.

> 🖼️ **[REFERENCIA A DIAGRAMA GRÁFICO]**  
> **Ruta relativa en Drive:** `03_Fase_Arquitectura_y_Diseño_de_Software/Diagramas_ERD/01_Diagrama_ERD_General_SMCTA.png`  
> *(Subir aquí el diagrama Entidad-Relación completo en formato gráfico)*

## 3. DDL de Base de Datos SQL (PostgreSQL Schemas & Constraints)

---

```sql
-- 1. TABLA DE TENANTS (CLIENTES B2B)
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    seller_take_rate DECIMAL(5,2) DEFAULT 3.50,
    buyer_take_rate DECIMAL(5,2) DEFAULT 2.50,
    price_floor_pct DECIMAL(5,2) DEFAULT 50.00,
    price_ceiling_pct DECIMAL(5,2) DEFAULT 200.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE CUPONES (MAQUINA DE ESTADOS)
CREATE TYPE coupon_state AS ENUM ('EMITIDO', 'EN_WALLET', 'PUBLICADO_P2P', 'CANJEADO', 'VENCIDO');

CREATE TABLE coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    current_owner_id UUID NOT NULL,
    nominal_price DECIMAL(10,2) NOT NULL,
    state coupon_state DEFAULT 'EMITIDO',
    qr_encrypted_token TEXT NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA LIBRO DE ORDENES P2P
CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
CREATE TYPE order_status AS ENUM ('OPEN', 'MATCHED', 'CANCELLED');

CREATE TABLE p2p_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id),
    seller_id UUID NOT NULL,
    asking_price DECIMAL(10,2) NOT NULL,
    side order_side DEFAULT 'SELL',
    status order_status DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. REGISTRO CONTABLE INMUTABLE DE ESCROW
CREATE TABLE escrow_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id),
    transaction_type VARCHAR(50) NOT NULL, -- 'CHECKOUT', 'P2P_SPLIT', 'REDEEM_RELEASE'
    amount_in_escrow DECIMAL(10,2) NOT NULL,
    tenant_fee_accumulated DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Registro de Parametrizacion de Base de Datos por Entorno

---

Plantilla para documentar la configuracion del clúster de base de datos relacional PostgreSQL.

| Parametro de Base de Datos | Especificacion Tecnica | Registro Real del Entorno |
| --- | --- | --- |
| Host / Endpoint del Clúster: | postgres.[tenant-environment].internal | [COMPLETAR: ENDPOINT_DB] |
| Version de PostgreSQL: | PostgreSQL 15.4 o superior | [COMPLETAR: VERSION_POSTGRES] |
| Estrategia de Pool de Conexiones: | PgBouncer (Max 200 conexiones activas) | [COMPLETAR: PGBOUNCER_CONFIG] |
| Algoritmo de Encriptacion en Reposo: | AES-256 para tokens QR y datos sensibles | [COMPLETAR: LLAVE_ENCRIPTACION] |

## 5. Anexo: Formulario de Firma y Aprobacion de Modelo de Datos

---

Espacio reservado para certificar la validacion del modelo relacional SQL por el equipo de Base de Datos y Backend.

ACTA DE APROBACIÓN TÉCNICA - MODELO DE DATOS Y ENTIDADES

El esquema DDL de PostgreSQL, los tipos enumerados y las tablas de auditoria contable quedan formalmente integrados como la especificacion oficial de base de datos para el proyecto SMCTA P2P.

Lider de Base de Datos / DBA: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]

Lider Tecnico Backend: [COMPLETAR NOMBRE Y FIRMA] Fecha: [AAAA-MM-DD]
