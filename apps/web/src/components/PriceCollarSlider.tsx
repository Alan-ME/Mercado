import { computePriceCollar, isWithinCollar } from '@smcta/shared';
import { FIELD_CLASS, money } from '../ui/kit';

// Control de banda anti-especulación (Price Collar): el slider no permite arrastrar fuera de
// [P_min, P_max], y si el usuario tipea a mano un número ilegal en el input lo marcamos en rojo.
export function PriceCollarSlider({
  nominalPrice,
  priceFloorPct,
  priceCeilingPct,
  value,
  onChange,
}: {
  nominalPrice: number;
  priceFloorPct: number;
  priceCeilingPct: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const collar = computePriceCollar(nominalPrice, priceFloorPct, priceCeilingPct);
  const withinRange = isWithinCollar(value, collar);
  const clamped = Math.min(Math.max(value, collar.min), collar.max);
  const borderOverride = withinRange ? '' : 'border-down ring-1 ring-down/50';

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-xs tabular-nums text-muted">
        <span>Piso {money(collar.min)}</span>
        <span className="font-semibold text-fg">Nominal {money(nominalPrice)}</span>
        <span>Techo {money(collar.max)}</span>
      </div>
      <input
        type="range"
        min={collar.min}
        max={collar.max}
        step={0.5}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[rgb(var(--smcta-brand-accent-rgb))]"
        aria-label="Precio de reventa dentro de la banda permitida"
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Precio P2P</span>
        <input
          type="number"
          value={value}
          min={collar.min}
          max={collar.max}
          step={0.5}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-32 tabular-nums ${FIELD_CLASS} ${borderOverride}`}
        />
        {!withinRange && (
          <span className="text-xs font-semibold text-down">
            Fuera de banda [{collar.min.toFixed(0)}–{collar.max.toFixed(0)}]
          </span>
        )}
      </div>
    </div>
  );
}
