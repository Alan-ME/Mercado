import { useEffect, type ReactNode } from 'react';
import type { TenantConfigDTO } from '@smcta/shared';

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const LUMA = [0.2126, 0.7152, 0.0722];
const DARK_FG = '11 14 20';
const LIGHT_FG = '255 255 255';

// Tailwind necesita "R G B" para poder aplicar opacidad (bg-brand-accent/15).
// Si el admin guarda algo que no es hex válido devolvemos null y dejamos el color anterior.
export function hexToRgbChannels(hex: string): string | null {
  const body = HEX.exec(hex.trim())?.[1];
  if (!body) return null;
  const full = body.length === 3 ? [...body].map((c) => c + c).join('') : body;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// El tenant puede elegir un acento amarillo patito o un azul marino; si siempre pintamos el texto
// del botón en blanco, con el amarillo no se lee nada. Elegimos negro o blanco según la luminancia.
export function contrastFg(channels: string): string {
  const luma = channels
    .split(' ')
    .map(Number)
    .reduce((acc, v, i) => acc + v * (LUMA[i] ?? 0), 0);
  return luma > 128 ? DARK_FG : LIGHT_FG;
}

function applyBrandColor(root: HTMLElement, name: 'primary' | 'accent', hex: string): void {
  root.style.setProperty(`--smcta-brand-${name}`, hex);
  const channels = hexToRgbChannels(hex);
  if (!channels) return;
  root.style.setProperty(`--smcta-brand-${name}-rgb`, channels);
  root.style.setProperty(`--smcta-brand-${name}-fg`, contrastFg(channels));
}

// Inyecta los tokens de diseño del comercio (primario, acento, superficie y fuente) como variables
// CSS en :root. El chrome de terminal (fondos, bordes, texto) no lo toca: eso es del producto,
// no del tenant. Así se cambia de inquilino al instante sin recompilar la SPA ni recargar.
export function TenantThemeProvider({
  config,
  children,
}: {
  config: TenantConfigDTO | null;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!config) return;
    const root = document.documentElement;
    applyBrandColor(root, 'primary', config.theme.primaryColor);
    applyBrandColor(root, 'accent', config.theme.accentColor);
    root.style.setProperty('--smcta-brand-surface', config.theme.surfaceColor);
    root.style.setProperty('--smcta-font-family', config.theme.fontFamily);
  }, [config]);

  return <>{children}</>;
}
