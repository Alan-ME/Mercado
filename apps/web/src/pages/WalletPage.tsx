import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, QrCode, Ban } from 'lucide-react';
import { CouponState, type P2POrderDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError, type WalletCoupon } from '../api/client';
import { StatusPill } from '../components/StatusPill';
import { QrCanje } from '../components/QrCanje';

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

  const cancel = async (couponId: string) => {
    if (!tenant || !user) return;
    const order = orders.find((o) => o.couponId === couponId && o.sellerId === user.userId);
    if (!order) {
      toast.push('error', 'No se encontró la orden a cancelar.');
      return;
    }
    try {
      await api.cancelOrder(tenant, order.orderId, user.userId);
      toast.push('success', 'Publicación cancelada. El cupón volvió a tu billetera.');
      await load();
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'No se pudo cancelar.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billetera digital</h1>
          <p className="text-sm text-slate-500">Cupones de {user?.displayName ?? '—'}</p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-brand bg-white px-3 py-1.5 text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-brand bg-white p-8 text-center text-slate-500 shadow-sm">
          No tenés cupones. Comprá uno en la Tienda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div key={c.couponId} className="rounded-brand bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{c.productName}</h3>
                <StatusPill state={c.state} />
              </div>
              <div className="text-2xl font-bold text-[var(--smcta-brand-primary)]">
                ${c.nominalPrice.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Vence: {new Date(c.expirationDate).toLocaleDateString()}
              </div>

              <div className="mt-4">
                {c.state === CouponState.EN_WALLET && (
                  <button
                    onClick={() => setCanje(c)}
                    className="flex w-full items-center justify-center gap-2 rounded-brand py-2 text-sm font-semibold text-white"
                    style={{ background: 'var(--smcta-brand-primary)' }}
                  >
                    <QrCode size={16} /> Generar QR de canje
                  </button>
                )}
                {c.state === CouponState.PUBLICADO_P2P && (
                  <button
                    onClick={() => void cancel(c.couponId)}
                    className="flex w-full items-center justify-center gap-2 rounded-brand border border-amber-300 bg-amber-50 py-2 text-sm font-semibold text-amber-800"
                  >
                    <Ban size={16} /> En venta P2P — Cancelar oferta
                  </button>
                )}
                {(c.state === CouponState.CANJEADO || c.state === CouponState.VENCIDO) && (
                  <div className="rounded-brand bg-slate-50 py-2 text-center text-sm text-slate-400">
                    Sin acciones disponibles
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canje && user && tenant && (
        <QrCanje
          tenant={tenant}
          couponId={canje.couponId}
          productName={canje.productName}
          userName={user.displayName}
          onClose={() => {
            setCanje(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
