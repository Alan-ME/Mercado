import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Coins, Lock, QrCode, RefreshCw, Tag, Wallet } from 'lucide-react';
import { CouponState, type P2POrderDTO } from '@smcta/shared';
import {
  computeTradeRewardGold,
  findCatalogVisual,
  getPendingGoldTotal,
  loadEconomyState,
} from '../state/goldEconomy';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { StatusPill } from '../components/StatusPill';
import { QrCanje } from '../components/QrCanje';
import { Button, Card, EmptyState, PageHeader } from '../ui/kit';
import { KpiCard } from '../ui/KpiCard';

function CouponAction({
  coupon,
  onRedeem,
  onCancel,
}: {
  coupon: WalletCoupon;
  onRedeem: (c: WalletCoupon) => void;
  onCancel: (couponId: string) => void;
}) {
  if (coupon.state === CouponState.EN_WALLET) {
    return (
      <Button className="w-full" onClick={() => onRedeem(coupon)}>
        <QrCode size={16} /> Generar QR de canje
      </Button>
    );
  }
  if (coupon.state === CouponState.PUBLICADO_P2P) {
    return (
      <Button variant="warn" className="w-full" onClick={() => onCancel(coupon.couponId)}>
        <Ban size={15} /> En trueque P2P — Cancelar oferta
      </Button>
    );
  }
  return (
    <div className="rounded-ctl border border-line bg-raised py-2 text-center text-xs font-medium text-muted">
      Canjeado / Cerrado
    </div>
  );
}

function WalletKpis({ coupons }: { coupons: WalletCoupon[] }) {
  const ready = coupons.filter((c) => c.state === CouponState.EN_WALLET);
  const listed = coupons.filter((c) => c.state === CouponState.PUBLICADO_P2P);
  const economy = loadEconomyState();
  const pendingGold = getPendingGoldTotal();

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Listos para canje" value={ready.length} icon={CheckCircle2} tone="up" />
      <KpiCard label="En trueque P2P" value={listed.length} icon={Tag} tone="warn" />
      <KpiCard
        label="Créditos Gold disponibles"
        value={`${economy.unlockedGold} G`}
        icon={Coins}
        tone="accent"
      />
      <KpiCard
        label="Gold pendiente (TPV)"
        value={`${pendingGold} G`}
        icon={Lock}
        tone="primary"
      />
    </div>
  );
}

function CouponGrid({
  coupons,
  onRedeem,
  onCancel,
}: {
  coupons: WalletCoupon[];
  onRedeem: (c: WalletCoupon) => void;
  onCancel: (couponId: string) => void;
}) {
  if (coupons.length === 0) {
    return (
      <EmptyState>
        No tenés productos en tu billetera. Comprá en la Carta, intercambiá en el P2P o canjeá un
        combo en Gold Area.
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((c) => {
        const vis = findCatalogVisual(c.productName);
        const rewardGold = computeTradeRewardGold(c.productName);
        return (
          <Card key={c.couponId} interactive className="flex flex-col p-4">
            <div
              className={`flex h-36 w-full items-center justify-center rounded-xl bg-gradient-to-br ${vis.glowGradient} p-3`}
            >
              <img
                src={vis.image}
                alt={c.productName}
                className="h-28 max-w-full object-contain drop-shadow-xl"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent">
                {vis.category}
              </span>
              <StatusPill state={c.state} />
            </div>
            <h3 className="mt-1.5 line-clamp-1 font-extrabold uppercase text-fg">
              {c.productName}
            </h3>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Bonus si lo tradeás
                </div>
                <div className="inline-flex items-center gap-1 text-sm font-black text-amber-400">
                  <Coins size={13} /> +{rewardGold} G (al canje TPV)
                </div>
              </div>
              <div className="text-right text-[11px] text-muted">
                Vence {new Date(c.expirationDate).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-3.5">
              <CouponAction coupon={c} onRedeem={onRedeem} onCancel={onCancel} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ActiveQrModal({
  canje,
  tenant,
  user,
  onClose,
}: {
  canje: WalletCoupon | null;
  tenant: string | null;
  user: { userId: string; displayName: string } | null;
  onClose: () => void;
}) {
  if (!canje || !tenant || !user) return null;
  return (
    <QrCanje
      tenant={tenant}
      couponId={canje.couponId}
      userId={user.userId}
      productName={canje.productName}
      userName={user.displayName}
      onClose={onClose}
    />
  );
}

export function WalletPage() {
  const { tenant, user } = useSession();
  const toast = useToast();
  const [coupons, setCoupons] = useState<WalletCoupon[]>([]);
  const [orders, setOrders] = useState<P2POrderDTO[]>([]);
  const [canje, setCanje] = useState<WalletCoupon | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    setLoading(true);
    try {
      const [c, o] = await Promise.all([
        api.getWallet(tenant, user.userId),
        api.listOrders(tenant),
      ]);
      setCoupons(c);
      setOrders(o);
    } finally {
      setLoading(false);
    }
  }, [tenant, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const performCancel = async (tenantKey: string, orderId: string, sellerId: string) => {
    try {
      await api.cancelOrder(tenantKey, orderId, sellerId);
      toast.push('success', 'Trueque cancelado. El producto volvió a tu billetera.');
      await load();
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'No se pudo cancelar.');
    }
  };

  const cancel = async (couponId: string) => {
    if (!tenant || !user) return;
    const order = orders.find((o) => o.couponId === couponId && o.sellerId === user.userId);
    if (!order) {
      toast.push('error', 'No se encontró la oferta de trueque a cancelar.');
      return;
    }
    await performCancel(tenant, order.orderId, user.userId);
  };

  const ownerLabel = user ? user.displayName : '—';
  const spin = loading ? 'animate-spin' : '';

  return (
    <div>
      <PageHeader
        title="Billetera de productos & Créditos Gold"
        subtitle={`Inventario custodiado de ${ownerLabel} — generá tu QR dinámico para canjear en barra`}
        icon={Wallet}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw size={14} className={spin} /> Actualizar
          </Button>
        }
      />
      <WalletKpis coupons={coupons} />
      <CouponGrid coupons={coupons} onRedeem={setCanje} onCancel={(id) => void cancel(id)} />
      <ActiveQrModal
        canje={canje}
        tenant={tenant}
        user={user}
        onClose={() => {
          setCanje(null);
          void load();
        }}
      />
    </div>
  );
}
