import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { TenantRepository } from '../src/infrastructure/database/tenantRepository.js';
import { CouponRepository } from '../src/infrastructure/database/couponRepository.js';
import { OrderRepository } from '../src/infrastructure/database/orderRepository.js';
import { LedgerRepository } from '../src/infrastructure/database/ledgerRepository.js';
import { Database } from '../src/infrastructure/database/db.js';
import { CouponState, OrderSide, OrderStatus, LedgerTransactionType } from '../src/domain/entities/index.js';

describe('Suite de Integración API REST SMCTA Backend Core', () => {
  const mockTenant = {
    tenantId: '11111111-1111-1111-1111-111111111111',
    companyName: 'Festival Musical Vibe',
    subdomain: 'festival',
    sellerTakeRatePct: 3.50,
    buyerTakeRatePct: 2.50,
    priceFloorPct: 50.00,
    priceCeilingPct: 200.00,
    maxDailyResalesPerUser: 5,
    closureHoursBeforeEvent: 2,
    platformRevenueSharePct: 30.00,
    themeConfig: {
      primaryColor: '#6B21A8',
      accentColor: '#EC4899',
      surfaceColor: '#0F172A',
      fontFamily: 'Outfit, sans-serif',
      logoUrl: '/assets/logos/festival.png'
    }
  };

  const sellerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const buyerId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  let inMemoryCoupons: any[] = [];
  let inMemoryOrders: any[] = [];
  let inMemoryLedgers: any[] = [];

  beforeEach(() => {
    inMemoryCoupons = [];
    inMemoryOrders = [];
    inMemoryLedgers = [];

    vi.spyOn(Database, 'withTransaction').mockImplementation(async (cb: any) => {
      return cb({} as any);
    });

    vi.spyOn(TenantRepository, 'findByIdOrSubdomain').mockImplementation(async (id: string) => {
      if (id === mockTenant.tenantId || id === mockTenant.subdomain) {
        return mockTenant as any;
      }
      return null;
    });

    vi.spyOn(CouponRepository, 'create').mockImplementation(async (data: any) => {
      const coupon = {
        couponId: data.couponId || crypto.randomUUID(),
        tenantId: data.tenantId,
        currentOwnerId: data.currentOwnerId,
        nominalPrice: data.nominalPrice,
        state: data.state,
        qrEncryptedToken: data.qrEncryptedToken,
        expirationDate: data.expirationDate,
        createdAt: new Date().toISOString()
      };
      inMemoryCoupons.push(coupon);
      return coupon;
    });

    vi.spyOn(CouponRepository, 'findById').mockImplementation(async (_tId: string, cId: string) => {
      return inMemoryCoupons.find((c) => c.couponId === cId) || null;
    });

    vi.spyOn(CouponRepository, 'findByOwner').mockImplementation(async (_tId: string, oId: string) => {
      return inMemoryCoupons.filter((c) => c.currentOwnerId === oId);
    });

    vi.spyOn(CouponRepository, 'updateState').mockImplementation(async (_tId: string, cId: string, state: any) => {
      const c = inMemoryCoupons.find((x) => x.couponId === cId);
      if (c) c.state = state;
    });

    vi.spyOn(CouponRepository, 'transferOwnership').mockImplementation(
      async (_tId: string, cId: string, newOwnerId: string, newState: any, newQr: string) => {
        const c = inMemoryCoupons.find((x) => x.couponId === cId);
        if (c) {
          c.currentOwnerId = newOwnerId;
          c.state = newState;
          c.qrEncryptedToken = newQr;
        }
      }
    );

    vi.spyOn(CouponRepository, 'countDailyResalesByUser').mockImplementation(async () => {
      return inMemoryOrders.filter((o) => o.sellerId === sellerId).length;
    });

    vi.spyOn(OrderRepository, 'create').mockImplementation(async (data: any) => {
      const order = {
        orderId: data.orderId || crypto.randomUUID(),
        tenantId: data.tenantId,
        couponId: data.couponId,
        sellerId: data.sellerId,
        askingPrice: data.askingPrice,
        side: data.side || OrderSide.SELL,
        status: data.status || OrderStatus.OPEN,
        createdAt: new Date().toISOString()
      };
      inMemoryOrders.push(order);
      return order;
    });

    vi.spyOn(OrderRepository, 'findById').mockImplementation(async (_tId: string, oId: string) => {
      return inMemoryOrders.find((o) => o.orderId === oId) || null;
    });

    vi.spyOn(OrderRepository, 'findOpenOrders').mockImplementation(async () => {
      return inMemoryOrders.filter((o) => o.status === OrderStatus.OPEN);
    });

    vi.spyOn(OrderRepository, 'updateStatus').mockImplementation(async (_tId: string, oId: string, status: any) => {
      const o = inMemoryOrders.find((x) => x.orderId === oId);
      if (o) o.status = status;
    });

    vi.spyOn(LedgerRepository, 'recordEntry').mockImplementation(async (data: any) => {
      const entry = {
        ledgerId: crypto.randomUUID(),
        tenantId: data.tenantId,
        couponId: data.couponId,
        transactionType: data.transactionType,
        amountInEscrow: data.amountInEscrow,
        tenantFeeAccumulated: data.tenantFeeAccumulated || 0,
        createdAt: new Date().toISOString()
      };
      inMemoryLedgers.push(entry);
      return entry;
    });

    vi.spyOn(LedgerRepository, 'getEntriesByTenant').mockImplementation(async () => {
      return inMemoryLedgers;
    });
  });

  it('GET /health debe responder 200 UP sin requerir contexto de tenant', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('smcta-backend-core');
  });

  it('Debe retornar HTTP 404 TENANT_NOT_FOUND si no se provee cabecera ni subdominio', async () => {
    const res = await request(app).get('/api/v1/tenant/config');
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('TENANT_NOT_FOUND');
  });

  it('GET /api/v1/tenant/config debe retornar la parametrización completa con x-tenant-id válido', async () => {
    const res = await request(app)
      .get('/api/v1/tenant/config')
      .set('x-tenant-id', mockTenant.tenantId);

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(mockTenant.tenantId);
    expect(res.body.companyName).toBe('Festival Musical Vibe');
    expect(res.body.priceFloorPct).toBe(50.00);
    expect(res.body.priceCeilingPct).toBe(200.00);
  });

  it('POST /api/v1/checkout/primary debe validar el schema y rechazar precios negativos', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({
        userId: sellerId,
        nominalPrice: -50.00
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/checkout/primary debe emitir el cupón en EN_WALLET y registrar el fondo en Escrow', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({
        userId: sellerId,
        nominalPrice: 100.00
      });

    expect(res.status).toBe(201);
    expect(res.body.data.coupon.state).toBe(CouponState.EN_WALLET);
    expect(res.body.data.coupon.nominalPrice).toBe(100.00);
    expect(res.body.data.qrToken).toBeDefined();

    expect(inMemoryLedgers.length).toBe(1);
    expect(inMemoryLedgers[0].transactionType).toBe(LedgerTransactionType.CHECKOUT);
    expect(inMemoryLedgers[0].amountInEscrow).toBe(100.00);
  });

  it('GET /api/v1/coupons/my-wallet debe retornar los cupones del usuario', async () => {
    await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ userId: sellerId, nominalPrice: 100.00 });

    const res = await request(app)
      .get(`/api/v1/coupons/my-wallet?userId=${sellerId}`)
      .set('x-tenant-id', mockTenant.tenantId);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].currentOwnerId).toBe(sellerId);
  });

  it('POST /api/v1/p2p/orders debe rechazar con 422 PRICE_COLLAR_VIOLATION si el precio está fuera de banda', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ userId: sellerId, nominalPrice: 100.00 });

    const couponId = checkRes.body.data.coupon.couponId;

    const resHigh = await request(app)
      .post('/api/v1/p2p/orders')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({
        sellerId,
        couponId,
        askingPrice: 250.00
      });

    expect(resHigh.status).toBe(422);
    expect(resHigh.body.errorCode).toBe('PRICE_COLLAR_VIOLATION');

    const resLow = await request(app)
      .post('/api/v1/p2p/orders')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({
        sellerId,
        couponId,
        askingPrice: 40.00
      });

    expect(resLow.status).toBe(422);
    expect(resLow.body.errorCode).toBe('PRICE_COLLAR_VIOLATION');
  });

  it('POST /api/v1/p2p/orders debe publicar la orden exitosamente y mutar el cupón a PUBLICADO_P2P', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ userId: sellerId, nominalPrice: 100.00 });

    const couponId = checkRes.body.data.coupon.couponId;

    const res = await request(app)
      .post('/api/v1/p2p/orders')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({
        sellerId,
        couponId,
        askingPrice: 150.00
      });

    expect(res.status).toBe(201);
    expect(res.body.data.askingPrice).toBe(150.00);
    expect(res.body.data.status).toBe(OrderStatus.OPEN);

    const couponInDb = inMemoryCoupons.find((c) => c.couponId === couponId);
    expect(couponInDb.state).toBe(CouponState.PUBLICADO_P2P);

    const qrRes = await request(app)
      .get(`/api/v1/coupons/${couponId}/qr-token?userId=${sellerId}`)
      .set('x-tenant-id', mockTenant.tenantId);

    expect(qrRes.status).toBe(409);
    expect(qrRes.body.errorCode).toBe('COUPON_NOT_IN_WALLET');
  });

  it('POST /api/v1/p2p/orders/:id/buy debe ejecutar el match atómico y calcular split exacto', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ userId: sellerId, nominalPrice: 100.00 });
    const couponId = checkRes.body.data.coupon.couponId;

    const orderRes = await request(app)
      .post('/api/v1/p2p/orders')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ sellerId, couponId, askingPrice: 120.00 });
    const orderId = orderRes.body.data.orderId;

    const matchRes = await request(app)
      .post(`/api/v1/p2p/orders/${orderId}/buy`)
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ buyerId });

    expect(matchRes.status).toBe(200);
    expect(matchRes.body.data.status).toBe(OrderStatus.MATCHED);
    expect(matchRes.body.data.buyerId).toBe(buyerId);

    const breakdown = matchRes.body.data.commissionBreakdown;
    expect(breakdown.sellerFeeAmount).toBe(4.20);
    expect(breakdown.netSellerProceeds).toBe(115.80);
    expect(breakdown.buyerFeeAmount).toBe(3.00);
    expect(breakdown.totalBuyerPrice).toBe(123.00);

    const couponAfter = inMemoryCoupons.find((c) => c.couponId === couponId);
    expect(couponAfter.currentOwnerId).toBe(buyerId);
    expect(couponAfter.state).toBe(CouponState.EN_WALLET);

    const lastLedger = inMemoryLedgers[inMemoryLedgers.length - 1];
    expect(lastLedger.transactionType).toBe(LedgerTransactionType.P2P_SPLIT);
  });

  it('POST /api/v1/tpv/validate-qr debe canjear el cupón y liberar fondos de Escrow', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ userId: buyerId, nominalPrice: 85.00 });
    const couponId = checkRes.body.data.coupon.couponId;

    const qrRes = await request(app)
      .get(`/api/v1/coupons/${couponId}/qr-token?userId=${buyerId}`)
      .set('x-tenant-id', mockTenant.tenantId);
    const tokenString = qrRes.body.data.tokenString;

    const tpvRes = await request(app)
      .post('/api/v1/tpv/validate-qr')
      .set('x-tenant-id', mockTenant.tenantId)
      .send({ qrToken: tokenString });

    expect(tpvRes.status).toBe(200);
    expect(tpvRes.body.data.status).toBe('SUCCESS');
    expect(tpvRes.body.data.state).toBe(CouponState.CANJEADO);

    const lastLedger = inMemoryLedgers[inMemoryLedgers.length - 1];
    expect(lastLedger.transactionType).toBe(LedgerTransactionType.REDEEM_RELEASE);
    expect(lastLedger.amountInEscrow).toBe(85.00);
  });

  it('GET /api/v1/escrow/audit debe retornar el resumen financiero y la traza contable completa', async () => {
    const res = await request(app)
      .get('/api/v1/escrow/audit')
      .set('x-tenant-id', mockTenant.tenantId);

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(mockTenant.tenantId);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.ledgerEntries)).toBe(true);
  });
});
