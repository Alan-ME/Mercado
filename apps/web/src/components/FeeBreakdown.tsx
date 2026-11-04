import { computeCommission } from '@smcta/shared';
import { money } from '../ui/kit';

function BreakdownRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`flex items-center justify-between tabular-nums ${tone ?? 'text-muted'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Ticket de liquidación en vivo: muestra cuánto recibe limpio el vendedor y cuánto paga el comprador
// antes de mandar la orden al libro P2P, usando la misma fórmula decimal.js del backend.
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

  return (
    <div className="space-y-1.5 rounded-ctl border border-line bg-raised p-3.5 text-sm">
      <BreakdownRow label="Precio de publicación" value={money(b.askingPrice)} />
      <BreakdownRow label={`Comisión vendedor (${sellerTakeRatePct}%)`} value={`-${money(b.sellerFeeAmount)}`} />
      <BreakdownRow label="Neto a recibir (vendedor)" value={money(b.netSellerProceeds)} tone="font-bold text-up" />
      <div className="my-1.5 border-t border-line" />
      <BreakdownRow label={`Recargo comprador (${buyerTakeRatePct}%)`} value={`+${money(b.buyerFeeAmount)}`} />
      <BreakdownRow label="Total a pagar (comprador)" value={money(b.totalBuyerPrice)} tone="font-bold text-fg" />
    </div>
  );
}
