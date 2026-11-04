import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Coins, QrCode, RefreshCw, Tag, Wallet } from 'lucide-react';
import { CouponState, type P2POrderDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { StatusPill } from '../components/StatusPill';
import { QrCanje } from '../components/QrCanje';
import { AssetArt, assetMeta } from '../ui/AssetArt';
import { Button, Card, EmptyState, PageHeader, money } from '../ui/kit';
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
        <Ban size={15} /> En venta P2P — Cancelar oferta
      </Button>
    );
  }
  return (
    <div className="rounded-ctl border border-line bg-raised py-2 text-center text-xs font-medium text-muted">
      Posición cerrada
    </div>
  );
}

function WalletKpis({ coupons }: { coupons: WalletCoupon[] }) {
  const ready = coupons.filter((c) => c.state === CouponState.EN_WALLET);
  const listed = coupons.filter((c) => c.state === CouponState.PUBLICADO_P2P);
  const liveNominal = [...ready, ...listed].reduce((acc, c) => acc + c.nominalPrice, 0);

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total en portafolio" value={coupons.length} icon={Wallet} tone="primary" />
      <KpiCard label="Listos para canje" value={ready.length} icon={CheckCircle2} tone="up" />
      <KpiCard label="Ofertados en P2P" value={listed.length} icon={Tag} tone="warn" />
      <KpiCard label="Nominal activo" value={money(liveNominal)} icon={Coins} tone="accent" />
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
    return <EmptyState>No tenés cupones en tu portafolio. Adquirí uno en Tienda o en el Mercado P2P.</EmptyState>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((c) => {
        const { category } = assetMeta(c.productName);
        return (
          <Card key={c.couponId} interactive className="flex flex-col p-4">
            <AssetArt productName={c.productName} compact />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent">{category}</span>
              <StatusPill state={c.state} />
            </div>
            <h3 className="mt-1.5 line-clamp-1 font-semibold text-fg">{c.productName}</h3>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Valor nominal</div>
                <div className="text-xl font-bold tabular-nums text-fg">{money(c.nominalPrice)}</div>
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
      const [c, o] = await Promise.all([api.getWallet(tenant, user.userId), api.listOrders(tenant)]);
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
      toast.push('success', 'Publicación cancelada. El cupón volvió a tu billetera.');
      await load();
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'No se pudo cancelar.');
    }
  };

  const cancel = async (couponId: string) => {
    if (!tenant || !user) return;
    const order = orders.find((o) => o.couponId === couponId && o.sellerId === user.userId);
    if (!order) {
      toast.push('error', 'No se encontró la orden a cancelar.');
      return;
    }
    await performCancel(tenant, order.orderId, user.userId);
  };

  const ownerLabel = user ? user.displayName : '—';
  const spin = loading ? 'animate-spin' : '';

  return (
    <div>
      <PageHeader
        title="Billetera digital"
        subtitle={`Portafolio custodiado de ${ownerLabel}`}
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
