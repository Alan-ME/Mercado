import { computePriceCollar, isWithinCollar } from '@smcta/shared';

/**
 * Tarea 2.4 (Rol 2) / Guía UX §3.2: control de banda de precios que impide
 * físicamente ingresar un valor fuera de [P_min, P_max] (RN-02). El botón de
 * confirmar se deshabilita si el valor sale del rango.
 */
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

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Piso ${collar.min.toFixed(2)}</span>
        <span>Nominal ${nominalPrice.toFixed(2)}</span>
        <span>Techo ${collar.max.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={collar.min}
        max={collar.max}
        step={0.5}
        value={Math.min(Math.max(value, collar.min), collar.max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--smcta-brand-accent)]"
        aria-label="Precio de reventa dentro de la banda permitida"
      />
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Precio:</span>
        <input
          type="number"
          value={value}
          min={collar.min}
          max={collar.max}
          step={0.5}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-32 rounded-brand border px-3 py-1.5 text-sm outline-none ${
            withinRange ? 'border-slate-300' : 'border-red-500 ring-1 ring-red-500'
          }`}
        />
        {!withinRange && (
          <span className="text-xs font-medium text-red-600">
            Fuera de la banda [{collar.min.toFixed(0)}–{collar.max.toFixed(0)}]
          </span>
        )}
      </div>
    </div>
  );
}
