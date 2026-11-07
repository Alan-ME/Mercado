import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  push: (kind: ToastKind, message: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_STYLE: Record<ToastKind, { icon: LucideIcon; accent: string }> = {
  success: { icon: CheckCircle2, accent: 'border-l-up text-up' },
  error: { icon: AlertCircle, accent: 'border-l-down text-down' },
  info: { icon: Info, accent: 'border-l-info text-info' },
};

let counter = 0;

function ToastItem({ toast }: { toast: Toast }) {
  const meta = TOAST_STYLE[toast.kind];
  const Icon = meta.icon;
  return (
    <div
      role="status"
      className={`rise-in flex min-w-[260px] max-w-[380px] items-start gap-2.5 rounded-ctl border border-line border-l-4 bg-raised px-4 py-3 text-sm text-fg shadow-2xl ${meta.accent}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span className="text-fg">{toast.message}</span>
    </div>
  );
}

// Port del SnackBar flotante de Flutter (elevatedDark + texto claro + borde de severidad).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Memoizamos la API del toast para que useToast() devuelva siempre la misma referencia.
  // Antes devolvía un objeto literal nuevo en cada render y si alguien lo metía en las deps de un
  // useCallback/useEffect (como pasaba en AuditPage) disparaba un loop infinito de requests hasta
  // reventar los sockets de Chrome con net::ERR_INSUFFICIENT_RESOURCES.
  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (msg: string) => push('success', msg),
      error: (msg: string) => push('error', msg),
      info: (msg: string) => push('info', msg),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
