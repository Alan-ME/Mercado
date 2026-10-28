import { Decimal } from 'decimal.js';
import { d, money } from './money.js';

/**
 * Banda de precios (Price Collar) — RN-02.
 *
 * Convención adoptada: price_floor_pct y price_ceiling_pct son PORCENTAJE DIRECTO
 * del valor nominal (floor 50 => 50% del nominal; ceiling 200 => 200% del nominal).
 * Es la convención de: DDL (default 50/200), Protocolo DTO ("% del nominal"),
 * la matriz .xlsx, el criterio BDD de US-03 (piso 50%=$50, techo 200%=$200, rechazar $250)
 * y el criterio QA-01 ("$250 sobre nominal $100 con techo 200% => HTTP 422").
 * (El texto de REQ-002 §RN-02 usa V0*(1±) pero su propio ejemplo se contradice con
 *  los valores por defecto; se prioriza la convención verificable por QA.)
 */
export interface PriceCollar {
  min: number;
  max: number;
}

export function computePriceCollar(
  nominalPrice: Decimal.Value,
  priceFloorPct: Decimal.Value,
  priceCeilingPct: Decimal.Value,
): PriceCollar {
  const nominal = d(nominalPrice);
  return {
    min: money(nominal.mul(new Decimal(priceFloorPct).div(100))),
    max: money(nominal.mul(new Decimal(priceCeilingPct).div(100))),
  };
}

export function isWithinCollar(
  askingPrice: Decimal.Value,
  collar: PriceCollar,
): boolean {
  const p = d(askingPrice);
  return p.gte(collar.min) && p.lte(collar.max);
}
