import express, { Express, Request, Response } from 'express';
import cors from 'cors';

export interface HarnessTenant {
  tenantId: string;
  subdomain: string;
  companyName: string;
  sellerTakeRatePct: number;
  buyerTakeRatePct: number;
  priceFloorPct: number;
  priceCeilingPct: number;
  platformRevenueSharePct: number;
}

export interface HarnessCoupon {
  couponId: string;
  tenantId: string;
  nominalPrice: number;
  ownerId: string;
  state: 'EMITIDO' | 'EN_WALLET' | 'PUBLICADO_P2P' | 'CANJEADO' | 'VENCIDO';
}

export interface HarnessOrder {
  orderId: string;
  tenantId: string;
  couponId: string;
  sellerId: string;
  askingPrice: number;
  status: 'OPEN' | 'MATCHED' | 'CANCELLED';
}

export interface HarnessLedgerEntry {
  ledgerId: string;
  tenantId: string;
  couponId: string;
  transactionType: 'CHECKOUT' | 'P2P_SPLIT' | 'REDEEM_RELEASE' | 'REFUND';
  amount: number;
  commerceFee: number;
  platformFee: number;
  timestamp: string;
}

export class BackendCoreHarness {
  public app: Express;
  public tenants = new Map<string, HarnessTenant>();
  public coupons = new Map<string, HarnessCoupon>();
  public orders = new Map<string, HarnessOrder>();
  public ledgers: HarnessLedgerEntry[] = [];
  private orderLocks = new Set<string>();

  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.seedDefaults();
    this.setupRoutes();
  }

  public reset(): void {
    this.coupons.clear();
    this.orders.clear();
    this.ledgers = [];
    this.orderLocks.clear();
    this.seedDefaults();
  }

  private seedDefaults(): void {
    this.tenants.set('11111111-1111-1111-1111-111111111111', {
      tenantId: '11111111-1111-1111-1111-111111111111',
      subdomain: 'festival',
      companyName: 'Festival Musical Vibe',
      sellerTakeRatePct: 3.50,
      buyerTakeRatePct: 2.50,
      priceFloorPct: 50.00,
      priceCeilingPct: 200.00,
      platformRevenueSharePct: 30.00,
    });

    this.tenants.set('22222222-2222-2222-2222-222222222222', {
      tenantId: '22222222-2222-2222-2222-222222222222',
      subdomain: 'hotel',
      companyName: 'Grand Hotel & Spa',
      sellerTakeRatePct: 5.00,
      buyerTakeRatePct: 2.00,
      priceFloorPct: 70.00,
      priceCeilingPct: 150.00,
      platformRevenueSharePct: 30.00,
    });
  }

  private setupRoutes(): void {
    // 1. Checkout Primario
    this.app.post('/api/v1/checkout/primary', (req: Request, res: Response) => {
      const { tenantId, userId, nominalPrice } = req.body;
      const nominal = Number(nominalPrice || 100.00);

      const couponId = `cpn_${Math.random().toString(36).substring(2, 9)}`;
      const coupon: HarnessCoupon = {
        couponId,
        tenantId,
        nominalPrice: nominal,
        ownerId: userId || 'user_primary',
        state: 'EN_WALLET',
      };
      this.coupons.set(couponId, coupon);

      // Asiento CHECKOUT en Escrow
      this.ledgers.push({
        ledgerId: `led_${Date.now()}_${Math.random()}`,
        tenantId,
        couponId,
        transactionType: 'CHECKOUT',
        amount: nominal,
        commerceFee: 0,
        platformFee: 0,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json(coupon);
    });

    // 2. Publicación P2P con validación Price Collar (TASK-004)
    this.app.post('/api/v1/p2p/orders', (req: Request, res: Response) => {
      const { tenantId, couponId, sellerId, askingPrice } = req.body;
      const tenant = this.tenants.get(tenantId);
      const coupon = this.coupons.get(couponId);

      if (!tenant) {
        return res.status(404).json({ errorCode: 'TENANT_NOT_FOUND' });
      }
      if (!coupon) {
        return res.status(404).json({ errorCode: 'COUPON_NOT_FOUND' });
      }
      if (coupon.state !== 'EN_WALLET') {
        return res.status(409).json({ errorCode: 'COUPON_NOT_IN_WALLET' });
      }

      const nominal = coupon.nominalPrice;
      const minAllowed = Number((nominal * (tenant.priceFloorPct / 100)).toFixed(2));
      const maxAllowed = Number((nominal * (tenant.priceCeilingPct / 100)).toFixed(2));
      const asking = Number(askingPrice);

      // Verificación estricta de Price Collar (RN-02)
      if (asking < minAllowed || asking > maxAllowed) {
        return res.status(422).json({
          errorCode: 'PRICE_COLLAR_VIOLATION',
          message: `El precio propuesto ($${asking}) viola la banda permitida [$${minAllowed}, $${maxAllowed}].`,
          details: {
            askingPrice: asking,
            minAllowed,
            maxAllowed,
            nominalPrice: nominal,
          },
        });
      }

      const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
      const order: HarnessOrder = {
        orderId,
        tenantId,
        couponId,
        sellerId: sellerId || coupon.ownerId,
        askingPrice: asking,
        status: 'OPEN',
      };

      this.orders.set(orderId, order);
      coupon.state = 'PUBLICADO_P2P';

      res.status(201).json(order);
    });

    // 3. Compra Atómica Concurrente P2P con Redis Lock Simulator (TASK-005)
    this.app.post('/api/v1/p2p/orders/:id/buy', (req: Request, res: Response) => {
      const orderId = req.params.id;
      const { buyerId } = req.body;

      const order = this.orders.get(orderId);
      if (!order) {
        return res.status(404).json({ errorCode: 'ORDER_NOT_FOUND' });
      }

      // Simulación de Lock Atómico Exclusivo
      if (order.status !== 'OPEN' || this.orderLocks.has(orderId)) {
        return res.status(423).json({
          errorCode: 'P2P_ORDER_LOCKED',
          message: 'La orden se encuentra en proceso de liquidación por otro comprador o ya ha sido cerrada.',
        });
      }

      // Adquisición inmediata del cerrojo atómico
      this.orderLocks.add(orderId);
      order.status = 'MATCHED';

      const coupon = this.coupons.get(order.couponId)!;
      coupon.ownerId = buyerId || 'new_buyer';
      coupon.state = 'EN_WALLET';

      const tenant = this.tenants.get(order.tenantId)!;
      const sellerFee = Number((order.askingPrice * (tenant.sellerTakeRatePct / 100)).toFixed(2));
      const buyerFee = Number((order.askingPrice * (tenant.buyerTakeRatePct / 100)).toFixed(2));
      const totalFees = sellerFee + buyerFee;
      const platformFee = Number((totalFees * (tenant.platformRevenueSharePct / 100)).toFixed(2));
      const commerceFee = Number((totalFees - platformFee).toFixed(2));

      // Asiento P2P_SPLIT
      this.ledgers.push({
        ledgerId: `led_${Date.now()}_${Math.random()}`,
        tenantId: order.tenantId,
        couponId: order.couponId,
        transactionType: 'P2P_SPLIT',
        amount: order.askingPrice,
        commerceFee,
        platformFee,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        message: 'Compra P2P ejecutada con éxito.',
        orderId,
        couponId: coupon.couponId,
        newOwnerId: coupon.ownerId,
        split: {
          askingPrice: order.askingPrice,
          sellerFee,
          buyerFee,
          commerceFee,
          platformFee,
        },
      });
    });

    // 4. Canje en TPV y Asiento REDEEM_RELEASE (TASK-006)
    this.app.post('/api/v1/tpv/validate-qr', (req: Request, res: Response) => {
      const { couponId, tenantId } = req.body;
      const coupon = this.coupons.get(couponId);

      if (!coupon) {
        return res.status(404).json({ errorCode: 'COUPON_NOT_FOUND' });
      }

      if (coupon.state !== 'EN_WALLET') {
        return res.status(409).json({ errorCode: 'COUPON_NOT_IN_WALLET' });
      }

      coupon.state = 'CANJEADO';

      // Asiento REDEEM_RELEASE
      this.ledgers.push({
        ledgerId: `led_${Date.now()}_${Math.random()}`,
        tenantId: tenantId || coupon.tenantId,
        couponId,
        transactionType: 'REDEEM_RELEASE',
        amount: coupon.nominalPrice,
        commerceFee: 0,
        platformFee: 0,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        couponId,
        state: 'CANJEADO',
        amountReleased: coupon.nominalPrice,
      });
    });

    // 5. Auditoría de Conciliación de Escrow Ledgers (TASK-006)
    this.app.get('/api/v1/escrow/audit/:tenant_id', (req: Request, res: Response) => {
      const tenantId = req.params.tenant_id;
      const tenantLedgers = this.ledgers.filter((l) => l.tenantId === tenantId);

      let totalCheckout = 0;
      let totalCommerceFees = 0;
      let totalPlatformFees = 0;
      let totalReleased = 0;

      for (const entry of tenantLedgers) {
        if (entry.transactionType === 'CHECKOUT') {
          totalCheckout += entry.amount;
        } else if (entry.transactionType === 'P2P_SPLIT') {
          totalCommerceFees += entry.commerceFee;
          totalPlatformFees += entry.platformFee;
        } else if (entry.transactionType === 'REDEEM_RELEASE') {
          totalReleased += entry.amount;
        }
      }

      // Ecuación Contable: Depósitos iniciales = Fondos Liberados + Saldo Remanente Vivo
      const activeCoupons = Array.from(this.coupons.values()).filter(
        (c) => c.tenantId === tenantId && (c.state === 'EN_WALLET' || c.state === 'PUBLICADO_P2P')
      );
      const activeCouponsValue = activeCoupons.reduce((sum, c) => sum + c.nominalPrice, 0);

      const discrepancy = Math.abs(totalCheckout - (totalReleased + activeCouponsValue));

      res.status(200).json({
        tenantId,
        totalDeposited: Number(totalCheckout.toFixed(2)),
        totalReleased: Number(totalReleased.toFixed(2)),
        activeCouponsRemaining: Number(activeCouponsValue.toFixed(2)),
        totalCommerceFees: Number(totalCommerceFees.toFixed(2)),
        totalPlatformFees: Number(totalPlatformFees.toFixed(2)),
        discrepancy: Number(discrepancy.toFixed(2)),
        isBalanced: discrepancy === 0,
      });
    });

    // 6. Listado de Cupones por Tenant (Auditoría Aislamiento TASK-007)
    this.app.get('/api/v1/coupons/by-tenant/:tenant_id', (req: Request, res: Response) => {
      const tenantId = req.params.tenant_id;
      const list = Array.from(this.coupons.values()).filter((c) => c.tenantId === tenantId);
      res.status(200).json(list);
    });
  }
}

export const harness = new BackendCoreHarness();
