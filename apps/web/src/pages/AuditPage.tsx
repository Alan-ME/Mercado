import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCw, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';

interface Audit {
  totalInEscrow: number;
  expectedLiveNominal: number;
  difference: number;
  isBalanced: boolean;
  tenantFeesAccumulated: number;
  platformFeesAccumulated: number;
  redeemed: number;
  expired: number;
  redemptionRatePct: number;
}

export function AuditPage() {
  const { tenant, config } = useSession();
  const toast = useToast();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenant || !config) return;
    setLoading(true);
    try {
      setAudit(await api.audit(tenant, config.tenantId));
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'Error de auditoría.');
    } finally {
      setLoading(false);
    }
  }, [tenant, config, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const expire = async () => {
    if (!tenant) return;
    try {
      const r = await api.expire(tenant);
      toast.push('success', `Cupones expirados: ${r.expired}.`);
      await load();
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'Error al expirar.');
    }
  };

  const tiles: { label: string; value: string }[] = audit
    ? [
        { label: 'Total en Escrow', value: `$${audit.totalInEscrow.toFixed(2)}` },
        { label: 'Nominal de cupones vivos', value: `$${audit.expectedLiveNominal.toFixed(2)}` },
        { label: 'Comisiones comercio', value: `$${audit.tenantFeesAccumulated.toFixed(2)}` },
        { label: 'Fee SMCTA Core', value: `$${audit.platformFeesAccumulated.toFixed(2)}` },
        { label: 'Cupones canjeados', value: String(audit.redeemed) },
        { label: 'Cupones vencidos', value: String(audit.expired) },
        { label: 'Tasa de conversión', value: `${audit.redemptionRatePct.toFixed(1)}%` },
      ]
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ClipboardCheck size={22} /> Auditoría de custodia (Escrow)
        </h1>
        <div className="flex gap-2">
          <button onClick={() => void expire()} className="flex items-center gap-1.5 rounded-brand bg-white px-3 py-1.5 text-sm shadow-sm">
            <Clock size={15} /> Expirar vencidos
          </button>
          <button onClick={() => void load()} className="flex items-center gap-1.5 rounded-brand bg-white px-3 py-1.5 text-sm shadow-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {audit && (
        <>
          <div
            className={`mb-4 flex items-center gap-3 rounded-brand p-5 ${
              audit.isBalanced ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {audit.isBalanced ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
            <div>
              <div className="font-bold">
                {audit.isBalanced ? 'Balance correcto (diferencia = 0)' : 'Descuadre detectado'}
              </div>
              <div className="text-sm">
                Diferencia: ${audit.difference.toFixed(2)} · TASK-006 exige exactamente 0.
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-brand bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-400">{t.label}</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{t.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
