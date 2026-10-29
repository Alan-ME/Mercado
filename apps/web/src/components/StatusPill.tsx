import { CouponState } from '@smcta/shared';

// Paleta visual semántica para identificar el estado del cupón de un solo vistazo.
const STYLES: Record<CouponState, { bg: string; fg: string; label: string }> = {
  [CouponState.EMITIDO]: { bg: '#E0E7FF', fg: '#3730A3', label: 'Emitido' },
  [CouponState.EN_WALLET]: { bg: '#DEF7EC', fg: '#03543F', label: 'En billetera' },
  [CouponState.PUBLICADO_P2P]: { bg: '#FEF08A', fg: '#713F12', label: 'Publicado P2P' },
  [CouponState.CANJEADO]: { bg: '#E5E7EB', fg: '#374151', label: 'Canjeado' },
  [CouponState.VENCIDO]: { bg: '#FEE2E2', fg: '#991B1B', label: 'Vencido' },
};

export function StatusPill({ state }: { state: CouponState }) {
  const s = STYLES[state];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
