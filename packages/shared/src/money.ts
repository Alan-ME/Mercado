import { Decimal } from 'decimal.js';
import type { CommissionBreakdown } from './dtos.js';

/**
 * Aritmética monetaria exacta.
 * Regla obligatoria (Hoja de Ruta Rol 1): toda operación de divisas/porcentajes
 * usa decimal.js. JAMÁS `Number` flotante nativo.
 */

// 2 decimales, redondeo bancario estándar HALF_UP para importes de caja.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const MONEY_DP = 2;

export function d(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

/** Redondea a 2 decimales (centavos) y devuelve number para DTOs. */
export function money(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(MONEY_DP).toNumber();
}

/** Cadena fija de 2 decimales para persistencia DECIMAL exacta. */
export function moneyStr(value: Decimal.Value): string {
  return new Decimal(value).toDecimalPlaces(MONEY_DP).toFixed(MONEY_DP);
}

/** aplica un porcentaje (ej. 3.5 -> 3.5%) sobre un monto base. */
export function pctOf(base: Decimal.Value, pct: Decimal.Value): Decimal {
  return new Decimal(base).mul(new Decimal(pct).div(100));
}

/**
 * Cálculo del split de comisiones P2P (RN-03).
 * Verificado contra 03_Matriz_de_Comisiones_y_Monetizacion_WhiteLabel.xlsx:
 *  - V0=100, P=100, s=3.5%, b=2.5% -> sellerFee 3.50, buyerFee 2.50, fees 6.00, core 1.80
 *  - V0=100, P=150                 -> 5.25, 3.75, 9.00, 2.70
 *  - V0=100, P=70                  -> 2.45, 1.75, 4.20, 1.26
 *  - V0=500, P=750                 -> 26.25, 18.75, 45.00, 13.50
 */
export function computeCommission(params: {
  nominalPrice: Decimal.Value;
  askingPrice: Decimal.Value;
  sellerTakeRatePct: Decimal.Value;
  buyerTakeRatePct: Decimal.Value;
}): CommissionBreakdown {
  const nominal = d(params.nominalPrice);
  const asking = d(params.askingPrice);
  const sellerFee = pctOf(asking, params.sellerTakeRatePct);
  const buyerFee = pctOf(asking, params.buyerTakeRatePct);

  return {
    nominalPrice: money(nominal),
    askingPrice: money(asking),
    sellerFeePct: new Decimal(params.sellerTakeRatePct).toNumber(),
    sellerFeeAmount: money(sellerFee),
    netSellerProceeds: money(asking.minus(sellerFee)),
    buyerFeePct: new Decimal(params.buyerTakeRatePct).toNumber(),
    buyerFeeAmount: money(buyerFee),
    totalBuyerPrice: money(asking.plus(buyerFee)),
  };
}

/** Total de comisiones brutas cobradas por transacción P2P (vendedor + comprador). */
export function totalFees(breakdown: CommissionBreakdown): number {
  return money(d(breakdown.sellerFeeAmount).plus(breakdown.buyerFeeAmount));
}

/** Reparto para SMCTA Core (fee de software) sobre el total de comisiones. */
export function platformShare(
  breakdown: CommissionBreakdown,
  platformRevenueSharePct: Decimal.Value,
): number {
  return money(pctOf(totalFees(breakdown), platformRevenueSharePct));
}

/** Neto que retiene el comercio (Tenant) tras el reparto con SMCTA Core. */
export function tenantNetFees(
  breakdown: CommissionBreakdown,
  platformRevenueSharePct: Decimal.Value,
): number {
  return money(d(totalFees(breakdown)).minus(platformShare(breakdown, platformRevenueSharePct)));
}
