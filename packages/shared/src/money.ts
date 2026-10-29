import { Decimal } from 'decimal.js';
import type { CommissionBreakdown } from './dtos.js';

/**
 * Aritmética monetaria exacta.
 * Regla obligatoria (Hoja de Ruta Rol 1): toda operación de divisas/porcentajes
 * usa decimal.js. JAMÁS `Number` flotante nativo.
 */

// Si usás Number nativo de JS para plata, en dos transacciones tenés 0.1 + 0.2 = 0.30000000000000004
// y la auditoría de Escrow te va a tirar diferencias de centavos fantasmas que no le podés explicar a nadie.
// Clavamos 40 dígitos de precisión interna y redondeo bancario HALF_UP antes de bajar a los 2 decimales finales.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const MONEY_DP = 2;

export function d(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

// Redondea a 2 decimales fijos (centavos) para devolver un number limpio en DTOs y JSON.
export function money(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(MONEY_DP).toNumber();
}

// Para SQL y parámetros de base de datos usamos string con exactamente 2 decimales.
// Pasar floats crudos al driver de Postgres es buscarse problemas de casteo silencioso.
export function moneyStr(value: Decimal.Value): string {
  return new Decimal(value).toDecimalPlaces(MONEY_DP).toFixed(MONEY_DP);
}

// Calcula porcentaje base * (pct / 100). Lo hacemos en este orden para no perder precisión en la división intermedia.
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

// Comisiones brutas totales cobradas en la operación (lo que paga el comprador + lo que resigna el vendedor).
export function totalFees(breakdown: CommissionBreakdown): number {
  return money(d(breakdown.sellerFeeAmount).plus(breakdown.buyerFeeAmount));
}

// Tajada que le corresponde a SMCTA Core como proveedor de la plataforma de trading.
export function platformShare(
  breakdown: CommissionBreakdown,
  platformRevenueSharePct: Decimal.Value,
): number {
  return money(pctOf(totalFees(breakdown), platformRevenueSharePct));
}

// OJO ACÁ: antes se guardaba el bruto acá Y además el fee de plataforma en otra columna,
// lo que inventaba plata mágica en el balance. El comercio sólo se queda con totalFees MENOS platformShare.
export function tenantNetFees(
  breakdown: CommissionBreakdown,
  platformRevenueSharePct: Decimal.Value,
): number {
  return money(d(totalFees(breakdown)).minus(platformShare(breakdown, platformRevenueSharePct)));
}
