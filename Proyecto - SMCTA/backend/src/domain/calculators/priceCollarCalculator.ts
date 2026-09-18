import Decimal from 'decimal.js';
import { PriceCollarViolationError } from '../../shared/errors.js';

export interface PriceRange {
  minPrice: Decimal;
  maxPrice: Decimal;
}

export class PriceCollarCalculator {
  public static calculateRange(
    nominalPrice: number | string | Decimal,
    priceFloorPct: number | string | Decimal,
    priceCeilingPct: number | string | Decimal
  ): PriceRange {
    const nominal = new Decimal(nominalPrice);
    const floorPct = new Decimal(priceFloorPct).dividedBy(100);
    const ceilingPct = new Decimal(priceCeilingPct).dividedBy(100);

    const minPrice = nominal.times(floorPct).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const maxPrice = nominal.times(ceilingPct).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return { minPrice, maxPrice };
  }

  public static validate(
    askingPrice: number | string | Decimal,
    nominalPrice: number | string | Decimal,
    priceFloorPct: number | string | Decimal,
    priceCeilingPct: number | string | Decimal
  ): void {
    const asking = new Decimal(askingPrice);
    const { minPrice, maxPrice } = this.calculateRange(nominalPrice, priceFloorPct, priceCeilingPct);

    if (asking.lessThan(minPrice) || asking.greaterThan(maxPrice)) {
      throw new PriceCollarViolationError(
        `Precio propuesto de $${asking.toFixed(2)} fuera de banda. Rango permitido: [$${minPrice.toFixed(2)}, $${maxPrice.toFixed(2)}].`,
        {
          askingPrice: asking.toNumber(),
          minPrice: minPrice.toNumber(),
          maxPrice: maxPrice.toNumber(),
          nominalPrice: new Decimal(nominalPrice).toNumber()
        }
      );
    }
  }
}
