import { FeeCalculator } from '../../domain/calculators/feeCalculator.js';
import { PriceCollarCalculator } from '../../domain/calculators/priceCollarCalculator.js';
import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { TenantConfig } from '../../domain/entities/index.js';
import { NotFoundError } from '../../shared/errors.js';

export interface SimulateQuoteInput {
  tenant: TenantConfig;
  askingPrice: number;
  nominalPrice?: number;
  couponId?: string;
}

export class SimulateQuoteUseCase {
  public static async execute(input: SimulateQuoteInput) {
    const { tenant, askingPrice } = input;
    let nominalPrice = input.nominalPrice;

    if (nominalPrice === undefined && input.couponId) {
      const coupon = await CouponRepository.findById(tenant.tenantId, input.couponId);
      if (!coupon) {
        throw new NotFoundError(`El cupón '${input.couponId}' no fue encontrado.`);
      }
      nominalPrice = coupon.nominalPrice;
    }

    if (nominalPrice === undefined) {
      nominalPrice = 100.00; // Valor nominal de referencia por defecto
    }

    const { minPrice, maxPrice } = PriceCollarCalculator.calculateRange(
      nominalPrice,
      tenant.priceFloorPct,
      tenant.priceCeilingPct
    );

    const isWithinCollar = askingPrice >= minPrice.toNumber() && askingPrice <= maxPrice.toNumber();

    const breakdown = FeeCalculator.calculateBreakdown({
      nominalPrice,
      askingPrice,
      sellerTakeRatePct: tenant.sellerTakeRatePct,
      buyerTakeRatePct: tenant.buyerTakeRatePct,
      platformRevenueSharePct: tenant.platformRevenueSharePct
    });

    return {
      simulation: breakdown,
      priceCollar: {
        nominalPrice,
        minPrice: minPrice.toNumber(),
        maxPrice: maxPrice.toNumber(),
        isWithinCollar
      }
    };
  }
}
