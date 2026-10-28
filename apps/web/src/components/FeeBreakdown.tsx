import { computeCommission } from '@smcta/shared';

/** Desglose de comisiones en vivo (RN-03), como en la Guía UX §3.2. */
export function FeeBreakdown({
  nominalPrice,
  askingPrice,
  sellerTakeRatePct,
  buyerTakeRatePct,
}: {
  nominalPrice: number;
  askingPrice: number;
  sellerTakeRatePct: number;
  buyerTakeRatePct: number;
}) {
  const b = computeCommission({ nominalPrice, askingPrice, sellerTakeRatePct, buyerTakeRatePct });
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
  return (
    <div className="space-y-1 rounded-brand bg-slate-50 p-3 text-sm">
      {row('Precio de venta', `$${b.askingPrice.toFixed(2)}`)}
      {row(`Comisión vendedor (${sellerTakeRatePct}%)`, `-$${b.sellerFeeAmount.toFixed(2)}`)}
      {row('Neto a recibir (vendedor)', `$${b.netSellerProceeds.toFixed(2)}`, true)}
      <div className="my-1 border-t border-slate-200" />
      {row(`Recargo comprador (${buyerTakeRatePct}%)`, `+$${b.buyerFeeAmount.toFixed(2)}`)}
      {row('Total a pagar (comprador)', `$${b.totalBuyerPrice.toFixed(2)}`, true)}
    </div>
  );
}
