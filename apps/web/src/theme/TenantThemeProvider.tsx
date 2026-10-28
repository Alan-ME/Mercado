import { useEffect, type ReactNode } from 'react';
import type { TenantConfigDTO } from '@smcta/shared';

/**
 * Tarea 2.1 (Rol 2): inyecta la identidad visual del tenant como CSS variables
 * en :root, permitiendo cambiar de marca en tiempo de ejecución sin recompilar.
 */
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
