import type { Queryable } from '../db/database.js';
import { moneyStr } from '@smcta/shared';
import { toNum, toIso } from './mappers.js';
import type { EventHub } from '../infra/eventHub.js';

export type UserEventType =
  | 'PRIMARY_PURCHASE'
  | 'P2P_LISTED'
  | 'P2P_SALE'
  | 'P2P_BUY'
  | 'REDEEM'
  | 'P2P_CANCELLED';

export interface UserEventInput {
  tenantId: string;
  userId: string;
  type: UserEventType;
  title: string;
  amount?: number;
  relatedCouponId?: string | null;
  relatedOrderId?: string | null;
}

export interface UserEventDTO {
  eventId: string;
  type: UserEventType;
  title: string;
  amount: number;
  isRead: boolean;
  relatedCouponId: string | null;
  relatedOrderId: string | null;
  createdAt: string;
}

function defaultAmount(amount: number | undefined): number {
  return amount === undefined ? 0 : amount;
}

function nullableId(id: string | null | undefined): string | null {
  return id ? id : null;
}

// Acá solo insertamos en la tabla dentro de la transacción. El push SSE va afuera
// del bloque SERIALIZABLE con notifyCommittedEvents para no emitir basura si hay retry.
export async function emitEvent(q: Queryable, e: UserEventInput): Promise<void> {
  await q.query(
    `INSERT INTO user_events (tenant_id, user_id, type, title, amount, related_coupon_id, related_order_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      e.tenantId,
      e.userId,
      e.type,
      e.title,
      moneyStr(defaultAmount(e.amount)),
      nullableId(e.relatedCouponId),
      nullableId(e.relatedOrderId),
    ],
  );
}

export function notifyCommittedEvents(hub: EventHub, events: UserEventInput[]): void {
  for (const e of events) {
    hub.publish(e);
  }
}

interface EventRow {
  event_id: string;
  type: UserEventType;
  title: string;
  amount: string | number;
  is_read: boolean;
  related_coupon_id: string | null;
  related_order_id: string | null;
  created_at: string | Date;
}

function toDTO(r: EventRow): UserEventDTO {
  return {
    eventId: r.event_id,
    type: r.type,
    title: r.title,
    amount: toNum(r.amount),
    isRead: r.is_read,
    relatedCouponId: r.related_coupon_id,
    relatedOrderId: r.related_order_id,
    createdAt: toIso(r.created_at),
  };
}

export async function listEvents(
  db: Queryable,
  tenantId: string,
  userId: string,
  opts: { type?: UserEventType; limit?: number } = {},
): Promise<UserEventDTO[]> {
  const limit = opts.limit === undefined ? 50 : opts.limit;
  const params: unknown[] = [tenantId, userId];
  let where = 'tenant_id = $1 AND user_id = $2';
  if (opts.type) {
    params.push(opts.type);
    where += ` AND type = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await db.query<EventRow>(
    `SELECT event_id, type, title, amount, is_read, related_coupon_id, related_order_id, created_at
     FROM user_events WHERE ${where}
     ORDER BY created_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(toDTO);
}

export async function countUnread(
  db: Queryable,
  tenantId: string,
  userId: string,
): Promise<number> {
  const { rows } = await db.query<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM user_events
     WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE`,
    [tenantId, userId],
  );
  const first = rows[0];
  return first ? Number(first.n) : 0;
}

export async function markAllRead(
  db: Queryable,
  tenantId: string,
  userId: string,
): Promise<void> {
  await db.query(
    `UPDATE user_events SET is_read = TRUE
     WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE`,
    [tenantId, userId],
  );
}
