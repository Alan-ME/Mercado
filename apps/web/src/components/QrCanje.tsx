import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { Button } from '../ui/kit';

function QrErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="space-y-3 rounded-ctl border border-down/40 bg-down/10 p-4 text-sm text-down">
      <div>{error}</div>
      <Button variant="danger" size="sm" onClick={onRetry}>
        <RefreshCw size={13} /> Reintentar emisión
      </Button>
    </div>
  );
}

function CountdownRing({ pct, secondsLeft }: { pct: number; secondsLeft: number }) {
  const circumference = 2 * Math.PI * 18;
  return (
    <div className="mt-4 flex items-center gap-3">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgb(var(--term-border))" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="rgb(var(--smcta-brand-accent-rgb))"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-sm text-muted">
        Rota en <span className="font-bold tabular-nums text-fg">{secondsLeft}s</span>
      </div>
    </div>
  );
}

// Antes el timer de 250ms seguía disparando fetchToken() cuando expiresAt quedaba vencido y el backend
// devolvía error: metía 4 requests por segundo sin freno. Ahora traba con inFlightRef y corta ante error.
export function QrCanje({
  tenant,
  couponId,
  userId,
  productName,
  userName,
  onClose,
}: {
  tenant: string;
  couponId: string;
  userId: string;
  productName: string;
  userName: string;
  onClose: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [ttlMs, setTtlMs] = useState(30_000);
  const [expiresAt, setExpiresAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const fetchToken = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const r = await api.getQrToken(tenant, couponId, userId);
      setToken(r.token);
      setTtlMs(r.ttlMs);
      setExpiresAt(r.expiresAt);
      setError(null);
    } catch (e) {
      setExpiresAt(0);
      setError(e instanceof ApiError ? e.message : 'No se pudo generar el QR.');
    } finally {
      inFlightRef.current = false;
    }
  }, [tenant, couponId, userId]);

  useEffect(() => {
    void fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (expiresAt === 0 || error) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) void fetchToken();
    }, 250);
    return () => window.clearInterval(id);
  }, [expiresAt, error, fetchToken]);

  const pct = Math.max(0, Math.min(1, (secondsLeft * 1000) / ttlMs));
  const watermark = `${userName}\n${new Date().toLocaleString()}\nSMCTA`.repeat(6);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="rise-in w-full max-w-sm rounded-card border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-fg">
            <ShieldCheck size={18} className="text-brand-accent" />
            Canje criptográfico
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-muted transition hover:bg-raised hover:text-fg"
          >
            <X size={19} />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">{productName}</p>

        {error ? (
          <QrErrorView error={error} onRetry={() => void fetchToken()} />
        ) : (
          <div className="screenshot-guard mx-auto flex flex-col items-center" data-watermark={watermark}>
            {/* OJO: aunque la app esté en modo oscuro, el pad del QR tiene que ser blanco puro sí o sí.
                Los lectores ópticos necesitan la zona silenciosa clara alrededor; invertido falla la mitad de las veces. */}
            <div className="rounded-xl border-2 border-brand-accent bg-white p-3.5 shadow-lg">
              {token && <QRCodeSVG value={token} size={200} level="M" />}
            </div>
            <CountdownRing pct={pct} secondsLeft={secondsLeft} />
            <p className="mt-3 text-center text-xs text-muted">
              Subí el brillo al máximo. Firma HMAC-SHA256 rotativa cada 30s.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
