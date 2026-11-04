import { useEffect, useRef, useState } from 'react';

type ScannerHandle = { stop: () => Promise<void>; clear: () => void };

function cleanupScanner(scanner: ScannerHandle | null): void {
  if (!scanner) return;
  scanner.stop().then(() => scanner.clear()).catch(() => undefined);
}

// Abre el stream óptico de cámara con html5-qrcode. Usamos import dinámico porque la librería
// pesa bastante y no tiene sentido cargarla hasta que el operador prende el lector en el TPV.
export function QrCameraReader({ onScan }: { onScan: (text: string) => void }) {
  const elementId = useRef(`qr-cam-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    let scanner: ScannerHandle | null = null;
    let cancelled = false;

    const handleFrame = (decoded: string) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      onScan(decoded);
    };

    void (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const instance = new Html5Qrcode(elementId.current);
        scanner = instance as unknown as ScannerHandle;
        await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, handleFrame, () => undefined);
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
      }
    })();

    return () => {
      cancelled = true;
      cleanupScanner(scanner);
    };
  }, [onScan]);

  return (
    <div>
      <div id={elementId.current} className="overflow-hidden rounded-ctl border border-line bg-raised" />
      {error && <p className="mt-2 text-xs font-medium text-down">{error}</p>}
    </div>
  );
}
