import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { TenantConfigDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';

interface FieldDef {
  key: keyof FormState;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

interface FormState {
  sellerTakeRatePct: number;
  buyerTakeRatePct: number;
  priceFloorPct: number;
  priceCeilingPct: number;
  maxDailyResalesPerUser: number;
  closureHoursBeforeEvent: number;
  platformRevenueSharePct: number;
}

const FIELDS: FieldDef[] = [
  { key: 'sellerTakeRatePct', label: 'Take-Rate Vendedor', min: 1, max: 10, step: 0.5, suffix: '%' },
  { key: 'buyerTakeRatePct', label: 'Take-Rate Comprador', min: 0, max: 10, step: 0.5, suffix: '%' },
  { key: 'priceFloorPct', label: 'Piso Price Collar', min: 10, max: 90, step: 1, suffix: '%' },
  { key: 'priceCeilingPct', label: 'Techo Price Collar', min: 100, max: 500, step: 5, suffix: '%' },
  { key: 'maxDailyResalesPerUser', label: 'Máx. reventas/usuario/día', min: 1, max: 20, step: 1 },
  { key: 'closureHoursBeforeEvent', label: 'Cierre ventana (horas antes)', min: 1, max: 72, step: 1, suffix: 'h' },
  { key: 'platformRevenueSharePct', label: 'Reparto SMCTA Core', min: 10, max: 50, step: 1, suffix: '%' },
];

function fromConfig(c: TenantConfigDTO): FormState {
  return {
    sellerTakeRatePct: c.sellerTakeRatePct,
    buyerTakeRatePct: c.buyerTakeRatePct,
    priceFloorPct: c.priceFloorPct,
    priceCeilingPct: c.priceCeilingPct,
    maxDailyResalesPerUser: c.maxDailyResalesPerUser,
    closureHoursBeforeEvent: c.closureHoursBeforeEvent,
    platformRevenueSharePct: c.platformRevenueSharePct,
  };
}

export function AdminPortal() {
  const { tenant, config, reloadConfig } = useSession();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [primary, setPrimary] = useState('#1A365D');
  const [accent, setAccent] = useState('#3182CE');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(fromConfig(config));
      setPrimary(config.theme.primaryColor);
      setAccent(config.theme.accentColor);
    }
  }, [config]);

  if (!form || !config) return null;

  const setField = (k: keyof FormState, v: number) => setForm({ ...form, [k]: v });

  const save = async () => {
    if (!tenant) return;
    setBusy(true);
    try {
      await api.updateConfig(tenant, {
        ...form,
        themePrimaryColor: primary,
        themeAccentColor: accent,
      });
      await reloadConfig();
      toast.push('success', 'Configuración actualizada en tiempo real.');
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Panel de administración B2B</h1>
        <p className="mb-4 text-sm text-slate-500">
          Parámetros de comisiones, bandas de precios y límites operativos del mercado P2P. Los valores se validan en tiempo real.
        </p>

        <div className="grid gap-4 rounded-brand bg-white p-5 shadow-sm sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-slate-700">
                {f.label} <span className="text-xs text-slate-400">({f.min}–{f.max}{f.suffix ?? ''})</span>
              </span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, Number(e.target.value))}
                  className="w-full rounded-brand border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-[var(--smcta-brand-accent)]"
                />
                {f.suffix && <span className="text-sm text-slate-400">{f.suffix}</span>}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => void save()}
          disabled={busy}
          className="mt-4 flex items-center gap-2 rounded-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--smcta-brand-primary)' }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
        </button>
      </div>

      {/* Personalizador de marca en vivo */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Marca White-Label</h2>
        <div className="space-y-4 rounded-brand bg-white p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Color primario</span>
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="mt-1 h-10 w-full rounded-brand" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Color de acento</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-1 h-10 w-full rounded-brand" />
          </label>
          <div className="rounded-brand p-4 text-center text-white" style={{ background: primary }}>
            <div className="text-sm opacity-80">Vista previa</div>
            <button className="mt-2 rounded-brand px-4 py-1.5 text-sm font-semibold" style={{ background: accent }}>
              Botón de acción
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Al guardar, el tema se aplica en tiempo real vía CSS variables (sin recompilar).
          </p>
        </div>
      </div>
    </div>
  );
}
