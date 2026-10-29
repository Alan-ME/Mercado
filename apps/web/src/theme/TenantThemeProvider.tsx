import { useEffect, type ReactNode } from 'react';
import type { TenantConfigDTO } from '@smcta/shared';

// Inyecta los tokens de diseño del comercio (colores primario, acento, superficie y fuente)
// como variables CSS en :root del DOM. Esto permite cambiar de inquilino White-Label al instante
// en la interfaz sin recompilar la SPA ni recargar la pestaña.
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
    root.style.setProperty('--smcta-brand-primary', config.theme.primaryColor);
    root.style.setProperty('--smcta-brand-accent', config.theme.accentColor);
    root.style.setProperty('--smcta-brand-surface', config.theme.surfaceColor);
    root.style.setProperty('--smcta-font-family', config.theme.fontFamily);
  }, [config]);

  return <>{children}</>;
}
