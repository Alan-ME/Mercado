import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
  allowsResale,
  canTransition,
  computeCommission,
  computePriceCollar,
  isWithinCollar,
  platformShare,
  tenantNetFees,
  type P2POrderDTO,
  type PublishOrderRequest,
} from '@smcta/shared';
import type { Queryable } from '../db/database.js';
import type { ServiceContext } from './context.js';
import { type CouponRow, type OrderRow, type TenantRow, toNum, orderToDTO } from '../repositories/mappers.js';
import {
  attachPendingTradeReward,
  findCouponById,
  findCouponsByOwner,
  transferAndReissue,
  updateCouponState,
} from '../repositories/couponRepo.js';
import {
  insertSellOrder,
  findOpenOrdersByTenant,
  findOrderById,
  countDailyResalesBySeller,
  matchOrderIfOpen,
  cancelOrderIfOpen,
} from '../repositories/orderRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { couponLockKey, withLock } from '../infra/lockManager.js';
import { generateQrToken } from '../domain/qrToken.js';
import { emitEvent, notifyCommittedEvents, type UserEventInput } from '../repositories/eventRepo.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 3_600_000;

interface TenantRates {
  seller: number;
  buyer: number;
  floor: number;
  ceiling: number;
  maxResales: number;
  closureHours: number;
  platformShare: number;
}

function rates(tenant: TenantRow): TenantRates {
  return {
    seller: toNum(tenant.seller_take_rate),
    buyer: toNum(tenant.buyer_take_rate),
    floor: toNum(tenant.price_floor_pct),
    ceiling: toNum(tenant.price_ceiling_pct),
    maxResales: toNum(tenant.max_daily_resales_per_user),
    closureHours: toNum(tenant.closure_hours_before_event),
    platformShare: toNum(tenant.platform_revenue_share_pct),
  };
}

function toOrderDTO(tenant: TenantRow, row: OrderRow, nominal: number): P2POrderDTO {
  const r = rates(tenant);
  return orderToDTO(row, nominal, r.seller, r.buyer);
}

function assertSellerCanPublish(coupon: CouponRow | null, couponId: string, sellerId: string): CouponRow {
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId });
  }
  if (coupon.current_owner_id !== sellerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'El cupón no pertenece al vendedor indicado.');
  }
  if (!allowsResale(coupon.state) || !canTransition(coupon.state, CouponState.PUBLICADO_P2P)) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      `Sólo se puede publicar un cupón EN_WALLET (estado actual: ${coupon.state}).`,
      { state: coupon.state },
    );
  }
  return coupon;
}

function assertTradingWindowOpen(coupon: CouponRow, closureHours: number, nowMs: number): void {
  const expiration = new Date(coupon.expiration_date).getTime();
  const cutoff = expiration - closureHours * HOUR_MS;
  if (nowMs >= cutoff) {
    throw new AppError(
      ErrorCode.P2P_WINDOW_CLOSED,
      `La ventana P2P cierra ${closureHours}h antes del evento.`,
      { closesAt: new Date(cutoff).toISOString() },
    );
  }
}

function assertWithinPriceCollar(askingPrice: number, nominal: number, r: TenantRates): void {
  const collar = computePriceCollar(nominal, r.floor, r.ceiling);
  if (isWithinCollar(askingPrice, collar)) return;
  const msg =
    askingPrice > collar.max
      ? `El precio excede el límite máximo permitido de $${collar.max.toFixed(2)}.`
      : `El precio está por debajo del límite mínimo permitido de $${collar.min.toFixed(2)}.`;
  throw new AppError(ErrorCode.PRICE_COLLAR_VIOLATION, msg, {
    askingPrice,
    min: collar.min,
    max: collar.max,
  });
}

async function assertDailyResaleQuota(
  tx: Queryable,
  tenantId: string,
  sellerId: string,
  maxResales: number,
  nowMs: number,
): Promise<void> {
  const sinceIso = new Date(nowMs - DAY_MS).toISOString();
  const dailyCount = await countDailyResalesBySeller(tx, tenantId, sellerId, sinceIso);
  if (dailyCount >= maxResales) {
    throw new AppError(
      ErrorCode.DAILY_RESALE_LIMIT_REACHED,
      `Superó el máximo de ${maxResales} reventas diarias permitidas.`,
      { dailyCount, max: maxResales },
    );
  }
}

export async function publishOrder(
  ctx: ServiceContext,
  tenant: TenantRow,
  req: PublishOrderRequest,
): Promise<P2POrderDTO> {
  const r = rates(tenant);
  const nowMs = ctx.clock.now();
  const found = await findCouponById(ctx.db, tenant.tenant_id, req.couponId);
  const coupon = assertSellerCanPublish(found, req.couponId, req.sellerId);
  assertTradingWindowOpen(coupon, r.closureHours, nowMs);

  const nominal = toNum(coupon.nominal_price);
  assertWithinPriceCollar(req.askingPrice, nominal, r);

  const events: UserEventInput[] = [];
  const orderRow = await withLock(
    ctx.lockManager,
    couponLockKey(req.couponId),
    ctx.config.lockTtlMs,
    () =>
      ctx.db.transactionSerializable(async (tx) => {
        events.length = 0;
        const fresh = assertSellerCanPublish(
          await findCouponById(tx, tenant.tenant_id, req.couponId),
          req.couponId,
          req.sellerId,
        );
        // El chequeo de cuota diaria tiene que vivir adentro del lock/tx: si lo dejás afuera,
        // 10 POST en paralelo leen dailyCount=4 y te meten 14 órdenes igual.
        await assertDailyResaleQuota(tx, tenant.tenant_id, req.sellerId, r.maxResales, ctx.clock.now());
        await updateCouponState(tx, req.couponId, CouponState.PUBLICADO_P2P);
        const rewardCredits = Math.round(nominal * toNum(tenant.gold_rate_per_unit ?? 10));
        const created = await insertSellOrder(tx, {
          tenantId: tenant.tenant_id,
          couponId: req.couponId,
          sellerId: req.sellerId,
          askingPrice: req.askingPrice,
          requestedProductName: req.requestedProductName,
          rewardCreditsOffered: rewardCredits,
        });
        const ev: UserEventInput = {
          tenantId: tenant.tenant_id,
          userId: req.sellerId,
          type: 'P2P_LISTED',
          title: `Publicaste "${fresh.product_name}" para trueque P2P de productos`,
          amount: req.askingPrice,
          relatedCouponId: req.couponId,
          relatedOrderId: created.order_id,
        };
        await emitEvent(tx, ev);
        events.push(ev);
        return created;
      }),
  );

  notifyCommittedEvents(ctx.eventHub, events);
  return toOrderDTO(tenant, orderRow, nominal);
}

export async function listOpenOrders(
  ctx: ServiceContext,
  tenant: TenantRow,
): Promise<P2POrderDTO[]> {
  const orders = await findOpenOrdersByTenant(ctx.db, tenant.tenant_id);
  return orders.map((o) => toOrderDTO(tenant, o, toNum(o.nominal_price)));
}

function assertPreBuyOrder(order: OrderRow | null, orderId: string, buyerId: string): OrderRow {
  if (!order) {
    throw new AppError(ErrorCode.ORDER_NOT_FOUND, 'Orden no encontrada.', { orderId });
  }
  if (order.status !== 'OPEN') {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya no está abierta.', { status: order.status });
  }
  if (order.seller_id === buyerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'No podés comprar tu propia orden.');
  }
  return order;
}

function assertOpenOrderInTx(order: OrderRow | null): OrderRow {
  if (!order || order.status !== 'OPEN') {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya fue tomada por otro usuario.');
  }
  return order;
}

function assertPublishedCouponInTx(coupon: CouponRow | null): CouponRow {
  if (!coupon || !canTransition(coupon.state, CouponState.EN_WALLET)) {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'El cupón de la orden ya no está publicado.');
  }
  return coupon;
}

function sameProductName(a: string, b: string): boolean {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  return na === nb || na.includes(nb) || nb.includes(na);
}

function isBuyerWalletCoupon(c: CouponRow | undefined, buyerId: string): c is CouponRow {
  if (!c) return false;
  return c.current_owner_id === buyerId && c.state === CouponState.EN_WALLET;
}

function assertValidCounterCoupon(
  candidate: CouponRow | undefined,
  buyerId: string,
  requestedName: string,
): CouponRow {
  if (!isBuyerWalletCoupon(candidate, buyerId)) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      `Para aceptar este intercambio necesitás tener "${requestedName}" disponible en tu billetera.`,
    );
  }
  if (requestedName && !sameProductName(candidate.product_name, requestedName)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `El cupón ofrecido ("${candidate.product_name}") no coincide con el producto solicitado ("${requestedName}").`,
    );
  }
  return candidate;
}

function pickBuyerCandidate(
  wallet: CouponRow[],
  buyerCouponId: string | undefined,
  reqName: string,
): CouponRow | undefined {
  if (buyerCouponId) {
    return wallet.find((c) => c.coupon_id === buyerCouponId);
  }
  return wallet.find(
    (c) => c.state === CouponState.EN_WALLET && sameProductName(c.product_name, reqName),
  );
}

function goldRate(tenant: TenantRow): number {
  return toNum(tenant.gold_rate_per_unit ?? 10);
}

// Si la orden exige un producto a cambio (o el comprador envía buyerCouponId), verifica que
// el comprador REALMENTE tenga ese producto en su billetera y lo transfiere al vendedor en la misma TX.
async function swapCounterCouponIfRequired(
  tx: Queryable,
  ctx: ServiceContext,
  tenant: TenantRow,
  order: OrderRow,
  buyerId: string,
  buyerCouponId: string | undefined,
  nowMs: number,
): Promise<void> {
  const reqName = String(order.requested_product_name).trim();
  if (!reqName && !buyerCouponId) return;

  const wallet = await findCouponsByOwner(tx, tenant.tenant_id, buyerId);
  const candidate = pickBuyerCandidate(wallet, buyerCouponId, reqName);
  const counter = assertValidCounterCoupon(candidate, buyerId, reqName);

  const nextVer = toNum(counter.token_version) + 1;
  const { token } = generateQrToken({
    couponId: counter.coupon_id,
    tenantId: tenant.tenant_id,
    ownerId: order.seller_id,
    secret: tenant.qr_secret,
    tokenVersion: nextVer,
    ttlMs: ctx.config.qrTtlMs,
    nowMs,
  });
  await transferAndReissue(tx, counter.coupon_id, order.seller_id, token);
  const rewardGold = Math.round(toNum(counter.nominal_price) * goldRate(tenant));
  await attachPendingTradeReward(tx, counter.coupon_id, buyerId, rewardGold);
}

export async function buyOrder(
  ctx: ServiceContext,
  tenant: TenantRow,
  orderId: string,
  buyerId: string,
  buyerCouponId?: string,
): Promise<P2POrderDTO> {
  if (!buyerId) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'buyerId es obligatorio.');
  }
  const pre = assertPreBuyOrder(await findOrderById(ctx.db, tenant.tenant_id, orderId), orderId, buyerId);
  const r = rates(tenant);
  const events: UserEventInput[] = [];

  const matched = await withLock(
    ctx.lockManager,
    couponLockKey(pre.coupon_id),
    ctx.config.lockTtlMs,
    () =>
      ctx.db.transactionSerializable(async (tx) => {
        events.length = 0;
        const order = assertOpenOrderInTx(await findOrderById(tx, tenant.tenant_id, orderId));
        const coupon = assertPublishedCouponInTx(await findCouponById(tx, tenant.tenant_id, order.coupon_id));
        const nowMs = ctx.clock.now();
        assertTradingWindowOpen(coupon, r.closureHours, nowMs);

        // Valida y transfiere el cupón del comprador hacia el vendedor si es un trueque de productos
        await swapCounterCouponIfRequired(tx, ctx, tenant, order, buyerId, buyerCouponId, nowMs);

        const nominal = toNum(coupon.nominal_price);
        const breakdown = computeCommission({
          nominalPrice: nominal,
          askingPrice: toNum(order.asking_price),
          sellerTakeRatePct: r.seller,
          buyerTakeRatePct: r.buyer,
        });

        // Doble guarda: aunque tengamos el lock del cupón, el UPDATE en SQL exige status = 'OPEN'.
        // Si otra transacción en paralelo ganó la carrera y commiteó justo antes, affected da 0
        // y abortamos de inmediato sin transferir plata ni emitir QR inválido.
        const affected = await matchOrderIfOpen(tx, orderId, buyerId, breakdown);
        if (affected === 0) {
          throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya fue tomada por otro usuario.');
        }

        // Cada reventa exitosa sube token_version en 1. Esto deja obsoleto cualquier QR viejo
        // que el dueño anterior haya capturado en foto o screenshot antes de vender.
        const nextVersion = toNum(coupon.token_version) + 1;
        const { token } = generateQrToken({
          couponId: coupon.coupon_id,
          tenantId: tenant.tenant_id,
          ownerId: buyerId,
          secret: tenant.qr_secret,
          tokenVersion: nextVersion,
          ttlMs: ctx.config.qrTtlMs,
          nowMs,
        });
        await transferAndReissue(tx, coupon.coupon_id, buyerId, token);
        const rewardGold = Math.round(nominal * toNum(tenant.gold_rate_per_unit ?? 10));
        await attachPendingTradeReward(tx, coupon.coupon_id, order.seller_id, rewardGold);

        // Guardamos el neto real del comercio (totalFees - platformShare). Antes guardaban el
        // bruto acá y también platformFee al lado, inventando plata de la nada en el panel de auditoría.
        await insertLedgerEntry(tx, {
          tenantId: tenant.tenant_id,
          couponId: coupon.coupon_id,
          transactionType: LedgerTransactionType.P2P_SPLIT,
          amountInEscrow: 0,
          tenantFeeAccumulated: tenantNetFees(breakdown, r.platformShare),
          platformFee: platformShare(breakdown, r.platformShare),
          relatedOrderId: orderId,
        });

        const buyEv: UserEventInput = {
          tenantId: tenant.tenant_id,
          userId: buyerId,
          type: 'P2P_BUY',
          title: `Recibiste "${coupon.product_name}" mediante trueque P2P`,
          amount: breakdown.totalBuyerPrice,
          relatedCouponId: coupon.coupon_id,
          relatedOrderId: orderId,
        };
        const saleEv: UserEventInput = {
          tenantId: tenant.tenant_id,
          userId: order.seller_id,
          type: 'P2P_SALE',
          title: `Intercambiaste "${coupon.product_name}" en P2P (+Créditos Gold al canje TPV)`,
          amount: breakdown.netSellerProceeds,
          relatedCouponId: coupon.coupon_id,
          relatedOrderId: orderId,
        };
        await emitEvent(tx, buyEv);
        await emitEvent(tx, saleEv);
        events.push(buyEv, saleEv);

        const fresh = await findOrderById(tx, tenant.tenant_id, orderId);
        return { row: fresh!, nominal };
      }),
  );

  notifyCommittedEvents(ctx.eventHub, events);
  return toOrderDTO(tenant, matched.row, matched.nominal);
}

function assertSellerCanCancel(order: OrderRow | null, orderId: string, sellerId: string): OrderRow {
  if (!order) {
    throw new AppError(ErrorCode.ORDER_NOT_FOUND, 'Orden no encontrada.', { orderId });
  }
  if (order.seller_id !== sellerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Sólo el vendedor puede cancelar la orden.');
  }
  if (order.status !== 'OPEN') {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden no está abierta.', { status: order.status });
  }
  return order;
}

export async function cancelPublication(
  ctx: ServiceContext,
  tenant: TenantRow,
  orderId: string,
  sellerId: string,
): Promise<{ ok: true }> {
  const order = assertSellerCanCancel(
    await findOrderById(ctx.db, tenant.tenant_id, orderId),
    orderId,
    sellerId,
  );
  const events: UserEventInput[] = [];

  await withLock(ctx.lockManager, couponLockKey(order.coupon_id), ctx.config.lockTtlMs, () =>
    ctx.db.transactionSerializable(async (tx) => {
      events.length = 0;
      const affected = await cancelOrderIfOpen(tx, orderId);
      if (affected === 0) {
        throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya fue ejecutada o cancelada.');
      }
      await updateCouponState(tx, order.coupon_id, CouponState.EN_WALLET);
      const ev: UserEventInput = {
        tenantId: tenant.tenant_id,
        userId: sellerId,
        type: 'P2P_CANCELLED',
        title: 'Cancelaste una publicación P2P',
        relatedCouponId: order.coupon_id,
        relatedOrderId: orderId,
      };
      await emitEvent(tx, ev);
      events.push(ev);
    }),
  );

  notifyCommittedEvents(ctx.eventHub, events);
  return { ok: true };
}
