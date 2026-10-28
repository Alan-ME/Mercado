import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from '../state/session';
import { api, type ActivityEvent } from '../api/client';

function NotificationPanel({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <div className="px-4 py-6 text-center text-sm text-slate-400">Sin novedades</div>;
  }
  return (
    <ul className="max-h-80 overflow-y-auto">
      {events.map((e) => (
        <li key={e.eventId} className="border-b border-slate-50 px-4 py-2.5 text-sm">
          <div className="text-slate-800">{e.title}</div>
          <div className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</div>
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
        className="relative grid h-9 w-9 place-items-center rounded-brand bg-white/10 hover:bg-white/20"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-brand bg-white text-slate-800 shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold">Notificaciones</div>
          <NotificationPanel events={events} />
        </div>
      )}
    </div>
  );
}
