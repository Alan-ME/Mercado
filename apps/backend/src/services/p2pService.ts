import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
  computeCommission,
  computePriceCollar,
  isWithinCollar,
  totalFees,
  platformShare,
  type P2POrderDTO,
  type PublishOrderRequest,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import { type TenantRow, toNum, orderToDTO } from '../repositories/mappers.js';
import { findCouponById, transferAndReissue, updateCouponState } from '../repositories/couponRepo.js';
import {
  insertSellOrder,
  findOpenOrdersByTenant,
  findOrderById,
  countOpenOrdersBySeller,
  matchOrderIfOpen,
  cancelOrder,
} from '../repositories/orderRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { couponLockKey, withLock } from '../infra/lockManager.js';
import { generateQrToken } from '../domain/qrToken.js';
import { emitEvent } from '../repositories/eventRepo.js';

function rates(tenant: TenantRow) {
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

function toOrderDTO(tenant: TenantRow, row: Parameters<typeof orderToDTO>[0], nominal: number): P2POrderDTO {
  const r = rates(tenant);
  return orderToDTO(row, nominal, r.seller, r.buyer);
}

/**
 * US-03 / TASK-004: publica un cupón en el mercado P2P.
 * Valida propiedad, estado EN_WALLET, ventana (RN-06), límite diario (RN-05)
 * y banda de precios (RN-02 => PRICE_COLLAR_VIOLATION / HTTP 422).
 */
export async function publishOrder(
  ctx: ServiceContext,
  tenant: TenantRow,
  req: PublishOrderRequest,
): Promise<P2POrderDTO> {
  const r = rates(tenant);
  const coupon = await findCouponById(ctx.db, tenant.tenant_id, req.couponId);
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId: req.couponId });
  }
  if (coupon.current_owner_id !== req.sellerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'El cupón no pertenece al vendedor indicado.');
  }
  if (coupon.state !== CouponState.EN_WALLET) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      `Sólo se puede publicar un cupón EN_WALLET (estado actual: ${coupon.state}).`,
      { state: coupon.state },
    );
  }

  // RN-06: ventana de reventa cerrada N horas antes del evento/caducidad.
  const expiration = new Date(coupon.expiration_date).getTime();
  const cutoff = expiration - r.closureHours * 3_600_000;
  if (Date.now() >= cutoff) {
    throw new AppError(
      ErrorCode.P2P_WINDOW_CLOSED,
      `La ventana P2P cierra ${r.closureHours}h antes del evento.`,
      { closesAt: new Date(cutoff).toISOString() },
    );
  }

  // RN-05: límite de publicaciones activas por usuario.
  const openCount = await countOpenOrdersBySeller(ctx.db, tenant.tenant_id, req.sellerId);
  if (openCount >= r.maxResales) {
    throw new AppError(
      ErrorCode.DAILY_RESALE_LIMIT_REACHED,
      `Superó el máximo de ${r.maxResales} publicaciones P2P activas.`,
      { openCount, max: r.maxResales },
    );
  }

  // RN-02: banda de precios.
  const nominal = toNum(coupon.nominal_price);
  const collar = computePriceCollar(nominal, r.floor, r.ceiling);
  if (!isWithinCollar(req.askingPrice, collar)) {
    throw new AppError(
      ErrorCode.PRICE_COLLAR_VIOLATION,
      req.askingPrice > collar.max
        ? `El precio excede el límite máximo permitido de $${collar.max.toFixed(2)}.`
        : `El precio está por debajo del límite mínimo permitido de $${collar.min.toFixed(2)}.`,
      { askingPrice: req.askingPrice, min: collar.min, max: collar.max },
    );
  }

  const orderRow = await withLock(
    ctx.lockManager,
    couponLockKey(req.couponId),
    ctx.config.lockTtlMs,
    () =>
      ctx.db.transactionSerializable(async (tx) => {
        const fresh = await findCouponById(tx, tenant.tenant_id, req.couponId);
        if (!fresh || fresh.state !== CouponState.EN_WALLET) {
          throw new AppError(ErrorCode.COUPON_NOT_IN_WALLET, 'El cupón ya no está disponible para publicar.');
        }
        await updateCouponState(tx, req.couponId, CouponState.PUBLICADO_P2P);
        const created = await insertSellOrder(tx, {
          tenantId: tenant.tenant_id,
          couponId: req.couponId,
          sellerId: req.sellerId,
          askingPrice: req.askingPrice,
        });
        await emitEvent(tx, {
          tenantId: tenant.tenant_id,
          userId: req.sellerId,
          type: 'P2P_LISTED',
          title: `Publicaste "${fresh.product_name}" a $${req.askingPrice.toFixed(2)}`,
          amount: req.askingPrice,
          relatedCouponId: req.couponId,
          relatedOrderId: created.order_id,
        });
        return created;
      }),
  );

  return toOrderDTO(tenant, orderRow, nominal);
}

/** US-04: listado público del libro de órdenes (sólo OPEN), filtrado por tenant. */
export async function listOpenOrders(
  ctx: ServiceContext,
  tenant: TenantRow,
): Promise<P2POrderDTO[]> {
  const orders = await findOpenOrdersByTenant(ctx.db, tenant.tenant_id);
  const result: P2POrderDTO[] = [];
  for (const o of orders) {
    const coupon = await findCouponById(ctx.db, tenant.tenant_id, o.coupon_id);
    const nominal = coupon ? toNum(coupon.nominal_price) : 0;
    result.push(toOrderDTO(tenant, o, nominal));
  }
  return result;
}

/**
 * US-04 / TASK-006: ejecuta el match atómico de compra P2P.
 * - Lock sobre lock:coupon:{id} (perdedor => P2P_ORDER_LOCKED / 423).
 * - Transacción SERIALIZABLE: UPDATE condicional (status='OPEN') garantiza 1 solo ganador.
 * - Split de comisiones (RN-03), transferencia de propiedad y re-emisión del token.
 * - Asiento P2P_SPLIT (delta escrow 0; acumula fees de comercio y de SMCTA Core).
 */
export async function buyOrder(
  ctx: ServiceContext,
  tenant: TenantRow,
  orderId: string,
  buyerId: string,
): Promise<P2POrderDTO> {
  if (!buyerId) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'buyerId es obligatorio.');
  }
  const pre = await findOrderById(ctx.db, tenant.tenant_id, orderId);
  if (!pre) {
    throw new AppError(ErrorCode.ORDER_NOT_FOUND, 'Orden no encontrada.', { orderId });
  }
  if (pre.status !== 'OPEN') {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya no está abierta.', { status: pre.status });
  }
  if (pre.seller_id === buyerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'No podés comprar tu propia orden.');
  }

  const r = rates(tenant);

  const matched = await withLock(
    ctx.lockManager,
    couponLockKey(pre.coupon_id),
    ctx.config.lockTtlMs,
    () =>
      ctx.db.transactionSerializable(async (tx) => {
        const order = await findOrderById(tx, tenant.tenant_id, orderId);
        if (!order || order.status !== 'OPEN') {
          throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya fue tomada por otro usuario.');
        }
        const coupon = await findCouponById(tx, tenant.tenant_id, order.coupon_id);
        if (!coupon || coupon.state !== CouponState.PUBLICADO_P2P) {
          throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'El cupón de la orden ya no está publicado.');
        }

        const nominal = toNum(coupon.nominal_price);
        const asking = toNum(order.asking_price);
        const breakdown = computeCommission({
          nominalPrice: nominal,
          askingPrice: asking,
          sellerTakeRatePct: r.seller,
          buyerTakeRatePct: r.buyer,
        });

        // UPDATE condicional: si 0 filas, otro comprador ganó la carrera.
        const affected = await matchOrderIfOpen(tx, orderId, buyerId, breakdown);
        if (affected === 0) {
          throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden ya fue tomada por otro usuario.');
        }

        // Re-emisión de token y transferencia de propiedad al comprador.
        const { token } = generateQrToken({
          couponId: coupon.coupon_id,
          tenantId: tenant.tenant_id,
          ownerId: buyerId,
          secret: tenant.qr_secret,
        });
        await transferAndReissue(tx, coupon.coupon_id, buyerId, token);

        // Asiento contable del split. El depósito primario permanece en escrow (delta 0).
        await insertLedgerEntry(tx, {
          tenantId: tenant.tenant_id,
          couponId: coupon.coupon_id,
          transactionType: LedgerTransactionType.P2P_SPLIT,
          amountInEscrow: 0,
          tenantFeeAccumulated: totalFees(breakdown),
          platformFee: platformShare(breakdown, r.platformShare),
          relatedOrderId: orderId,
        });

        // Eventos de actividad para comprador y vendedor.
        await emitEvent(tx, {
          tenantId: tenant.tenant_id,
          userId: buyerId,
          type: 'P2P_BUY',
          title: `Compraste "${coupon.product_name}" por $${breakdown.totalBuyerPrice.toFixed(2)}`,
          amount: breakdown.totalBuyerPrice,
          relatedCouponId: coupon.coupon_id,
          relatedOrderId: orderId,
        });
        await emitEvent(tx, {
          tenantId: tenant.tenant_id,
          userId: order.seller_id,
          type: 'P2P_SALE',
          title: `Vendiste "${coupon.product_name}", recibiste $${breakdown.netSellerProceeds.toFixed(2)}`,
          amount: breakdown.netSellerProceeds,
          relatedCouponId: coupon.coupon_id,
          relatedOrderId: orderId,
        });

        const fresh = await findOrderById(tx, tenant.tenant_id, orderId);
        return { row: fresh!, nominal };
      }),
  );

  return toOrderDTO(tenant, matched.row, matched.nominal);
}

/** RN-01: cancelar la publicación devuelve el cupón a EN_WALLET (habilita canje). */
export async function cancelPublication(
  ctx: ServiceContext,
  tenant: TenantRow,
  orderId: string,
  sellerId: string,
): Promise<{ ok: true }> {
  const order = await findOrderById(ctx.db, tenant.tenant_id, orderId);
  if (!order) {
    throw new AppError(ErrorCode.ORDER_NOT_FOUND, 'Orden no encontrada.', { orderId });
  }
  if (order.seller_id !== sellerId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Sólo el vendedor puede cancelar la orden.');
  }
  if (order.status !== 'OPEN') {
    throw new AppError(ErrorCode.ORDER_NOT_OPEN, 'La orden no está abierta.', { status: order.status });
  }

  await withLock(ctx.lockManager, couponLockKey(order.coupon_id), ctx.config.lockTtlMs, () =>
    ctx.db.transactionSerializable(async (tx) => {
      await cancelOrder(tx, orderId);
      await updateCouponState(tx, order.coupon_id, CouponState.EN_WALLET);
      await emitEvent(tx, {
        tenantId: tenant.tenant_id,
        userId: sellerId,
        type: 'P2P_CANCELLED',
        title: 'Cancelaste una publicación P2P',
        relatedCouponId: order.coupon_id,
        relatedOrderId: orderId,
      });
    }),
  );
  return { ok: true };
}
