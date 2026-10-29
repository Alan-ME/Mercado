import { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../api/client';

function QrErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="space-y-3 rounded-brand bg-red-50 p-4 text-sm text-red-700">
      <div>{error}</div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-brand bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <RefreshCw size={13} /> Reintentar emisión
      </button>
    </div>
  );
}

// Antes el timer de 250ms seguía disparando fetchToken() cuando expiresAt quedaba vencido y el backend
// devolvía error: metía 4 requests por segundo sin freno. Ahora trava con inFlightRef y corta ante error.
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

  // Timer visual a 250ms para que la barra circular gire fluida en pantalla.
  // Si expiresAt se vence, dispara la rotación al backend; si dio error cortamos acá
  // para no ametrallar el servidor a 4 peticiones por segundo en bucle infinito.
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
  // Marca de agua en mosaico con nombre del titular y timestamp para que, si le sacan captura
  // de pantalla con otro teléfono, el personal de admisión en puerta vea el screenshot clonado de una.
  const watermark = `${userName}\n${new Date().toLocaleString()}\nSMCTA`.repeat(6);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Canje de cupón</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">{productName}</p>

        {error ? (
          <QrErrorView error={error} onRetry={() => void fetchToken()} />
        ) : (
          <div className="screenshot-guard mx-auto flex flex-col items-center" data-watermark={watermark}>
            <div className="rounded-brand border-4 border-[var(--smcta-brand-primary)] p-3">
              {token && <QRCodeSVG value={token} size={200} level="M" />}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="var(--smcta-brand-accent)"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - pct)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-sm text-slate-600">
                Rota en <span className="font-bold text-slate-900">{secondsLeft}s</span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Subí el brillo de tu pantalla. El código rota cada 30 segundos por seguridad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
