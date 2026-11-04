import { CouponState } from '@smcta/shared';
import { Badge, type Tone } from '../ui/kit';

// Mapea cada estado de la máquina finita a la semántica de colores de mercado (up/warn/down/info).
// Al usar canales con alpha se lee bien tanto sobre fondo #13161F oscuro como sobre blanco.
const STATE_META: Record<CouponState, { tone: Tone; label: string }> = {
  [CouponState.EMITIDO]: { tone: 'info', label: 'Emitido' },
  [CouponState.EN_WALLET]: { tone: 'up', label: 'En billetera' },
  [CouponState.PUBLICADO_P2P]: { tone: 'warn', label: 'Publicado P2P' },
  [CouponState.CANJEADO]: { tone: 'neutral', label: 'Canjeado' },
  [CouponState.VENCIDO]: { tone: 'down', label: 'Vencido' },
};

export function StatusPill({ state }: { state: CouponState }) {
  const meta = STATE_META[state];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
