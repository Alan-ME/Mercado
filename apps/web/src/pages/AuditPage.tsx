import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Coins,
  Layers,
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useSession } from '../state/session';
import { useToast } from '../ui/toast';
import { api, ApiError } from '../api/client';
import { Button, Card, PageHeader, money } from '../ui/kit';
import { KpiCard } from '../ui/KpiCard';
import { Sparkline } from '../ui/Sparkline';

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

function BalanceBanner({ audit }: { audit: Audit }) {
  const Icon = audit.isBalanced ? CheckCircle2 : AlertTriangle;
  const tone = audit.isBalanced
    ? 'border-up/40 bg-up/15 text-up'
    : 'border-down/40 bg-down/15 text-down';
  const title = audit.isBalanced ? 'Balance conciliado (diferencia = 0)' : 'Descuadre contable detectado';

  return (
    <div className={`mb-6 flex items-center gap-3.5 rounded-card border p-5 ${tone}`}>
      <Icon size={28} className="shrink-0" />
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-fg">
          Diferencia: {money(audit.difference)} · El balance de custodia debe ser estrictamente cero.
        </div>
      </div>
    </div>
  );
}

// Port de la grilla de KPIs del dashboard de Flutter (dashboard_screen.dart), alimentada con los
// asientos reales de escrow_ledgers en vez de mocks.
function AuditSummary({ audit }: { audit: Audit }) {
  return (
    <>
      <BalanceBanner audit={audit} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total en Escrow"
          value={money(audit.totalInEscrow)}
          icon={ShieldCheck}
          tone="accent"
          delta={{ text: 'Custodia', up: true }}
          footer={<Sparkline data={[80, 100, 100, 140, 120, Math.max(audit.totalInEscrow, 60)]} height={32} className="text-brand-accent" />}
        />
        <KpiCard
          label="Nominal cupones vivos"
          value={money(audit.expectedLiveNominal)}
          icon={Layers}
          tone="primary"
          footer={<Sparkline data={[80, 100, 100, 140, 120, Math.max(audit.expectedLiveNominal, 60)]} height={32} className="text-brand-primary" />}
        />
        <KpiCard
          label="Comisiones comercio (neto)"
          value={money(audit.tenantFeesAccumulated)}
          icon={Coins}
          tone="up"
          delta={{ text: 'Neto B2B', up: true }}
        />
        <KpiCard
          label="Fee SMCTA Core"
          value={money(audit.platformFeesAccumulated)}
          icon={TrendingUp}
          tone="info"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Cupones canjeados" value={audit.redeemed} icon={CheckCircle2} tone="up" />
        <KpiCard label="Cupones vencidos (breakage)" value={audit.expired} icon={Clock} tone="warn" />
        <KpiCard label="Tasa de conversión" value={`${audit.redemptionRatePct.toFixed(1)}%`} icon={Percent} tone="accent" />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <span>Ecuación de invariante contable</span>
          <span className="font-mono text-fg">∑(CHECKOUT − RELEASE − REFUND) == ∑(EN_WALLET + PUBLICADO_P2P)</span>
        </div>
        <div className="mt-3 grid gap-3 border-t border-line pt-3 text-sm sm:grid-cols-3">
          <div>
            <span className="text-muted">Libro mayor: </span>
            <span className="font-bold tabular-nums text-fg">{money(audit.totalInEscrow)}</span>
          </div>
          <div>
            <span className="text-muted">Activos vivos: </span>
            <span className="font-bold tabular-nums text-fg">{money(audit.expectedLiveNominal)}</span>
          </div>
          <div>
            <span className="text-muted">Desvío: </span>
            <span className="font-bold tabular-nums text-up">{money(audit.difference)}</span>
          </div>
        </div>
      </Card>
    </>
  );
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

  const spin = loading ? 'animate-spin' : '';

  return (
    <div>
      <PageHeader
        title="Auditoría de custodia (Escrow)"
        subtitle="Conciliación en tiempo real entre asientos del libro mayor y cupones vivos."
        icon={ClipboardCheck}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void expire()}>
              <Clock size={14} /> Expirar vencidos
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw size={14} className={spin} /> Actualizar
            </Button>
          </>
        }
      />

      {audit && <AuditSummary audit={audit} />}
    </div>
  );
}
