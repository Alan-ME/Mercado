import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from '../state/session';
import { api, type ActivityEvent } from '../api/client';

function NotificationPanel({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <div className="px-4 py-6 text-center text-sm text-muted">Sin novedades</div>;
  }
  return (
    <ul className="max-h-80 overflow-y-auto divide-y divide-line">
      {events.map((e) => (
        <li key={e.eventId} className="px-4 py-2.5 text-sm hover:bg-raised/60">
          <div className="font-medium text-fg">{e.title}</div>
          <div className="mt-0.5 text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
}

// Antes tiraba un setInterval cada 20s pegándole a la DB aunque el usuario estuviera mirando el techo.
// Ahora abre un EventSource SSE que empuja al instante tras cada commit y se cierra prolijo al desmontar.
export function NotificationBell() {
  const { tenant, user } = useSession();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!tenant || !user) return;
    try {
      const r = await api.getNotifications(tenant, user.userId);
      setEvents(r.events);
      setUnread(r.unreadCount);
    } catch {
      /* si la red pestañea, EventSource reconecta solo */
    }
  }, [tenant, user]);

  useEffect(() => {
    if (!tenant || !user) return;
    void load();
    const stream = new EventSource(api.notificationsStreamUrl(tenant, user.userId));
    const onPush = () => void load();
    stream.addEventListener('notification', onPush);
    return () => {
      stream.removeEventListener('notification', onPush);
      stream.close();
    };
  }, [tenant, user, load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const box = boxRef.current;
      if (box && !box.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markReadIfNeeded = async () => {
    if (!tenant || !user || unread === 0) return;
    await api.markNotificationsRead(tenant, user.userId);
    setUnread(0);
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    await load();
    await markReadIfNeeded();
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => void toggle()}
        aria-label="Notificaciones"
        className="relative grid h-9 w-9 place-items-center rounded-ctl border border-line bg-panel text-muted transition hover:bg-raised hover:text-fg"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-down px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="rise-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-card border border-line bg-panel text-fg shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted">
            <span>Feed en tiempo real</span>
            <span className="live-dot h-2 w-2 rounded-full bg-up" />
          </div>
          <NotificationPanel events={events} />
        </div>
      )}
    </div>
  );
}
