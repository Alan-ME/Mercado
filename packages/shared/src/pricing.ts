import { Decimal } from 'decimal.js';
import { d, money } from './money.js';

// Banda de precios anti-especulación (Price Collar):
// Protege al consumidor final para que nadie compre cupones baratos y los revenda a precios astronómicos,
// ni los liquide a precio de remate destruyendo la marca del comercio.
//
// OJO con la fórmula: price_floor_pct y price_ceiling_pct representan el porcentaje directo sobre el valor nominal.
// Ej. piso 50% de $100 = $50.00; techo 200% de $100 = $200.00.
// Cualquier orden fuera de ese rango rebota con HTTP 422 (PRICE_COLLAR_VIOLATION).
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
