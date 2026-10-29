import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShoppingCart, Tag, TrendingUp, TrendingDown, QrCode, Ban } from 'lucide-react';
import { useSession } from '../state/session';
import { api, type ActivityEvent, type ActivityType } from '../api/client';

/** Historial unificado de actividad y transacciones por usuario con filtros por tipo de evento. */
const FILTERS: { key: ActivityType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todo' },
  { key: 'PRIMARY_PURCHASE', label: 'Compras primarias' },
  { key: 'P2P_SALE', label: 'Ventas P2P' },
  { key: 'P2P_BUY', label: 'Compras P2P' },
  { key: 'REDEEM', label: 'Canjes' },
];

const META: Record<ActivityType, { icon: typeof Tag; color: string; sign: string }> = {
  PRIMARY_PURCHASE: { icon: ShoppingCart, color: '#6D28D9', sign: '-' },
  P2P_LISTED: { icon: Tag, color: '#0EA5E9', sign: '' },
  P2P_SALE: { icon: TrendingUp, color: '#059669', sign: '+' },
  P2P_BUY: { icon: TrendingDown, color: '#DC2626', sign: '-' },
  REDEEM: { icon: QrCode, color: '#334155', sign: '' },
  P2P_CANCELLED: { icon: Ban, color: '#D97706', sign: '' },
};

export function HistoryPage() {
  const { tenant, user } = useSession();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    setLoading(true);
    try {
      setEvents(await api.getTransactions(tenant, user.userId, filter === 'ALL' ? undefined : filter));
    } finally {
      setLoading(false);
    }
  }, [tenant, user, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const balance = events
    .filter((e) => e.type === 'P2P_SALE' || e.type === 'REDEEM')
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de transacciones</h1>
          <p className="text-sm text-slate-500">Actividad de {user?.displayName ?? '—'}</p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-1.5 rounded-brand bg-white px-3 py-1.5 text-sm shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-brand px-3 py-1.5 text-sm ${
              filter === f.key ? 'text-white' : 'bg-white text-slate-600 shadow-sm'
            }`}
            style={filter === f.key ? { background: 'var(--smcta-brand-primary)' } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-brand bg-white p-8 text-center text-slate-500 shadow-sm">Sin movimientos.</div>
      ) : (
        <div className="overflow-hidden rounded-brand bg-white shadow-sm">
          {events.map((e) => {
            const m = META[e.type];
            const Icon = m.icon;
            return (
              <div key={e.eventId} className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
                <div className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: m.color }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{e.title}</div>
                  <div className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</div>
                </div>
                {e.amount > 0 && (
                  <div className="text-sm font-semibold" style={{ color: m.sign === '+' ? '#059669' : m.sign === '-' ? '#DC2626' : '#334155' }}>
                    {m.sign}${e.amount.toFixed(2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-brand bg-white p-4 text-sm text-slate-600 shadow-sm">
        Balance acumulado (ventas + canjes en esta vista):{' '}
        <span className="font-bold text-slate-900">${balance.toFixed(2)}</span>
      </div>
    </div>
  );
}
