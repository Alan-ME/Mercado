-- Esquema relacional PostgreSQL para SMCTA P2P v2 (ARQ-002 + extensiones RN-03..RN-06).
-- OJO: antes esto arrancaba con DROP TABLE CASCADE y te volaba producción entera si se
-- reiniciaba el contenedor contra un Postgres real. Ahora es 100% idempotente sin borrar nada.

DO $$ BEGIN
    CREATE TYPE coupon_state AS ENUM ('EMITIDO', 'EN_WALLET', 'PUBLICADO_P2P', 'CANJEADO', 'VENCIDO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('OPEN', 'MATCHED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    seller_take_rate DECIMAL(5,2) NOT NULL DEFAULT 3.50,
    buyer_take_rate DECIMAL(5,2) NOT NULL DEFAULT 2.50,
    price_floor_pct DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    price_ceiling_pct DECIMAL(6,2) NOT NULL DEFAULT 200.00,
    max_daily_resales_per_user INT NOT NULL DEFAULT 5,
    closure_hours_before_event INT NOT NULL DEFAULT 2,
    platform_revenue_share_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    qr_secret TEXT NOT NULL,
    theme_primary_color VARCHAR(9) NOT NULL DEFAULT '#1A365D',
    theme_accent_color VARCHAR(9) NOT NULL DEFAULT '#3182CE',
    theme_surface_color VARCHAR(9) NOT NULL DEFAULT '#FFFFFF',
    theme_font_family VARCHAR(120) NOT NULL DEFAULT 'Inter, sans-serif',
    theme_logo_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tenants_collar CHECK (price_floor_pct <= price_ceiling_pct),
    CONSTRAINT ck_tenants_rates CHECK (seller_take_rate >= 0 AND buyer_take_rate >= 0)
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- No metemos FK de current_owner_id contra users(user_id) porque la suite QA-02
-- bombardea compras P2P con 50 UUIDs generados al vuelo sin registrarlos antes.
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    current_owner_id UUID NOT NULL,
    nominal_price DECIMAL(10,2) NOT NULL,
    state coupon_state NOT NULL DEFAULT 'EMITIDO',
    qr_encrypted_token TEXT NOT NULL DEFAULT '',
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    product_name VARCHAR(160) NOT NULL DEFAULT '',
    token_version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coupons_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    CONSTRAINT ck_coupons_nominal_pos CHECK (nominal_price > 0)
);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_owner ON coupons(tenant_id, current_owner_id);

CREATE TABLE IF NOT EXISTS p2p_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    asking_price DECIMAL(10,2) NOT NULL,
    side order_side NOT NULL DEFAULT 'SELL',
    status order_status NOT NULL DEFAULT 'OPEN',
    buyer_id UUID,
    seller_fee_amount DECIMAL(10,2),
    buyer_fee_amount DECIMAL(10,2),
    net_seller_proceeds DECIMAL(10,2),
    total_buyer_price DECIMAL(10,2),
    matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE RESTRICT,
    CONSTRAINT ck_orders_asking_pos CHECK (asking_price > 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON p2p_orders(tenant_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON p2p_orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_day ON p2p_orders(tenant_id, seller_id, created_at DESC);
-- Última línea de defensa en el motor: aunque fallen los locks en memoria/Redis,
-- Postgres jamás permite dos órdenes OPEN para el mismo cupón.
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_open_coupon ON p2p_orders(coupon_id) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS escrow_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount_in_escrow DECIMAL(10,2) NOT NULL,
    tenant_fee_accumulated DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    related_order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE RESTRICT,
    CONSTRAINT ck_ledger_tx_type CHECK (
        transaction_type IN ('CHECKOUT', 'P2P_SPLIT', 'REDEEM_RELEASE', 'REFUND')
    )
);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON escrow_ledgers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_coupon ON escrow_ledgers(coupon_id);
-- Impide fondear dos veces en checkout o liberar dos veces la custodia del mismo cupón.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_checkout_once
    ON escrow_ledgers(coupon_id) WHERE transaction_type = 'CHECKOUT';
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_terminal_once
    ON escrow_ledgers(coupon_id) WHERE transaction_type IN ('REDEEM_RELEASE', 'REFUND');

-- Un comentario diciendo "tabla inmutable" no frena a nadie; este trigger sí.
CREATE OR REPLACE FUNCTION trg_prevent_ledger_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Operación % no permitida sobre tabla append-only % (SQLSTATE: 28000)', TG_OP, TG_TABLE_NAME
        USING ERRCODE = '28000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_escrow_ledgers_immutable ON escrow_ledgers;
CREATE TRIGGER trg_escrow_ledgers_immutable
BEFORE UPDATE OR DELETE ON escrow_ledgers
FOR EACH ROW EXECUTE FUNCTION trg_prevent_ledger_mutation();

CREATE TABLE IF NOT EXISTS user_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    related_coupon_id UUID,
    related_order_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_events_user ON user_events(tenant_id, user_id, created_at DESC);
