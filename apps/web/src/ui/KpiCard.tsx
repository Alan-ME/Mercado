import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card, IconChip, type Tone } from './kit';

export interface KpiDelta {
  text: string;
  up: boolean;
}

function DeltaBadge({ delta }: { delta: KpiDelta }) {
  const Icon = delta.up ? TrendingUp : TrendingDown;
  const tone = delta.up ? 'bg-up/15 text-up' : 'bg-down/15 text-down';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${tone}`}>
      <Icon size={14} />
      {delta.text}
    </span>
  );
}

// Port del KpiCard de Flutter: chip con ícono, delta verde/rojo arriba a la derecha y el número
// grande con cifras tabulares para que no baile el ancho cuando cambia el valor.
export function KpiCard({
  label,
  value,
  icon,
  tone,
  delta,
  footer,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  delta?: KpiDelta;
  footer?: ReactNode;
}) {
  return (
    <Card interactive className="p-[18px]">
      <div className="flex items-center justify-between">
        <IconChip icon={icon} tone={tone ?? 'accent'} />
        {delta && <DeltaBadge delta={delta} />}
      </div>
      <div className="mt-4 text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-fg">{value}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}

