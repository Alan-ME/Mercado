import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Tag, Loader2 } from 'lucide-react';
import { CouponState, type P2POrderDTO, type TenantConfigDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { PriceCollarSlider } from '../components/PriceCollarSlider';
import { FeeBreakdown } from '../components/FeeBreakdown';

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

function isConcurrencyConflict(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  return e.status === 423 || e.status === 409;
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
    <div className="mt-4 rounded-brand bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-900">Publicar: {selected.productName}</h3>
      <PriceCollarSlider
        nominalPrice={selected.nominalPrice}
        priceFloorPct={config.priceFloorPct}
        priceCeilingPct={config.priceCeilingPct}
        value={price}
        onChange={onChangePrice}
      />
      <div className="mt-3">
        <FeeBreakdown
          nominalPrice={selected.nominalPrice}
          askingPrice={price}
          sellerTakeRatePct={config.sellerTakeRatePct}
          buyerTakeRatePct={config.buyerTakeRatePct}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex items-center gap-2 rounded-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--smcta-brand-primary)' }}
        >
          {busy && <Loader2 size={16} className="animate-spin" />} Confirmar publicación
        </button>
        <button onClick={onCancel} className="rounded-brand px-4 py-2 text-sm text-slate-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function OrderBookList({
  orders,
  currentUserId,
  onBuy,
}: {
  orders: P2POrderDTO[];
  currentUserId: string | undefined;
  onBuy: (order: P2POrderDTO) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-brand bg-white p-6 text-sm text-slate-500 shadow-sm">
        No hay órdenes abiertas.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => {
        const isMine = o.sellerId === currentUserId;
        const discount = o.askingPrice < o.commissionBreakdown.nominalPrice;
        const btnLabel = isMine ? 'Tu orden' : `Comprar $${o.commissionBreakdown.totalBuyerPrice.toFixed(2)}`;
        return (
          <div key={o.orderId} className="rounded-brand bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">${o.askingPrice.toFixed(2)}</div>
                <div className="text-xs text-slate-400">Nominal ${o.commissionBreakdown.nominalPrice.toFixed(2)}</div>
              </div>
              {discount && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Bajo nominal
                </span>
              )}
              <button
                onClick={() => onBuy(o)}
                disabled={isMine}
                className="rounded-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--smcta-brand-accent)' }}
              >
                {btnLabel}
              </button>
            </div>
          </div>
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
    return (
      <div className="rounded-brand bg-white p-6 text-sm text-slate-500 shadow-sm">
        No tenés cupones EN_WALLET para publicar.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {mine.map((c) => {
        const activeRing = selectedId === c.couponId ? 'ring-2 ring-[var(--smcta-brand-accent)]' : '';
        return (
          <button
            key={c.couponId}
            onClick={() => onSelect(c)}
            className={`flex w-full items-center justify-between rounded-brand bg-white p-4 text-left shadow-sm transition hover:ring-2 ${activeRing}`}
          >
            <span className="font-medium text-slate-800">{c.productName}</span>
            <span className="text-sm text-slate-500">Nominal ${c.nominalPrice.toFixed(2)}</span>
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
      toast.push('success', 'Cupón publicado en el mercado P2P.');
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
      toast.push('success', '¡Compra P2P exitosa! El cupón ya está en tu billetera.');
      await load();
    } catch (e) {
      await handleBuyFailure(e);
    }
  };

  if (!config) return null;
  const refreshClass = loading ? 'animate-spin' : '';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Tag size={18} /> Publicar en el mercado
        </h2>
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <TrendingUp size={18} /> Libro de órdenes P2P
          </h2>
          <button onClick={() => void load()} className="flex items-center gap-1.5 rounded-brand bg-white px-3 py-1.5 text-sm shadow-sm">
            <RefreshCw size={15} className={refreshClass} /> Actualizar
          </button>
        </div>
        <OrderBookList
          orders={orders}
          currentUserId={user?.userId}
          onBuy={(o) => void buy(o)}
        />
      </section>
    </div>
  );
}
