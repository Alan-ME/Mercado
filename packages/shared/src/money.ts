import { Decimal } from 'decimal.js';
import type { CommissionBreakdown } from './dtos.js';

/**
 * Aritmética monetaria de alta precisión:
 * Toda operación de divisas, comisiones y porcentajes se ejecuta obligatoriamente con decimal.js.
 * Evitamos cualquier uso de `Number` IEEE-754 flotante nativo para operaciones intermedias.
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
 * Cálculo del split de comisiones del mercado secundario P2P:
 * Desglosa monto cobrado al vendedor, recargo al comprador, neto final a percibir
 * y precio total a abonar, redondeando a 2 decimales según estándar bancario.
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
