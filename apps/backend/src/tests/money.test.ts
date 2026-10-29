import { describe, it, expect } from 'vitest';
import { computeCommission, totalFees, platformShare } from '@smcta/shared';

/**
 * Verificación matemática del split de comisiones y monetización:
 * Comprueba que el neto al vendedor, el cargo al comprador y el revenue share de la plataforma
 * coincidan al centavo exacto sin desvíos de redondeo en IEEE-754.
 */
const CASES = [
  { v0: 100, p: 100, sellerFee: 3.5, buyerFee: 2.5, fees: 6.0, core: 1.8 },
  { v0: 100, p: 150, sellerFee: 5.25, buyerFee: 3.75, fees: 9.0, core: 2.7 },
  { v0: 100, p: 70, sellerFee: 2.45, buyerFee: 1.75, fees: 4.2, core: 1.26 },
  { v0: 100, p: 200, sellerFee: 7.0, buyerFee: 5.0, fees: 12.0, core: 3.6 },
  { v0: 500, p: 750, sellerFee: 26.25, buyerFee: 18.75, fees: 45.0, core: 13.5 },
];

describe('Cálculo de comisiones y revenue share de plataforma', () => {
  for (const c of CASES) {
    it(`V0=${c.v0} P=${c.p} => fees ${c.fees}, SMCTA Core ${c.core}`, () => {
      const b = computeCommission({
        nominalPrice: c.v0,
        askingPrice: c.p,
        sellerTakeRatePct: 3.5,
        buyerTakeRatePct: 2.5,
      });
      expect(b.sellerFeeAmount).toBe(c.sellerFee);
      expect(b.buyerFeeAmount).toBe(c.buyerFee);
      expect(b.netSellerProceeds).toBe(c.p - c.sellerFee);
      expect(b.totalBuyerPrice).toBe(c.p + c.buyerFee);
      expect(totalFees(b)).toBe(c.fees);
      expect(platformShare(b, 30)).toBe(c.core);
    });
  }
});
