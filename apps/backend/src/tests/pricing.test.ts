import { describe, it, expect } from 'vitest';
import { computePriceCollar, isWithinCollar } from '@smcta/shared';

describe('Price Collar (RN-02)', () => {
  it('nominal 100, piso 50%, techo 200% => [50, 200]', () => {
    const collar = computePriceCollar(100, 50, 200);
    expect(collar).toEqual({ min: 50, max: 200 });
  });

  it('acepta un precio dentro de la banda ($140)', () => {
    const collar = computePriceCollar(100, 50, 200);
    expect(isWithinCollar(140, collar)).toBe(true);
  });

  it('rechaza $250 sobre nominal 100 con techo 200% (criterio QA-01)', () => {
    const collar = computePriceCollar(100, 50, 200);
    expect(isWithinCollar(250, collar)).toBe(false);
  });

  it('rechaza por debajo del piso ($40)', () => {
    const collar = computePriceCollar(100, 50, 200);
    expect(isWithinCollar(40, collar)).toBe(false);
  });

  it('los límites son inclusivos', () => {
    const collar = computePriceCollar(100, 50, 200);
    expect(isWithinCollar(50, collar)).toBe(true);
    expect(isWithinCollar(200, collar)).toBe(true);
  });
});
