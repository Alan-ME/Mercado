import { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown, BookOpen, DollarSign, Loader2, Percent, RefreshCw, Shield, Tag, TrendingUp } from 'lucide-react';
import { CouponState, type P2POrderDTO, type TenantConfigDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { PriceCollarSlider } from '../components/PriceCollarSlider';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { Badge, Button, Card, EmptyState, FIELD_CLASS, PageHeader, SectionTitle, money } from '../ui/kit';
import { KpiCard } from '../ui/KpiCard';

type SortKey = 'cheapest' | 'discount' | 'recent';

// Lookup de comparadores en vez de un switch largo como tenía orders_screen.dart:
// mantiene cada función chiquita y sumar otro criterio es una sola entrada.
const SORTERS: Record<SortKey, (a: P2POrderDTO, b: P2POrderDTO) => number> = {
  cheapest: (a, b) => a.askingPrice - b.askingPrice,
  discount: (a, b) =>
    a.askingPrice / a.commissionBreakdown.nominalPrice - b.askingPrice / b.commissionBreakdown.nominalPrice,
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

function isConcurrencyConflict(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  return e.status === 423 || e.status === 409;
}

function SpreadBadge({ asking, nominal }: { asking: number; nominal: number }) {
  const pct = ((asking - nominal) / nominal) * 100;
  if (pct < -0.01) return <Badge tone="up">{pct.toFixed(1)}% bajo par</Badge>;
  if (pct > 0.01) return <Badge tone="warn">+{pct.toFixed(1)}% sobre par</Badge>;
  return <Badge tone="neutral">A la par</Badge>;
}

function MarketKpis({ orders, config }: { orders: P2POrderDTO[]; config: TenantConfigDTO }) {
  const bestAsk = orders.length > 0 ? money(Math.min(...orders.map((o) => o.askingPrice))) : '—';
  const collarText = `${config.priceFloorPct}%–${config.priceCeilingPct}%`;
  const feeText = `${config.sellerTakeRatePct}% / ${config.buyerTakeRatePct}%`;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Órdenes abiertas" value={orders.length} icon={BookOpen} tone="accent" />
      <KpiCard label="Mejor Ask disponible" value={bestAsk} icon={DollarSign} tone="up" />
      <KpiCard label="Banda Price Collar" value={collarText} icon={Shield} tone="primary" />
      <KpiCard label="Take-rate (Vend / Comp)" value={feeText} icon={Percent} tone="info" />
    </div>
  );
}

function PublishForm({
  selected,
  config,
  price,
  busy,
  onChangePrice,
  onConfirm,
  onCancel,
}: {
  selected: WalletCoupon | null;
  config: TenantConfigDTO;
  price: number;
  busy: boolean;
  onChangePrice: (n: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!selected) return null;
  return (
    <Card className="rise-in mt-4 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-fg">Ticket de orden · {selected.productName}</h3>
        <Badge tone="primary">SELL</Badge>
      </div>
      <PriceCollarSlider
        nominalPrice={selected.nominalPrice}
        priceFloorPct={config.priceFloorPct}
        priceCeilingPct={config.priceCeilingPct}
        value={price}
        onChange={onChangePrice}
      />
      <div className="mt-3.5">
        <FeeBreakdown
          nominalPrice={selected.nominalPrice}
          askingPrice={price}
          sellerTakeRatePct={config.sellerTakeRatePct}
          buyerTakeRatePct={config.buyerTakeRatePct}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 size={15} className="animate-spin" />} Publicar orden
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}

function OrderRow({
  order,
  isMine,
  onBuy,
}: {
  order: P2POrderDTO;
  isMine: boolean;
  onBuy: () => void;
}) {
  const nominal = order.commissionBreakdown.nominalPrice;
  const totalBuyer = order.commissionBreakdown.totalBuyerPrice;
  const label = isMine ? 'Tu posición' : `Comprar ${money(totalBuyer)}`;

  return (
    <Card interactive className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums text-fg">{money(order.askingPrice)}</span>
            <SpreadBadge asking={order.askingPrice} nominal={nominal} />
          </div>
          <div className="mt-0.5 text-xs tabular-nums text-muted">
            Nominal {money(nominal)} · Final c/ fee {money(totalBuyer)}
          </div>
        </div>
        <Button size="sm" onClick={onBuy} disabled={isMine}>
          {label}
        </Button>
      </div>
    </Card>
  );
}

function OrderBookList({
  orders,
  sort,
  currentUserId,
  onBuy,
}: {
  orders: P2POrderDTO[];
  sort: SortKey;
  currentUserId: string | undefined;
  onBuy: (order: P2POrderDTO) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState>Libro vacío. Publicá un cupón desde la columna izquierda para abrir liquidez.</EmptyState>;
  }
  const sorted = [...orders].sort(SORTERS[sort]);
  return (
    <div className="space-y-2.5">
      {sorted.map((o) => (
        <OrderRow key={o.orderId} order={o} isMine={o.sellerId === currentUserId} onBuy={() => onBuy(o)} />
      ))}
    </div>
  );
}

function MyEligibleList({
  mine,
  selectedId,
  onSelect,
}: {
  mine: WalletCoupon[];
  selectedId: string | undefined;
  onSelect: (c: WalletCoupon) => void;
}) {
  if (mine.length === 0) {
    return <EmptyState>No tenés cupones EN_WALLET disponibles para ofertar.</EmptyState>;
  }
  return (
    <div className="space-y-2">
      {mine.map((c) => {
        const active = selectedId === c.couponId;
        const ring = active ? 'border-brand-accent bg-brand-accent/10' : 'border-line bg-panel hover:bg-raised';
        return (
          <button
            key={c.couponId}
            onClick={() => onSelect(c)}
            className={`flex w-full items-center justify-between rounded-card border p-4 text-left transition ${ring}`}
          >
            <div>
              <div className="font-semibold text-fg">{c.productName}</div>
              <div className="text-xs text-muted">Listo para listar en libro secundario</div>
            </div>
            <span className="text-sm font-bold tabular-nums text-brand-accent">{money(c.nominalPrice)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Marketplace() {
  const { tenant, user, config } = useSession();
  const toast = useToast();
  const [mine, setMine] = useState<WalletCoupon[]>([]);
  const [orders, setOrders] = useState<P2POrderDTO[]>([]);
  const [selected, setSelected] = useState<WalletCoupon | null>(null);
  const [price, setPrice] = useState(0);
  const [sort, setSort] = useState<SortKey>('cheapest');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    setLoading(true);
    try {
      const [wallet, book] = await Promise.all([api.getWallet(tenant, user.userId), api.listOrders(tenant)]);
      setMine(wallet.filter((c) => c.state === CouponState.EN_WALLET));
      setOrders(book);
    } finally {
      setLoading(false);
    }
  }, [tenant, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const executePublish = async (tenantKey: string, couponId: string, sellerId: string) => {
    setBusy(true);
    try {
      await api.publishOrder(tenantKey, { couponId, sellerId, askingPrice: price });
      toast.push('success', 'Cupón publicado en el libro P2P.');
      setSelected(null);
      await load();
    } catch (e) {
      toast.push('error', errorMessage(e, 'No se pudo publicar.'));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!tenant || !user || !selected) return;
    await executePublish(tenant, selected.couponId, user.userId);
  };

  const handleBuyFailure = async (e: unknown) => {
    if (isConcurrencyConflict(e)) {
      toast.push('error', 'Esta orden acaba de ser tomada por otro usuario.');
      await load();
      return;
    }
    toast.push('error', errorMessage(e, 'No se pudo comprar.'));
  };

  const buy = async (order: P2POrderDTO) => {
    if (!tenant || !user) return;
    try {
      await api.buyOrder(tenant, order.orderId, user.userId);
      toast.push('success', '¡Match ejecutado! El cupón rotó de clave y ya está en tu billetera.');
      await load();
    } catch (e) {
      await handleBuyFailure(e);
    }
  };

  if (!config) return null;
  const spin = loading ? 'animate-spin' : '';

  return (
    <div>
      <PageHeader
        title="Mercado secundario P2P"
        subtitle="Cruce atómico con aislamiento serializable y rotación criptográfica de titularidad."
        icon={TrendingUp}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw size={14} className={spin} /> Actualizar libro
          </Button>
        }
      />

      <MarketKpis orders={orders} config={config} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle icon={Tag}>1. Seleccioná un activo para ofertar</SectionTitle>
          <MyEligibleList
            mine={mine}
            selectedId={selected?.couponId}
            onSelect={(c) => {
              setSelected(c);
              setPrice(c.nominalPrice);
            }}
          />
          <PublishForm
            selected={selected}
            config={config}
            price={price}
            busy={busy}
            onChangePrice={setPrice}
            onConfirm={() => void publish()}
            onCancel={() => setSelected(null)}
          />
        </section>

        <section>
          <SectionTitle
            icon={ArrowUpDown}
            right={
              <select
                aria-label="Ordenar libro"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={`${FIELD_CLASS} !h-8 !w-auto !py-1 !text-xs`}
              >
                <option value="cheapest">Precio: menor a mayor</option>
                <option value="discount">Mayor descuento vs par</option>
                <option value="recent">Más recientes</option>
              </select>
            }
          >
            2. Libro de órdenes abiertas (Order Book)
          </SectionTitle>
          <OrderBookList
            orders={orders}
            sort={sort}
            currentUserId={user?.userId}
            onBuy={(o) => void buy(o)}
          />
        </section>
      </div>
    </div>
  );
}
