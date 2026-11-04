import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Tonos compartidos para chips, badges e íconos. Lookup en vez de ternarios encadenados:
// sumar un tono nuevo es una línea y no infla la complejidad de nadie.
export type Tone = 'accent' | 'primary' | 'up' | 'down' | 'warn' | 'info' | 'neutral';

export const TONE_CHIP: Record<Tone, string> = {
  accent: 'bg-brand-accent/15 text-brand-accent',
  primary: 'bg-brand-primary/15 text-brand-primary',
  up: 'bg-up/15 text-up',
  down: 'bg-down/15 text-down',
  warn: 'bg-warn/15 text-warn',
  info: 'bg-info/15 text-info',
  neutral: 'bg-raised text-muted',
};

const TONE_BORDER: Record<Tone, string> = {
  accent: 'border-brand-accent/35',
  primary: 'border-brand-primary/35',
  up: 'border-up/35',
  down: 'border-down/35',
  warn: 'border-warn/35',
  info: 'border-info/35',
  neutral: 'border-line',
};

// Superficie base de todo el front (equivale al BoxDecoration con cardColor + dividerColor de Flutter).
// `interactive` replica el hover del ProductCard: sube 4px y el borde se tiñe con el acento del tenant.
export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const hover = interactive
    ? 'transition duration-200 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-[0_10px_28px_-10px_rgb(var(--smcta-brand-accent-rgb)/0.35)]'
    : '';
  return (
    <div className={`rounded-card border border-line bg-panel ${hover} ${className ?? ''}`}>{children}</div>
  );
}

const BUTTON_VARIANT = {
  primary: 'bg-brand-accent text-brand-accent-fg hover:brightness-110 font-bold',
  outline: 'border border-line bg-panel text-fg hover:bg-raised font-semibold',
  ghost: 'text-muted hover:bg-raised hover:text-fg font-semibold',
  danger: 'bg-down text-white hover:brightness-110 font-bold',
  warn: 'border border-warn/40 bg-warn/10 text-warn hover:bg-warn/15 font-semibold',
} as const;

const BUTTON_SIZE = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
} as const;

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANT;
  size?: keyof typeof BUTTON_SIZE;
}) {
  const v = BUTTON_VARIANT[variant ?? 'primary'];
  const s = BUTTON_SIZE[size ?? 'md'];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-ctl tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function Badge({ tone, children, dot }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide ${TONE_CHIP[tone]} ${TONE_BORDER[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function IconChip({ icon: Icon, tone, size }: { icon: LucideIcon; tone: Tone; size?: number }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg p-2 ${TONE_CHIP[tone]}`}>
      <Icon size={size ?? 18} />
    </span>
  );
}

// Encabezado de sección, mismo esquema que _SectionHeader de Flutter: título, bajada y acción a la derecha.
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-fg">
          {Icon && <Icon size={22} className="text-brand-accent" />}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ icon: Icon, children, right }: { icon: LucideIcon; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
        <Icon size={17} className="text-brand-accent" />
        {children}
      </h2>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-panel/60 p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

// Inputs y selects con la misma pinta que el InputDecorationTheme de Flutter (relleno elevado, foco en acento).
export const FIELD_CLASS =
  'w-full rounded-ctl border border-line bg-raised px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/40';

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

