import { useState } from 'react';
import { ArrowLeft, Check, Flame } from 'lucide-react';
import type { CoffeeProduct } from '../data/coffeeCatalog';
import { Card, money } from '../ui/kit';
import { useCart } from '../state/cart';

interface ProductDetailProps {
  product: CoffeeProduct;
  onClose: () => void;
}

type Timeframe = '1D' | '1S' | '1M';

export function ProductDetailModal({ product, onClose }: ProductDetailProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1S');
  const [added, setAdded] = useState(false);
  const { addToCart, openCart } = useCart();

  const handleOrder = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard product={product} timeframe={timeframe} onSelectTimeframe={setTimeframe} />
          </div>

          <div>
            <FichaCard product={product} added={added} onOrder={handleOrder} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  product,
  timeframe,
  onSelectTimeframe,
}: {
  product: CoffeeProduct;
  timeframe: Timeframe;
  onSelectTimeframe: (t: Timeframe) => void;
}) {
  const series = product.demandByRange[timeframe];
  const minVal = Math.min(...series);
  const maxVal = Math.max(...series);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-fg sm:text-2xl">
            {product.name}
          </h2>
          <p className="mt-1 text-xs text-muted">{product.extractionNotes ?? product.description}</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-fg tabular-nums sm:text-3xl">
            {product.ordersToday} <span className="text-xs font-bold uppercase text-muted">pedidos/trades</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-up/15 px-2 py-0.5 text-xs font-bold text-up">
            <Flame size={13} />
            <span>+{product.change24h}% DEMANDA HOY</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs font-semibold text-muted">
          Actividad de pedidos y trueques P2P (sin cotización monetaria en P2P)
        </span>
        <div className="flex rounded-lg border border-line bg-canvas p-0.5 text-xs">
          {(['1D', '1S', '1M'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onSelectTimeframe(t)}
              className={`rounded-md px-3 py-1 font-extrabold transition-colors ${
                timeframe === t ? 'bg-panel text-brand-accent shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <NeonDemandChart history={series} min={minVal} max={maxVal} />
      </div>
    </Card>
  );
}

function FichaCard({
  product,
  added,
  onOrder,
}: {
  product: CoffeeProduct;
  added: boolean;
  onOrder: () => void;
}) {
  return (
    <Card className="flex h-full flex-col justify-between p-6">
      <div>
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h3 className="text-base font-extrabold uppercase tracking-wide text-fg">
            Ficha del café
          </h3>
          <div className="grid grid-cols-4 gap-1 opacity-50">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-muted" />
            ))}
          </div>
        </div>

        <div className="divide-y divide-line/60 text-xs">
          <FichaRow label="Categoría" value={product.category} />
          <FichaRow label="Pedidos y trades hoy" value={`${product.ordersToday}`} />
          <FichaRow
            label="Demanda hoy"
            value={`+${product.change24h}%`}
            valueClass="text-up font-bold"
          />
          <FichaRow label="Ofrecidos en P2P" value={`${product.p2pOpenOffers} cupones`} />
          <FichaRow label="Lo buscan en P2P" value={`${product.p2pWantedBy} personas`} />
          <FichaRow label="Se cambia mucho por" value={product.topSwaps} />
          <FichaRow
            label="Recompensa al tradear"
            value={`+${product.tradeRewardGold} G (al canje TPV)`}
            valueClass="text-brand-accent font-extrabold"
          />
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted">precio en carta:</span>
          <span className="text-2xl font-black text-fg tabular-nums">
            {money(product.price)}
          </span>
        </div>

        <button
          onClick={onOrder}
          disabled={added}
          className="w-full rounded-xl bg-brand-accent py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
        >
          {added ? (
            <>
              <Check size={18} /> ¡Sumado!
            </>
          ) : (
            'sumalo a tu pedido'
          )}
        </button>
      </div>
    </Card>
  );
}

function FichaRow({
  label,
  value,
  valueClass = 'text-fg font-semibold',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <span className="text-muted shrink-0">{label}:</span>
      <span className={`tabular-nums text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

// Arma la curva SVG de volumen de demanda (pedidos + trueques) sin signos de dólar en el eje Y
function NeonDemandChart({
  history,
  min,
  max,
}: {
  history: number[];
  min: number;
  max: number;
}) {
  const span = Math.max(1, max - min);
  const w = 600;
  const h = 260;

  const points = history.map((val, i) => {
    const x = (i / (history.length - 1)) * (w - 60) + 50;
    const norm = (val - min) / span;
    const y = h - 30 - norm * (h - 60);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[idx - 1]!;
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${h - 20} L ${points[0]!.x} ${h - 20} Z`;

  const ticks = [
    Math.round(max),
    Math.round(max - span * 0.25),
    Math.round(max - span * 0.5),
    Math.round(max - span * 0.75),
    Math.round(min),
  ];

  return (
    <div className="relative h-64 w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D9A3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00D9A3" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {ticks.map((t, idx) => {
          const y = 30 + idx * ((h - 60) / 4);
          return (
            <g key={idx}>
              <line
                x1="45"
                y1={y}
                x2={w}
                y2={y}
                stroke="#252A38"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x="40"
                y={y + 3}
                textAnchor="end"
                className="fill-muted text-[10px] tabular-nums"
              >
                {t}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#neonGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="#00D9A3"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            fill="#0B0E14"
            stroke="#00D9A3"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
