import { useCallback, useEffect, useState } from 'react';

export type ColorMode = 'dark' | 'light';

const STORAGE_KEY = 'smcta.colorMode';

// Safari en modo privado tira excepción al tocar localStorage; si pasa, arrancamos en oscuro y listo.
function readStoredMode(): ColorMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function persistMode(mode: ColorMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* sin storage no recordamos la preferencia, la app sigue igual */
  }
}

// Mismo toggle claro/oscuro que tenía el header de Flutter. El oscuro es el default porque
// el diseño original es una terminal de trading; el claro queda para proyectar en aulas con mucha luz.
export function useColorMode(): { mode: ColorMode; toggle: () => void } {
  const [mode, setMode] = useState<ColorMode>(readStoredMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    persistMode(mode);
  }, [mode]);

  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);
  return { mode, toggle };
}

