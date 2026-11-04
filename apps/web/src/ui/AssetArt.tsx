import { BedDouble, Footprints, Sparkles, Ticket, type LucideIcon } from 'lucide-react';

// El backend no guarda categoría del producto, solo el nombre. Para no inventar un campo nuevo
// en el contrato, inferimos el ícono por palabras clave del nombre y caemos en Ticket si no matchea.
const ICON_RULES: { match: RegExp; icon: LucideIcon; category: string }[] = [
  { match: /suite|hotel|noche|escapada/i, icon: BedDouble, category: 'Hospedaje' },
  { match: /drop|par #|sneaker|zapatilla/i, icon: Footprints, category: 'Drop limitado' },
  { match: /entrada|vip|fest|ticket|general/i, icon: Ticket, category: 'Evento' },
];

const FALLBACK = { icon: Ticket, category: 'Cupón de valor' };

export function assetMeta(productName: string): { icon: LucideIcon; category: string } {
  return ICON_RULES.find((r) => r.match.test(productName)) ?? FALLBACK;
}

// Bloque con gradiente e ícono grande, port del _CoffeeCupArt de las cards de Flutter.
// Se tiñe con el acento del tenant, así cada comercio ve sus cards con su color.
export function AssetArt({ productName, compact }: { productName: string; compact?: boolean }) {
  const { icon: Icon } = assetMeta(productName);
  const height = compact ? 'h-20' : 'h-24';
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-accent/25 to-brand-accent/5 ${height}`}
    >
      <Sparkles size={18} className="absolute top-2.5 text-brand-accent/40" />
      <Icon size={compact ? 40 : 52} className="text-brand-accent" strokeWidth={1.6} />
    </div>
  );
}

