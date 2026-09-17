import Decimal from 'decimal.js';
import { CommissionBreakdown } from '../entities/index.js';

export class FeeCalculator {
  public static calculateBreakdown(params: {
    nominalPrice: number | string | Decimal;
    askingPrice: number | string | Decimal;
    sellerTakeRatePct: number | string | Decimal;
    buyerTakeRatePct: number | string | Decimal;
    platformRevenueSharePct?: number | string | Decimal;
  }): CommissionBreakdown & { tenantRetainedFee: number } {
    const nominalPrice = new Decimal(params.nominalPrice);
    const askingPrice = new Decimal(params.askingPrice);
    const sellerFeePct = new Decimal(params.sellerTakeRatePct);
    const buyerFeePct = new Decimal(params.buyerTakeRatePct);
    const platformSharePct = new Decimal(params.platformRevenueSharePct ?? 30.00);

    const sellerFeeAmount = askingPrice
      .times(sellerFeePct.dividedBy(100))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const netSellerProceeds = askingPrice
      .minus(sellerFeeAmount)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const buyerFeeAmount = askingPrice
      .times(buyerFeePct.dividedBy(100))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const totalBuyerPrice = askingPrice
      .plus(buyerFeeAmount)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const totalFees = sellerFeeAmount.plus(buyerFeeAmount);

    const platformShareAmount = totalFees
      .times(platformSharePct.dividedBy(100))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const tenantRetainedFee = totalFees
      .minus(platformShareAmount)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      nominalPrice: nominalPrice.toNumber(),
      askingPrice: askingPrice.toNumber(),
      sellerFeePct: sellerFeePct.toNumber(),
      sellerFeeAmount: sellerFeeAmount.toNumber(),
      netSellerProceeds: netSellerProceeds.toNumber(),
      buyerFeePct: buyerFeePct.toNumber(),
      buyerFeeAmount: buyerFeeAmount.toNumber(),
      totalBuyerPrice: totalBuyerPrice.toNumber(),
      platformShareAmount: platformShareAmount.toNumber(),
      tenantRetainedFee: tenantRetainedFee.toNumber()
    };
  }
}
