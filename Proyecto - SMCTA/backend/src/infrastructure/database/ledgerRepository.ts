import pg from 'pg';
import { Database } from './db.js';
import { LedgerTransactionType } from '../../domain/entities/index.js';
import Decimal from 'decimal.js';

export interface LedgerEntry {
  ledgerId: string;
  tenantId: string;
  couponId: string;
  transactionType: LedgerTransactionType;
  amountInEscrow: number;
  tenantFeeAccumulated: number;
  createdAt: string;
}

export class LedgerRepository {
  private static mapRow(row: any): LedgerEntry {
    return {
      ledgerId: row.ledgerId,
      tenantId: row.tenantId,
      couponId: row.couponId,
      transactionType: row.transactionType as LedgerTransactionType,
      amountInEscrow: new Decimal(row.amountInEscrow).toNumber(),
      tenantFeeAccumulated: new Decimal(row.tenantFeeAccumulated).toNumber(),
      createdAt: row.createdAt
    };
  }

  public static async recordEntry(
    data: {
      tenantId: string;
      couponId: string;
      transactionType: LedgerTransactionType;
      amountInEscrow: number;
      tenantFeeAccumulated?: number;
    },
    client?: pg.PoolClient
  ): Promise<LedgerEntry> {
    const sql = `
      INSERT INTO escrow_ledgers (
        tenant_id, coupon_id, transaction_type, amount_in_escrow, tenant_fee_accumulated
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING 
        ledger_id AS "ledgerId",
        tenant_id AS "tenantId",
        coupon_id AS "couponId",
        transaction_type AS "transactionType",
        amount_in_escrow AS "amountInEscrow",
        tenant_fee_accumulated AS "tenantFeeAccumulated",
        created_at AS "createdAt";
    `;

    const params = [
      data.tenantId,
      data.couponId,
      data.transactionType,
      data.amountInEscrow,
      data.tenantFeeAccumulated || 0.00
    ];

    const res = client
      ? await client.query(sql, params)
      : await Database.query(sql, params);

    return this.mapRow(res.rows[0]);
  }

  public static async getEntriesByTenant(tenantId: string): Promise<LedgerEntry[]> {
    const sql = `
      SELECT 
        ledger_id AS "ledgerId",
        tenant_id AS "tenantId",
        coupon_id AS "couponId",
        transaction_type AS "transactionType",
        amount_in_escrow AS "amountInEscrow",
        tenant_fee_accumulated AS "tenantFeeAccumulated",
        created_at AS "createdAt"
      FROM escrow_ledgers
      WHERE tenant_id = $1
      ORDER BY created_at ASC;
    `;

    const res = await Database.query(sql, [tenantId]);
    return res.rows.map((r) => this.mapRow(r));
  }
}
