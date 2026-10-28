import { useCallback, useEffect, useState } from 'react';
import { ScanLine, CheckCircle2, XCircle, RefreshCw, Camera } from 'lucide-react';
import { useSession } from '../state/session';
import { api, ApiError } from '../api/client';
import { QrCameraReader } from '../components/QrCameraReader';

interface RedeemableCoupon {
  couponId: string;
  productName: string;
  ownerId: string;
}

type Result =
  | { kind: 'ok'; amount: number; couponId: string }
  | { kind: 'err'; message: string }
  | null;

function ResultBanner({ result }: { result: Exclude<Result, null> }) {
  if (result.kind === 'ok') {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-brand bg-emerald-600 p-5 text-white">
        <CheckCircle2 size={32} />
        <div>
          <div className="font-bold">Canje válido</div>
          <div className="text-sm opacity-90">
            Se liberaron ${result.amount.toFixed(2)} del Escrow al comercio.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4 flex items-center gap-3 rounded-brand bg-red-600 p-5 text-white">
      <XCircle size={32} />
      <div>
        <div className="font-bold">Canje rechazado</div>
        <div className="text-sm opacity-90">{result.message}</div>
      </div>
    </div>
  );
}

function CameraSection({
  cameraOn,
  onToggle,
  onScan,
}: {
  cameraOn: boolean;
  onToggle: () => void;
  onScan: (token: string) => void;
}) {
  const bg = cameraOn ? '#DC2626' : 'var(--smcta-brand-primary)';
  const label = cameraOn ? 'Apagar cámara' : 'Encender cámara';
  return (
    <div className="mb-4 rounded-brand bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Lector de cámara (QR real)</label>
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-brand px-3 py-1.5 text-sm font-semibold text-white"
          style={{ background: bg }}
        >
          <Camera size={16} /> {label}
        </button>
      </div>
      {cameraOn && (
        <div className="mt-3">
          <QrCameraReader onScan={onScan} />
          <p className="mt-2 text-xs text-slate-400">Apuntá al QR del cliente. Requiere permiso de cámara.</p>
        </div>
      )}
    </div>
  );
}

export function TpvPage() {
  const { tenant } = useSession();
  const [coupons, setCoupons] = useState<RedeemableCoupon[]>([]);
  const [selected, setSelected] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    setCoupons(await api.getRedeemableCoupons(tenant));
  }, [tenant]);

  useEffect(() => {
    void load();
  }, [load]);

  const redeem = async (token: string) => {
    if (!tenant) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api.validateQr(tenant, token);
      setResult({ kind: 'ok', amount: r.releasedToMerchant, couponId: r.couponId });
      await load();
    } catch (e) {
      setResult({ kind: 'err', message: e instanceof ApiError ? e.message : 'Error al validar.' });
    } finally {
      setBusy(false);
    }
  };

  const scanSelected = async () => {
    if (!tenant || !selected) return;
    const match = coupons.find((c) => c.couponId === selected);
    try {
      const t = await api.getQrToken(tenant, selected, match?.ownerId);
      await redeem(t.token);
    } catch (e) {
      setResult({ kind: 'err', message: e instanceof ApiError ? e.message : 'No se pudo leer el QR.' });
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
        <ScanLine size={22} /> Terminal de canje (TPV)
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Escaneá el QR del cliente para validar el cupón y liberar los fondos del Escrow al comercio.
      </p>

      <CameraSection
        cameraOn={cameraOn}
        onToggle={() => setCameraOn((v) => !v)}
        onScan={(token) => void redeem(token)}
      />

      <div className="rounded-brand bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Simular escaneo de un cupón EN_WALLET</label>
        <div className="mt-1 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-brand border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— Elegí un cupón —</option>
            {coupons.map((c) => (
              <option key={c.couponId} value={c.couponId}>
                {c.productName}
              </option>
            ))}
          </select>
          <button onClick={() => void load()} className="rounded-brand bg-slate-100 px-3" aria-label="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
        <button
          onClick={() => void scanSelected()}
          disabled={!selected || busy}
          className="mt-3 w-full rounded-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--smcta-brand-primary)' }}
        >
          Escanear y validar
        </button>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="text-sm font-medium text-slate-700">…o pegá un token QR manualmente</label>
          <textarea
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            rows={3}
            placeholder="Token del QR escaneado"
            className="mt-1 w-full rounded-brand border border-slate-300 p-2 font-mono text-xs"
          />
          <button
            onClick={() => void redeem(manualToken)}
            disabled={!manualToken || busy}
            className="mt-2 w-full rounded-brand border border-slate-300 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Validar token
          </button>
        </div>
      </div>

      {result && <ResultBanner result={result} />}
    </div>
  );
}
