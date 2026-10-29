import { useEffect, useRef, useState } from 'react';

/**
 * Escáner óptico de tokens QR vía cámara web / trasera: inicializa el stream de video
 * mediante `html5-qrcode` y dispara el callback de validación al detectar un código válido.
 */
export function QrCameraReader({ onScan }: { onScan: (text: string) => void }) {
  const elementId = useRef(`qr-cam-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const instance = new Html5Qrcode(elementId.current);
        scanner = instance as unknown as { stop: () => Promise<void>; clear: () => void };
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (decoded: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScan(decoded);
          },
          () => {
            /* frames sin QR: ignorar */
          },
        );
        if (cancelled) await instance.stop().catch(() => undefined);
      } catch {
        setError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner.stop().then(() => scanner?.clear()).catch(() => undefined);
      }
    };
  }, [onScan]);

  return (
    <div>
      <div id={elementId.current} className="overflow-hidden rounded-brand" />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
