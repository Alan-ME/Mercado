import { describe, it, expect } from 'vitest';
import { FeeCalculator } from '../src/domain/calculators/feeCalculator.js';

describe('FeeCalculator (RN-03 Take-Rate Split con Decimal.js)', () => {
  it('debe calcular comisiones exactas para una venta de $100 con 3.5% vendedor y 2.5% comprador', () => {
    const breakdown = FeeCalculator.calculateBreakdown({
      nominalPrice: 100,
      askingPrice: 100,
      sellerTakeRatePct: 3.50,
      buyerTakeRatePct: 2.50,
      platformRevenueSharePct: 30.00
    });

    expect(breakdown.sellerFeeAmount).toBe(3.50);
    expect(breakdown.netSellerProceeds).toBe(96.50);
    expect(breakdown.buyerFeeAmount).toBe(2.50);
    expect(breakdown.totalBuyerPrice).toBe(102.50);
    expect(breakdown.platformShareAmount).toBe(1.80);
    expect(breakdown.tenantRetainedFee).toBe(4.20);
  });

  it('debe manejar redondeos financieros bancarios sin errores de coma flotante de JS', () => {
    const breakdown = FeeCalculator.calculateBreakdown({
      nominalPrice: 75.33,
      askingPrice: 87.65,
      sellerTakeRatePct: 3.33,
      buyerTakeRatePct: 2.22,
      platformRevenueSharePct: 30.00
    });

    expect(breakdown.sellerFeeAmount).toBe(2.92);
    expect(breakdown.netSellerProceeds).toBe(84.73);
    expect(breakdown.buyerFeeAmount).toBe(1.95);
    expect(breakdown.totalBuyerPrice).toBe(89.60);
  });
});
