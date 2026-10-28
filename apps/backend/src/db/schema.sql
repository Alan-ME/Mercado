-- =====================================================================
-- SMCTA P2P v2 - Esquema relacional PostgreSQL
-- Base: 03_Fase_Arquitectura_y_Diseño_de_Software/02_Diseno_de_Modelo_de_Datos_y_Entidades.md (§3 DDL)
-- Extensiones (marcadas con -- [EXT]) requeridas por RN-05/RN-06, split de
-- comisiones (RN-03), tematización White-Label (Fase 04) y auditoría de escrow (TASK-006).
--
-- Idempotente: se recrea en cada arranque para dejar estado determinista
-- (comportamiento nativo de PGlite en memoria; replicado para Postgres en red).
-- =====================================================================

DROP TABLE IF EXISTS user_events CASCADE;
DROP TABLE IF EXISTS escrow_ledgers CASCADE;
DROP TABLE IF EXISTS p2p_orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TYPE IF EXISTS coupon_state CASCADE;
DROP TYPE IF EXISTS order_side CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- 1. TABLA DE TENANTS (CLIENTES B2B)
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    seller_take_rate DECIMAL(5,2) DEFAULT 3.50,
    buyer_take_rate DECIMAL(5,2) DEFAULT 2.50,
    price_floor_pct DECIMAL(5,2) DEFAULT 50.00,
    price_ceiling_pct DECIMAL(6,2) DEFAULT 200.00,
    -- [EXT] parámetros de negocio (RN-05, RN-06, reparto de plataforma)
    max_daily_resales_per_user INT DEFAULT 5,
    closure_hours_before_event INT DEFAULT 2,
    platform_revenue_share_pct DECIMAL(5,2) DEFAULT 30.00,
    -- [EXT] clave secreta para firmar tokens QR (HMAC-SHA256 por tenant)
    qr_secret TEXT NOT NULL,
    -- [EXT] tematización White-Label (Fase 04 - Design Tokens)
    theme_primary_color VARCHAR(9) DEFAULT '#1A365D',
    theme_accent_color VARCHAR(9) DEFAULT '#3182CE',
    theme_surface_color VARCHAR(9) DEFAULT '#FFFFFF',
    theme_font_family VARCHAR(120) DEFAULT 'Inter, sans-serif',
    theme_logo_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- [EXT] Usuarios finales (demo / propiedad de cupones). El DDL original referencia
-- current_owner_id como UUID libre; añadimos la tabla para semillas y balances B2C.
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    display_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
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
    qr_encrypted_token TEXT NOT NULL DEFAULT '',
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- [EXT] etiqueta de producto para la UI White-Label
    product_name VARCHAR(160) DEFAULT '',
    -- [EXT] token version: invalida QR anteriores al re-emitir (matching P2P)
    token_version INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX idx_coupons_owner ON coupons(tenant_id, current_owner_id);

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
    -- [EXT] resultado del match y desglose de comisiones (RN-03)
    buyer_id UUID,
    seller_fee_amount DECIMAL(10,2),
    buyer_fee_amount DECIMAL(10,2),
    net_seller_proceeds DECIMAL(10,2),
    total_buyer_price DECIMAL(10,2),
    matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_tenant_status ON p2p_orders(tenant_id, status);
CREATE INDEX idx_orders_seller ON p2p_orders(tenant_id, seller_id);

-- 4. REGISTRO CONTABLE INMUTABLE DE ESCROW
CREATE TABLE escrow_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id),
    transaction_type VARCHAR(50) NOT NULL, -- 'CHECKOUT', 'P2P_SPLIT', 'REDEEM_RELEASE', 'REFUND'
    -- Delta firmado sobre el saldo retenido en custodia (CHECKOUT +nominal,
    -- REDEEM_RELEASE/REFUND -nominal, P2P_SPLIT 0). Permite auditar saldo=0 (TASK-006).
    amount_in_escrow DECIMAL(10,2) NOT NULL,
    tenant_fee_accumulated DECIMAL(10,2) DEFAULT 0.00,
    -- [EXT] fee que se lleva SMCTA Core (software) del total de comisiones
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    related_order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ledger_tenant ON escrow_ledgers(tenant_id);
CREATE INDEX idx_ledger_coupon ON escrow_ledgers(coupon_id);

-- [EXT] Feed de actividad por usuario: alimenta el Historial de transacciones
-- (UX §1 / Tarea 2.8) y el centro de Notificaciones (Visión, in-scope B2C).
CREATE TABLE user_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    user_id UUID NOT NULL,
    type VARCHAR(40) NOT NULL, -- PRIMARY_PURCHASE, P2P_LISTED, P2P_SALE, P2P_BUY, REDEEM, P2P_CANCELLED
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    related_coupon_id UUID,
    related_order_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_events_user ON user_events(tenant_id, user_id, created_at DESC);
