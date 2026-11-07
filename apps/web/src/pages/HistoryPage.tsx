import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Ban,
  History,
  QrCode,
  RefreshCw,
  ShoppingCart,
  Tag,
} from 'lucide-react';
import { useSession } from '../state/session';
import { api, type ActivityEvent, type ActivityType } from '../api/client';
import { Button, Card, EmptyState, IconChip, PageHeader, money, type Tone } from '../ui/kit';

const FILTERS: { key: ActivityType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todo' },
  { key: 'PRIMARY_PURCHASE', label: 'Compras en carta' },
  { key: 'P2P_SALE', label: 'Trueques entregados' },
  { key: 'P2P_BUY', label: 'Trueques recibidos' },
  { key: 'REDEEM', label: 'Canjes en TPV' },
];

interface EventMeta {
  icon: typeof Tag;
  tone: Tone;
  badgeText?: string;
}

const META: Record<ActivityType, EventMeta> = {
  PRIMARY_PURCHASE: { icon: ShoppingCart, tone: 'primary' },
  P2P_LISTED: { icon: Tag, tone: 'info', badgeText: 'Oferta Trueque P2P' },
  P2P_SALE: { icon: ArrowRightLeft, tone: 'up', badgeText: '+Gold al canje TPV' },
  P2P_BUY: { icon: ArrowRightLeft, tone: 'accent', badgeText: 'Producto x Producto' },
  REDEEM: { icon: QrCode, tone: 'up', badgeText: 'QR Canjeado en Barra' },
  P2P_CANCELLED: { icon: Ban, tone: 'warn', badgeText: 'Trueque Cancelado' },
};

function renderEventRight(e: ActivityEvent): string {
  const m = META[e.type];
  if (m.badgeText) return m.badgeText;
  return e.amount > 0 ? money(e.amount) : '';
}

function FilterChips({
  active,
  onSelect,
}: {
  active: ActivityType | 'ALL';
  onSelect: (k: ActivityType | 'ALL') => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const isCurrent = active === f.key;
        const cls = isCurrent
          ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent'
          : 'border-line bg-panel text-muted hover:bg-raised hover:text-fg';
        return (
          <button
            key={f.key}
            onClick={() => onSelect(f.key)}
            className={`rounded-ctl border px-3 py-1.5 text-xs font-semibold transition ${cls}`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function EventFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <EmptyState>Sin movimientos registrados para este filtro.</EmptyState>;
  }
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {events.map((e) => {
        const m = META[e.type];
        const rightText = renderEventRight(e);
        return (
          <div
            key={e.eventId}
            className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-raised/50"
          >
            <IconChip icon={m.icon} tone={m.tone} size={16} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">{e.title}</div>
              <div className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</div>
            </div>
            {rightText && (
              <div className="rounded-md bg-raised px-2.5 py-1 text-xs font-bold text-brand-accent">
                {rightText}
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

export function HistoryPage() {
  const { tenant, user } = useSession();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    setLoading(true);
    try {
      const typeParam = filter === 'ALL' ? undefined : filter;
      setEvents(await api.getTransactions(tenant, user.userId, typeParam));
    } finally {
      setLoading(false);
    }
  }, [tenant, user, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const swapsCount = events.filter(
    (e) => e.type === 'P2P_SALE' || e.type === 'P2P_BUY' || e.type === 'REDEEM',
  ).length;
  const ownerName = user ? user.displayName : '—';
  const spin = loading ? 'animate-spin' : '';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Historial de trueques y canjes"
        subtitle={`Bitácora de productos e intercambios de ${ownerName}`}
        icon={History}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw size={14} className={spin} /> Actualizar
          </Button>
        }
      />

      <FilterChips active={filter} onSelect={setFilter} />
      <EventFeed events={events} />

      <Card className="mt-4 flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-muted">Total de trueques P2P y canjes físicos registrados</span>
        <span className="font-bold tabular-nums text-up">{swapsCount} operaciones</span>
      </Card>
    </div>
  );
}
