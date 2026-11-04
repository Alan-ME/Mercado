import { useCallback, useEffect, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ScanLine, XCircle } from 'lucide-react';
import { useSession } from '../state/session';
import { api, ApiError } from '../api/client';
import { QrCameraReader } from '../components/QrCameraReader';
import { Button, Card, FIELD_CLASS, PageHeader, money } from '../ui/kit';

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
      <div className="rise-in mt-4 flex items-center gap-3.5 rounded-card border border-up/40 bg-up/15 p-5 text-up">
        <CheckCircle2 size={30} className="shrink-0" />
        <div>
          <div className="font-bold">Canje válido · Admisión autorizada</div>
          <div className="text-sm text-fg">
            Se liberaron <span className="font-bold tabular-nums">{money(result.amount)}</span> del Escrow al comercio.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rise-in mt-4 flex items-center gap-3.5 rounded-card border border-down/40 bg-down/15 p-5 text-down">
      <XCircle size={30} className="shrink-0" />
      <div>
        <div className="font-bold">Canje rechazado</div>
        <div className="text-sm text-fg">{result.message}</div>
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
  const variant = cameraOn ? 'danger' : 'primary';
  const label = cameraOn ? 'Apagar cámara' : 'Encender cámara';
  return (
    <Card className="mb-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-fg">Lector óptico (cámara en vivo)</div>
          <div className="text-xs text-muted">Valida firma HMAC-SHA256, TTL de 30s y versión de titularidad.</div>
        </div>
        <Button variant={variant} size="sm" onClick={onToggle}>
          <Camera size={15} /> {label}
        </Button>
      </div>
      {cameraOn && (
        <div className="mt-4">
          <QrCameraReader onScan={onScan} />
          <p className="mt-2 text-xs text-muted">Apuntá al QR dinámico del cliente. Requiere permiso del navegador.</p>
        </div>
      )}
    </Card>
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

  const findOwnerId = (couponId: string): string | undefined => {
    const match = coupons.find((c) => c.couponId === couponId);
    return match ? match.ownerId : undefined;
  };

  const scanSelected = async () => {
    if (!tenant || !selected) return;
    try {
      const t = await api.getQrToken(tenant, selected, findOwnerId(selected));
      await redeem(t.token);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo leer el QR.';
      setResult({ kind: 'err', message: msg });
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Terminal de punto de venta (TPV)"
        subtitle="Escaneá el QR del tenedor actual para quemar el activo y liquidar la garantía."
        icon={ScanLine}
      />

      <CameraSection
        cameraOn={cameraOn}
        onToggle={() => setCameraOn((v) => !v)}
        onScan={(token) => void redeem(token)}
      />

      <Card className="p-5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Simulador rápido (cupones EN_WALLET del recinto)
        </label>
        <div className="mt-2 flex gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={FIELD_CLASS}>
            <option value="">— Elegí un cupón activo —</option>
            {coupons.map((c) => (
              <option key={c.couponId} value={c.couponId}>
                {c.productName}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => void load()} aria-label="Actualizar">
            <RefreshCw size={15} />
          </Button>
        </div>
        <Button className="mt-3 w-full" onClick={() => void scanSelected()} disabled={!selected || busy}>
          Escanear y liquidar Escrow
        </Button>

        <div className="mt-5 border-t border-line pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Verificación manual de payload firmado
          </label>
          <textarea
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            rows={3}
            placeholder="couponId:tenantId:ownerId:ts:nonce:ver:hmac"
            className={`mt-2 font-mono text-xs ${FIELD_CLASS}`}
          />
          <Button
            variant="outline"
            className="mt-2.5 w-full"
            onClick={() => void redeem(manualToken)}
            disabled={!manualToken || busy}
          >
            Validar token crudo
          </Button>
        </div>
      </Card>

      {result && <ResultBanner result={result} />}
    </div>
  );
}
