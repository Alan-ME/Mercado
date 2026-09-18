import { describe, it, expect } from 'vitest';
import { PriceCollarCalculator } from '../src/domain/calculators/priceCollarCalculator.js';
import { PriceCollarViolationError } from '../src/shared/errors.js';

describe('PriceCollarCalculator (RN-02)', () => {
  it('debe calcular correctamente el rango [P_min, P_max] para nominal $100 (50% piso, 200% techo)', () => {
    const { minPrice, maxPrice } = PriceCollarCalculator.calculateRange(100, 50, 200);
    expect(minPrice.toNumber()).toBe(50.00);
    expect(maxPrice.toNumber()).toBe(200.00);
  });

  it('debe aceptar un precio dentro de la banda permitida', () => {
    expect(() => {
      PriceCollarCalculator.validate(120, 100, 50, 200);
    }).not.toThrow();

    expect(() => {
      PriceCollarCalculator.validate(50, 100, 50, 200);
    }).not.toThrow();

    expect(() => {
      PriceCollarCalculator.validate(200, 100, 50, 200);
    }).not.toThrow();
  });

  it('debe arrojar PriceCollarViolationError (HTTP 422) si el precio es inferior al piso', () => {
    expect(() => {
      PriceCollarCalculator.validate(49.99, 100, 50, 200);
    }).toThrowError(PriceCollarViolationError);
  });

  it('debe arrojar PriceCollarViolationError (HTTP 422) si el precio supera el techo', () => {
    expect(() => {
      PriceCollarCalculator.validate(200.01, 100, 50, 200);
    }).toThrowError(PriceCollarViolationError);
  });
});
