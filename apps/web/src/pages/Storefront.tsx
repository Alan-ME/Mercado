import { useState } from 'react';
import { ArrowRight, Flame, Loader2, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';
import { AssetArt, assetMeta } from '../ui/AssetArt';
import { Badge, Button, Card, money } from '../ui/kit';
import { Sparkline } from '../ui/Sparkline';

interface CatalogItem {
  name: string;
  price: number;
  ticker: string;
  description: string;
  trend: number[];
}

const PRODUCTS: CatalogItem[] = [
  {
    name: 'Entrada VIP - Cosmic Fest',
    price: 100,
    ticker: 'CSMC-VIP',
    description: 'Acceso preferencial con barra libre y ingreso por carril rápido.',
    trend: [96, 98, 102, 101, 106, 112, 118],
  },
  {
    name: 'Drop Air Limited - Par #051',
    price: 200,
    ticker: 'DROP-051',
    description: 'Reserva numerada de edición limitada lista para retirar en flagship.',
    trend: [195, 200, 198, 210, 218, 224, 232],
  },
  {
    name: 'Suite Fin de Semana',
    price: 300,
    ticker: 'SUIT-WKND',
    description: 'Dos noches base doble con desayuno y late check-out garantizado.',
    trend: [290, 294, 292, 298, 305, 308, 315],
  },
];

// Port del _Hero de home_screen.dart: gradiente cálido/acento, pastilla viva arriba y CTAs directos.
function StoreHero({
  companyName,
  floorPct,
  ceilingPct,
  sellerFee,
}: {
  companyName: string;
  floorPct: number;
  ceilingPct: number;
  sellerFee: number;
}) {
  return (
    <div className="mb-8 rounded-[20px] border border-line bg-gradient-to-br from-warn/15 via-brand-primary/10 to-brand-accent/10 p-6 sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Badge tone="warn" dot>
            EMISIÓN PRIMARIA · ESCROW SEGREGADO
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            {companyName}
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Adquirí cupones de valor al precio nominal de lanzamiento. El 100% del capital queda resguardado en
            custodia hasta que canjees el QR dinámico en puerta, o podés revender tu posición en el libro P2P.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button onClick={() => (window.location.hash = '#/market')}>
              <Flame size={16} /> Ir al Mercado P2P
            </Button>
            <Button variant="outline" onClick={() => (window.location.hash = '#/wallet')}>
              Abrir Billetera <ArrowRight size={15} />
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold uppercase tracking-wider">Reglas del recinto</span>
            <Badge tone="up">Activo</Badge>
          </div>
          <Sparkline data={[100, 108, 105, 116, 122, 119, 130]} height={48} className="mt-2 text-brand-accent" />
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-2.5 text-xs tabular-nums">
            <div>
              <div className="text-muted">Price Collar</div>
              <div className="font-bold text-fg">
                {floorPct}% – {ceilingPct}%
              </div>
            </div>
            <div>
              <div className="text-muted">Take-rate venta</div>
              <div className="font-bold text-fg">{sellerFee}%</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Port de ProductCard.dart: arte con gradiente, categoría en versalitas, sparkline y precio tabular.
function CatalogCard({
  item,
  isBusy,
  disabled,
  onBuy,
}: {
  item: CatalogItem;
  isBusy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const { category } = assetMeta(item.name);
  return (
    <Card interactive className="flex flex-col p-4">
      <AssetArt productName={item.name} />
      <div className="mt-3.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent">{category}</span>
        <span className="font-mono text-[11px] text-muted">{item.ticker}</span>
      </div>
      <h3 className="mt-1 line-clamp-1 text-base font-semibold text-fg">{item.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>

      <Sparkline data={item.trend} height={36} className="mt-3 text-up" />

      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-up">
        <ShieldCheck size={13} /> Custodia en Escrow segregada
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Nominal</div>
          <div className="text-xl font-bold tabular-nums text-fg">{money(item.price)}</div>
        </div>
        <Button size="sm" onClick={onBuy} disabled={disabled}>
          {isBusy ? <Loader2 className="animate-spin" size={14} /> : <ShoppingBag size={14} />}
          Comprar cupón
        </Button>
      </div>
    </Card>
  );
}

export function Storefront() {
  const { tenant, user, config } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (name: string, price: number) => {
    if (!tenant || !user) {
      toast.push('error', 'Seleccioná un usuario primero.');
      return;
    }
    setBusy(name);
    try {
      await api.checkout(tenant, { nominalPrice: price, buyerId: user.userId, productName: name });
      toast.push('success', 'Cupón emitido y depositado en Escrow. Revisá tu Billetera.');
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'Error en el checkout.');
    } finally {
      setBusy(null);
    }
  };

  if (!config) return null;

  return (
    <div>
      <StoreHero
        companyName={config.companyName}
        floorPct={config.priceFloorPct}
        ceilingPct={config.priceCeilingPct}
        sellerFee={config.sellerTakeRatePct}
      />

      <div className="mb-3">
        <h2 className="text-lg font-bold text-fg">Emisiones primarias disponibles</h2>
        <p className="text-xs text-muted">Liquidación atómica contra cuenta de garantía del comercio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <CatalogCard
            key={p.name}
            item={p}
            isBusy={busy === p.name}
            disabled={busy !== null}
            onBuy={() => void buy(p.name, p.price)}
          />
        ))}
      </div>
    </div>
  );
}
