import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { PriceCollarCalculator } from '../../domain/calculators/priceCollarCalculator.js';
import { TenantConfig } from '../../domain/entities/index.js';
import { NotFoundError } from '../../shared/errors.js';

export interface GetPriceRangeInput {
  tenant: TenantConfig;
  couponId: string;
}

export class GetPriceRangeUseCase {
  public static async execute(input: GetPriceRangeInput) {
    const { tenant, couponId } = input;

    const coupon = await CouponRepository.findById(tenant.tenantId, couponId);
    if (!coupon) {
      throw new NotFoundError(`El cupón '${couponId}' no fue encontrado.`);
    }

    const { minPrice, maxPrice } = PriceCollarCalculator.calculateRange(
      coupon.nominalPrice,
      tenant.priceFloorPct,
      tenant.priceCeilingPct
    );

    return {
      couponId,
      nominalPrice: coupon.nominalPrice,
      minPrice: minPrice.toNumber(),
      maxPrice: maxPrice.toNumber(),
      priceFloorPct: Number(tenant.priceFloorPct),
      priceCeilingPct: Number(tenant.priceCeilingPct)
    };
  }
}
