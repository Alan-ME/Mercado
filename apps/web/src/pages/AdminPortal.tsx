import { useEffect, useState } from 'react';
import { Loader2, Palette, Save, Settings } from 'lucide-react';
import type { TenantConfigDTO } from '@smcta/shared';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';
import { contrastFg, hexToRgbChannels } from '../theme/TenantThemeProvider';
import { Button, Card, FIELD_CLASS, PageHeader } from '../ui/kit';

interface FieldDef {
  key: keyof FormState;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
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
  { key: 'maxDailyResalesPerUser', label: 'Máx. reventas/usuario/día', min: 1, max: 20, step: 1, suffix: '' },
  { key: 'closureHoursBeforeEvent', label: 'Cierre ventana previo', min: 1, max: 72, step: 1, suffix: 'h' },
  { key: 'platformRevenueSharePct', label: 'Reparto SMCTA Core', min: 10, max: 50, step: 1, suffix: '%' },
];

// Presets rápidos para mostrar el cambio de marca en vivo durante la defensa sin tipear hex a mano.
// El primero calca la paleta original de AppColors en vers/cafeteria_trading_app.
const PRESETS = [
  { name: 'Trading Mint', primary: '#7C5CFF', accent: '#00D9A3' },
  { name: 'Festival Amber', primary: '#6D28D9', accent: '#F59E0B' },
  { name: 'Hotel Coral', primary: '#0F766E', accent: '#F97316' },
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

function previewTextColor(hex: string): string {
  const ch = hexToRgbChannels(hex);
  const fg = ch ? contrastFg(ch) : '255 255 255';
  return `rgb(${fg})`;
}

function BrandStudio({
  primary,
  accent,
  onPrimary,
  onAccent,
}: {
  primary: string;
  accent: string;
  onPrimary: (v: string) => void;
  onAccent: (v: string) => void;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Palette size={16} className="text-brand-accent" /> Estudio White-Label
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              onPrimary(p.primary);
              onAccent(p.accent);
            }}
            className="flex items-center gap-1.5 rounded-ctl border border-line bg-raised px-2.5 py-1 text-xs font-medium text-fg transition hover:border-brand-accent"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-muted">Color primario</span>
          <input
            type="color"
            value={primary}
            onChange={(e) => onPrimary(e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded-ctl border border-line bg-raised p-1"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">Color de acento</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => onAccent(e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded-ctl border border-line bg-raised p-1"
          />
        </label>
      </div>

      <div className="rounded-ctl border border-line p-4 text-center" style={{ background: primary }}>
        <div className="text-xs font-semibold" style={{ color: previewTextColor(primary) }}>
          Vista previa en caliente
        </div>
        <span
          className="mt-2 inline-block rounded-ctl px-4 py-1.5 text-xs font-bold"
          style={{ background: accent, color: previewTextColor(accent) }}
        >
          Ejecutar orden
        </span>
      </div>

      <p className="text-xs text-muted">
        Al guardar se inyecta en `:root` por CSS variables sin recompilar el bundle ni recargar la SPA.
      </p>
    </Card>
  );
}

export function AdminPortal() {
  const { tenant, config, reloadConfig } = useSession();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [primary, setPrimary] = useState('#7C5CFF');
  const [accent, setAccent] = useState('#00D9A3');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config) return;
    setForm(fromConfig(config));
    setPrimary(config.theme.primaryColor);
    setAccent(config.theme.accentColor);
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
      toast.push('success', 'Configuración aplicada en caliente sobre el tenant.');
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Panel de administración B2B"
        subtitle="Parámetros de comisiones, bandas de precios y límites operativos del mercado P2P. Los valores se validan en tiempo real."
        icon={Settings}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs font-semibold text-fg">
                  {f.label}{' '}
                  <span className="text-muted">
                    ({f.min}–{f.max}
                    {f.suffix})
                  </span>
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, Number(e.target.value))}
                    className={`tabular-nums ${FIELD_CLASS}`}
                  />
                  {f.suffix && <span className="text-xs font-semibold text-muted">{f.suffix}</span>}
                </div>
              </label>
            ))}
          </Card>

          <Button className="mt-4" onClick={() => void save()} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
          </Button>
        </div>

        <BrandStudio primary={primary} accent={accent} onPrimary={setPrimary} onAccent={setAccent} />
      </div>
    </div>
  );
}
