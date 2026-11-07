import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Coins,
  Loader2,
  Lock,
  RefreshCw,
  Repeat,
  Sparkles,
  Tag,
} from 'lucide-react';
import { CouponState, type P2POrderDTO } from '@smcta/shared';
import { COFFEE_PRODUCTS } from '../data/coffeeCatalog';
import {
  computeTradeRewardGold,
  findCatalogVisual,
  getPendingGoldTotal,
  loadEconomyState,
  registerPublishedSwap,
  type DiscontinuedItem,
  type OrderTradeSpec,
} from '../state/goldEconomy';
import { ItemChangerView } from '../components/ItemChangerView';
import { GoldAreaView } from '../components/GoldAreaView';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle } from '../ui/kit';
import { KpiCard } from '../ui/KpiCard';

type MarketTab = 'p2p' | 'changer' | 'gold';

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

function isConcurrencyConflict(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  return e.status === 423 || e.status === 409;
}

function pickDifferentProduct(productName: string): string {
  const alt = COFFEE_PRODUCTS.find(
    (p) => p.name.toLowerCase() !== productName.toLowerCase(),
  );
  return alt ? alt.name : COFFEE_PRODUCTS[0]!.name;
}

function defaultSpecForOrder(order: P2POrderDTO, index: number): OrderTradeSpec {
  const offered = COFFEE_PRODUCTS[index % COFFEE_PRODUCTS.length]!;
  const requested = COFFEE_PRODUCTS[(index + 2) % COFFEE_PRODUCTS.length]!;
  return {
    orderId: order.orderId,
    offeredProduct: offered.name,
    requestedProduct: requested.name,
    rewardGold: offered.tradeRewardGold,
  };
}

function MarketKpis({
  ordersCount,
  unlockedGold,
  pendingGold,
  discontinuedCount,
}: {
  ordersCount: number;
  unlockedGold: number;
  pendingGold: number;
  discontinuedCount: number;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Trueques P2P abiertos" value={ordersCount} icon={BookOpen} tone="accent" />
      <KpiCard
        label="Créditos Gold disponibles"
        value={`${unlockedGold} G`}
        icon={Coins}
        tone="up"
      />
      <KpiCard
        label="Gold pendiente (canje TPV)"
        value={`${pendingGold} G`}
        icon={Lock}
        tone="primary"
      />
      <KpiCard
        label="Ítems en Item Changer"
        value={discontinuedCount}
        icon={Repeat}
        tone="warn"
      />
    </div>
  );
}

function MarketTabsBar({
  active,
  discontinuedCount,
  unlockedGold,
  onSelect,
}: {
  active: MarketTab;
  discontinuedCount: number;
  unlockedGold: number;
  onSelect: (t: MarketTab) => void;
}) {
  const tabCls = (t: MarketTab) =>
    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition ${
      active === t
        ? 'bg-brand-primary text-black shadow-md'
        : 'border border-line bg-panel text-muted hover:bg-raised hover:text-fg'
    }`;

  return (
    <div className="mb-6 flex flex-wrap gap-2.5">
      <button onClick={() => onSelect('p2p')} className={tabCls('p2p')}>
        <ArrowRightLeft size={15} /> Trueque P2P (Producto x Producto)
      </button>
      <button onClick={() => onSelect('changer')} className={tabCls('changer')}>
        <Repeat size={15} /> Item Changer · Descontinuados ({discontinuedCount})
      </button>
      <button onClick={() => onSelect('gold')} className={tabCls('gold')}>
        <Sparkles size={15} /> Gold Area · Combos ({unlockedGold} G)
      </button>
    </div>
  );
}

function SwapProposalForm({
  selected,
  wantedProduct,
  busy,
  onChangeWanted,
  onConfirm,
  onCancel,
}: {
  selected: WalletCoupon | null;
  wantedProduct: string;
  busy: boolean;
  onChangeWanted: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!selected) return null;
  const sameItem = selected.productName.toLowerCase() === wantedProduct.toLowerCase();
  const reward = sameItem ? 0 : computeTradeRewardGold(selected.productName);
  const offeredVis = findCatalogVisual(selected.productName);
  const wantedVis = findCatalogVisual(wantedProduct);

  return (
    <Card className="rise-in mt-4 space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase text-fg">
          Proponer Trueque Libre (Sin Dinero)
        </h3>
        <Badge tone="up">+{reward} G AL CANJE TPV</Badge>
      </div>

      <div className="grid items-center gap-3 rounded-xl border border-line bg-canvas p-3.5 sm:grid-cols-7">
        <div className="flex items-center gap-2.5 sm:col-span-3">
          <img src={offeredVis.image} alt={selected.productName} className="h-12 w-12 object-contain" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase text-muted">Entregás</div>
            <div className="truncate text-xs font-extrabold uppercase text-fg">
              {selected.productName}
            </div>
          </div>
        </div>

        <div className="flex justify-center sm:col-span-1">
          <ArrowRightLeft size={18} className="text-brand-accent" />
        </div>

        <div className="flex items-center gap-2.5 sm:col-span-3">
          <img src={wantedVis.image} alt={wantedProduct} className="h-12 w-12 object-contain" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase text-muted">Recibís</div>
            <div className="truncate text-xs font-extrabold uppercase text-brand-accent">
              {wantedProduct}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
          ¿Qué producto buscás recibir a cambio?
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COFFEE_PRODUCTS.map((p) => {
            const active = p.name === wantedProduct;
            const cls = active
              ? 'border-brand-accent bg-brand-accent/15 text-fg'
              : 'border-line bg-canvas text-muted hover:text-fg';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangeWanted(p.name)}
                className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-bold transition ${cls}`}
              >
                <img src={p.image} alt={p.name} className="h-7 w-7 shrink-0 object-contain" />
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
        Al concretarse el intercambio sumás <strong>+{reward} G en estado Pendiente</strong>. Se
        desbloquean automáticamente cuando el otro usuario escanee el QR en el TPV.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 size={15} className="animate-spin" />} Publicar trueque
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}

function SwapOrderRow({
  spec,
  isMine,
  onSwap,
}: {
  spec: OrderTradeSpec;
  isMine: boolean;
  onSwap: () => void;
}) {
  const offeredVis = findCatalogVisual(spec.offeredProduct);
  const wantedVis = findCatalogVisual(spec.requestedProduct);
  const label = isMine ? 'Tu oferta publicada' : 'Intercambiar producto';

  return (
    <Card interactive className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3 py-2">
            <img src={offeredVis.image} alt={spec.offeredProduct} className="h-10 w-10 object-contain" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
                Ofrece
              </div>
              <div className="text-xs font-extrabold uppercase text-fg">{spec.offeredProduct}</div>
            </div>
          </div>

          <ArrowRightLeft size={16} className="text-brand-accent" />

          <div className="flex items-center gap-2.5 rounded-xl border border-brand-accent/40 bg-brand-accent/10 px-3 py-2">
            <img src={wantedVis.image} alt={spec.requestedProduct} className="h-10 w-10 object-contain" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-brand-accent">
                Busca a cambio
              </div>
              <div className="text-xs font-extrabold uppercase text-fg">
                {spec.requestedProduct}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-400">
            <Coins size={13} /> +{spec.rewardGold} G (al canje TPV)
          </span>
          <Button size="sm" onClick={onSwap} disabled={isMine}>
            {label}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SwapOrderBookList({
  orders,
  specs,
  currentUserId,
  onSwap,
}: {
  orders: P2POrderDTO[];
  specs: Record<string, OrderTradeSpec>;
  currentUserId: string | undefined;
  onSwap: (order: P2POrderDTO) => void;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState>
        No hay trueques publicados ahora. Elegí un producto de tu billetera a la izquierda para
        proponer un intercambio mano a mano.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o, idx) => {
        const spec = specs[o.orderId] ?? defaultSpecForOrder(o, idx);
        return (
          <SwapOrderRow
            key={o.orderId}
            spec={spec}
            isMine={o.sellerId === currentUserId}
            onSwap={() => onSwap(o)}
          />
        );
      })}
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
    return <EmptyState>No tenés productos EN_WALLET disponibles para intercambiar.</EmptyState>;
  }
  return (
    <div className="space-y-2.5">
      {mine.map((c) => {
        const active = selectedId === c.couponId;
        const vis = findCatalogVisual(c.productName);
        const reward = computeTradeRewardGold(c.productName);
        const ring = active
          ? 'border-brand-accent bg-brand-accent/10'
          : 'border-line bg-panel hover:bg-raised';
        return (
          <button
            key={c.couponId}
            onClick={() => onSelect(c)}
            className={`flex w-full items-center justify-between rounded-card border p-3.5 text-left transition ${ring}`}
          >
            <div className="flex items-center gap-3">
              <img src={vis.image} alt={c.productName} className="h-11 w-11 object-contain" />
              <div>
                <div className="text-xs font-extrabold uppercase text-fg">{c.productName}</div>
                <div className="text-[11px] text-muted">
                  {vis.category} · Listo para intercambiar por otro producto
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-400">
              <Coins size={12} /> +{reward} G
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ActiveMarketSection({
  tab,
  tenant,
  userId,
  mine,
  orders,
  selected,
  wantedProduct,
  busy,
  specs,
  discontinued,
  unlockedGold,
  pendingGold,
  onSelectCoupon,
  onChangeWanted,
  onConfirmPublish,
  onCancelPublish,
  onAcceptSwap,
  onReload,
}: {
  tab: MarketTab;
  tenant: string | null;
  userId: string | undefined;
  mine: WalletCoupon[];
  orders: P2POrderDTO[];
  selected: WalletCoupon | null;
  wantedProduct: string;
  busy: boolean;
  specs: Record<string, OrderTradeSpec>;
  discontinued: DiscontinuedItem[];
  unlockedGold: number;
  pendingGold: number;
  onSelectCoupon: (c: WalletCoupon) => void;
  onChangeWanted: (name: string) => void;
  onConfirmPublish: () => void;
  onCancelPublish: () => void;
  onAcceptSwap: (o: P2POrderDTO) => void;
  onReload: () => void;
}) {
  if (tab === 'changer') {
    return (
      <ItemChangerView
        tenant={tenant}
        userId={userId}
        discontinued={discontinued}
        onCompleted={onReload}
      />
    );
  }
  if (tab === 'gold') {
    return (
      <GoldAreaView
        tenant={tenant}
        userId={userId}
        unlockedGold={unlockedGold}
        pendingGold={pendingGold}
        onRedeemed={onReload}
      />
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <SectionTitle icon={Tag}>1 · Tus productos disponibles (Sin precios monetarios)</SectionTitle>
        <MyEligibleList
          mine={mine}
          selectedId={selected ? selected.couponId : undefined}
          onSelect={onSelectCoupon}
        />
        <SwapProposalForm
          selected={selected}
          wantedProduct={wantedProduct}
          busy={busy}
          onChangeWanted={onChangeWanted}
          onConfirm={onConfirmPublish}
          onCancel={onCancelPublish}
        />
      </div>

      <div className="lg:col-span-7">
        <SectionTitle icon={BookOpen}>2 · Tablero de Trueques P2P (Producto por Producto)</SectionTitle>
        <SwapOrderBookList
          orders={orders}
          specs={specs}
          currentUserId={userId}
          onSwap={onAcceptSwap}
        />
      </div>
    </div>
  );
}

export function Marketplace() {
  const { tenant, user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<MarketTab>('p2p');
  const [mine, setMine] = useState<WalletCoupon[]>([]);
  const [orders, setOrders] = useState<P2POrderDTO[]>([]);
  const [selected, setSelected] = useState<WalletCoupon | null>(null);
  const [wantedProduct, setWantedProduct] = useState<string>(COFFEE_PRODUCTS[0]!.name);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [econVersion, setEconVersion] = useState(0);

  const economy = loadEconomyState();
  const pendingGold = getPendingGoldTotal();

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    setLoading(true);
    try {
      const [wallet, book] = await Promise.all([
        api.getWallet(tenant, user.userId),
        api.listOrders(tenant),
      ]);
      setMine(wallet.filter((c) => c.state === CouponState.EN_WALLET));
      setOrders(book);
      setEconVersion((v) => v + 1);
    } finally {
      setLoading(false);
    }
  }, [tenant, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const executePublishSwap = async (t: string, uid: string, c: WalletCoupon) => {
    setBusy(true);
    try {
      const created = await api.publishOrder(t, {
        couponId: c.couponId,
        sellerId: uid,
        askingPrice: c.nominalPrice,
      });
      registerPublishedSwap(created.orderId, c.couponId, c.productName, wantedProduct, uid);
      toast.push(
        'success',
        `Trueque publicado: ${c.productName} ↔ ${wantedProduct}. Tus Créditos Gold se desbloquearán cuando se canjee en el TPV.`,
      );
      setSelected(null);
      await load();
    } catch (e) {
      toast.push('error', errorMessage(e, 'No se pudo publicar el trueque.'));
    } finally {
      setBusy(false);
    }
  };

  const publishSwap = async () => {
    if (!tenant || !user || !selected) return;
    await executePublishSwap(tenant, user.userId, selected);
  };

  const handleSwapFailure = async (e: unknown) => {
    if (isConcurrencyConflict(e)) {
      toast.push('error', 'Este trueque acaba de ser tomado por otro usuario.');
      await load();
      return;
    }
    toast.push('error', errorMessage(e, 'No se pudo completar el intercambio.'));
  };

  const acceptSwap = async (order: P2POrderDTO) => {
    if (!tenant || !user) return;
    try {
      await api.buyOrder(tenant, order.orderId, user.userId);
      toast.push(
        'success',
        '¡Intercambio realizado! El nuevo producto ya está en tu Billetera con su QR renovado.',
      );
      await load();
    } catch (e) {
      await handleSwapFailure(e);
    }
  };

  const onSelectCoupon = (c: WalletCoupon) => {
    setSelected(c);
    setWantedProduct(pickDifferentProduct(c.productName));
  };

  const spin = loading ? 'animate-spin' : '';

  return (
    <div data-econ-version={econVersion}>
      <PageHeader
        title="Hub de Intercambio de Productos, Item Changer & Gold Area"
        subtitle="Intercambiá productos mano a mano sin dinero, rescatá ítems descontinuados con +15% de incentivo y canjeá combos con tus Créditos Gold desbloqueados en TPV."
        icon={ArrowRightLeft}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw size={14} className={spin} /> Sincronizar
          </Button>
        }
      />

      <MarketKpis
        ordersCount={orders.length}
        unlockedGold={economy.unlockedGold}
        pendingGold={pendingGold}
        discontinuedCount={economy.discontinuedItems.length}
      />

      <MarketTabsBar
        active={tab}
        discontinuedCount={economy.discontinuedItems.length}
        unlockedGold={economy.unlockedGold}
        onSelect={setTab}
      />

      <ActiveMarketSection
        tab={tab}
        tenant={tenant}
        userId={user?.userId}
        mine={mine}
        orders={orders}
        selected={selected}
        wantedProduct={wantedProduct}
        busy={busy}
        specs={economy.orderSpecs}
        discontinued={economy.discontinuedItems}
        unlockedGold={economy.unlockedGold}
        pendingGold={pendingGold}
        onSelectCoupon={onSelectCoupon}
        onChangeWanted={setWantedProduct}
        onConfirmPublish={() => void publishSwap()}
        onCancelPublish={() => setSelected(null)}
        onAcceptSwap={(o) => void acceptSwap(o)}
        onReload={() => void load()}
      />
    </div>
  );
}
