import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Sparkles, AlertTriangle, Keyboard, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { tpvService } from '../services/tpv.service';

interface QRScannerProps {
  currentTenantId: string;
  onScanResult: (rawContent: string) => void;
  isProcessing: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  currentTenantId,
  onScanResult,
  isProcessing,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-viewport');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isProcessing) {
            onScanResult(decodedText);
          }
        },
        () => {
          // Frame sin QR, ignorar
        }
      );
      setCameraActive(true);
    } catch (err) {
      setCameraError('Cámara no disponible o permiso denegado. Usa los atajos o entrada manual.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // Ignorar error al detener
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanResult(manualInput.trim());
      setManualInput('');
    }
  };

  const triggerMock = (type: 'VALID' | 'EXPIRED' | 'WRONG_TENANT') => {
    const mock = tpvService.generateMockQRToken(currentTenantId, type);
    onScanResult(mock);
  };

  return (
    <div className="scanner-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', fontWeight: 700 }}>
          Visor Óptico de Canje
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-pill"
            onClick={() => (cameraActive ? stopCamera() : startCamera())}
          >
            {cameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
            <span>{cameraActive ? 'Apagar Cámara' : 'Encender Cámara'}</span>
          </button>
          <button
            type="button"
            className="btn-pill"
            onClick={() => setShowManual(!showManual)}
          >
            <Keyboard size={16} />
            <span>Entrada Manual / Pistola USB</span>
          </button>
        </div>
      </div>

      {/* Viewport para la cámara */}
      <div className="viewport-target">
        <div id="qr-reader-viewport" style={{ width: '100%', height: '100%' }} />
        {cameraActive && <div className="laser-line" />}
        {!cameraActive && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            <Camera size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>Apunta el código QR del cliente al recuadro</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
              (O pulsa un atajo de prueba rápida abajo)
            </p>
          </div>
        )}
      </div>

      {cameraError && (
        <div style={{ color: '#F87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <AlertTriangle size={16} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Entrada manual para pistola de código de barras o tests */}
      {showManual && (
        <form onSubmit={handleManualSubmit} style={{ width: '100%', maxWidth: '500px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder='Pega aquí el JSON del QRTokenPayload o usa la pistola USB...'
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{
              flex: 1,
              background: '#0B0F19',
              border: '1px solid var(--border-pos)',
              color: 'var(--text-main)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" className="btn-pill btn-pill-green">
            <Check size={16} />
            <span>Validar</span>
          </button>
        </form>
      )}

      {/* Atajos Rápidos de Simulación para Demostración y QA */}
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Atajos de Demostración Inmediata (Prueba sin cámara física):
        </span>
        <div className="quick-tests-row">
          <button
            type="button"
            className="btn-pill btn-pill-green"
            onClick={() => triggerMock('VALID')}
            disabled={isProcessing}
            id="btn-scan-valid"
          >
            <Sparkles size={16} />
            <span>Escanear QR Válido (&lt;30s)</span>
          </button>

          <button
            type="button"
            className="btn-pill btn-pill-red"
            onClick={() => triggerMock('EXPIRED')}
            disabled={isProcessing}
            id="btn-scan-expired"
          >
            <AlertTriangle size={16} />
            <span>Escanear QR Caducado (&gt;30s)</span>
          </button>

          <button
            type="button"
            className="btn-pill"
            onClick={() => triggerMock('WRONG_TENANT')}
            disabled={isProcessing}
            id="btn-scan-wrong-tenant"
          >
            <span>Escanear QR de Otro Tenant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
