-- ==============================================================================
-- SMCTA - Inicialización de Base de Datos y Esquema DDL Multi-Tenant
-- Fuente: 03_Fase_Arquitectura_y_Diseño_de_Software/02_Diseno_de_Modelo_de_Datos_y_Entidades.md
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA DE TENANTS (CLIENTES B2B)
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    seller_take_rate DECIMAL(5,2) DEFAULT 3.50,
    buyer_take_rate DECIMAL(5,2) DEFAULT 2.50,
    price_floor_pct DECIMAL(5,2) DEFAULT 50.00,
    price_ceiling_pct DECIMAL(5,2) DEFAULT 200.00,
    max_daily_resales_per_user INT DEFAULT 5,
    closure_hours_before_event INT DEFAULT 2,
    platform_revenue_share_pct DECIMAL(5,2) DEFAULT 30.00,
    theme_config JSONB DEFAULT '{
        "primaryColor": "#1A365D",
        "accentColor": "#3182CE",
        "surfaceColor": "#FFFFFF",
        "fontFamily": "Inter, sans-serif",
        "logoUrl": ""
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_tenant_email UNIQUE (tenant_id, email)
);

-- 3. TABLA DE CUPONES (MAQUINA DE ESTADOS)
DO $$ BEGIN
    CREATE TYPE coupon_state AS ENUM ('EMITIDO', 'EN_WALLET', 'PUBLICADO_P2P', 'CANJEADO', 'VENCIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    current_owner_id UUID NOT NULL REFERENCES users(user_id),
    nominal_price DECIMAL(10,2) NOT NULL,
    state coupon_state DEFAULT 'EMITIDO',
    qr_encrypted_token TEXT NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA LIBRO DE ORDENES P2P
DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
    CREATE TYPE order_status AS ENUM ('OPEN', 'MATCHED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS p2p_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(user_id),
    asking_price DECIMAL(10,2) NOT NULL,
    side order_side DEFAULT 'SELL',
    status order_status DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. REGISTRO CONTABLE INMUTABLE DE ESCROW
CREATE TABLE IF NOT EXISTS escrow_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'CHECKOUT', 'P2P_SPLIT', 'REDEEM_RELEASE', 'REFUND'
    amount_in_escrow DECIMAL(10,2) NOT NULL,
    tenant_fee_accumulated DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- SEMILLAS (SEED DATA) PARA DESARROLLO Y TESTS MULTI-TENANT
-- ==============================================================================

-- Tenant 1: Festival de Musica (festival.smcta.local)
INSERT INTO tenants (
    tenant_id, company_name, subdomain, seller_take_rate, buyer_take_rate,
    price_floor_pct, price_ceiling_pct, theme_config
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Festival Musical Vibe',
    'festival',
    3.50,
    2.50,
    50.00,
    200.00,
    '{
        "primaryColor": "#6B21A8",
        "accentColor": "#EC4899",
        "surfaceColor": "#0F172A",
        "fontFamily": "Outfit, sans-serif",
        "logoUrl": "/assets/logos/festival.png"
    }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Tenant 2: Hotel & Spa Resort (hotel.smcta.local)
INSERT INTO tenants (
    tenant_id, company_name, subdomain, seller_take_rate, buyer_take_rate,
    price_floor_pct, price_ceiling_pct, theme_config
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Grand Hotel & Spa',
    'hotel',
    5.00,
    2.00,
    70.00,
    150.00,
    '{
        "primaryColor": "#065F46",
        "accentColor": "#10B981",
        "surfaceColor": "#F8FAFC",
        "fontFamily": "Inter, sans-serif",
        "logoUrl": "/assets/logos/hotel.png"
    }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Usuarios de prueba para Tenant 1
INSERT INTO users (user_id, tenant_id, email, full_name)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'vendedor@festival.com', 'Carlos Vendedor'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'comprador@festival.com', 'Ana Compradora')
ON CONFLICT (tenant_id, email) DO NOTHING;
