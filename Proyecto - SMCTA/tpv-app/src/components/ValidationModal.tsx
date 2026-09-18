import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Banknote } from 'lucide-react';
import { RedemptionResult } from '../types';

interface ValidationModalProps {
  result: RedemptionResult | null;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ result, onClose }) => {
  const [countdown, setCountdown] = useState<number>(4);

  useEffect(() => {
    if (!result) return;
    setCountdown(4);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result, onClose]);

  if (!result) return null;

  const isSuccess = result.success;

  return (
    <div
      className={`validation-overlay ${isSuccess ? 'overlay-success' : 'overlay-error'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content-box">
        <div className="giant-icon">
          {isSuccess ? (
            <CheckCircle2 size={80} color="#FFFFFF" />
          ) : (
            <XCircle size={80} color="#FFFFFF" />
          )}
        </div>

        <h2 className="modal-title">
          {isSuccess ? '¡Canje Autorizado!' : 'Canje Rechazado'}
        </h2>

        <p className="modal-detail">{result.message}</p>

        {isSuccess ? (
          <div className="modal-badge-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6EE7B7', marginBottom: '6px' }}>
              <Banknote size={18} />
              <strong>Transferencia Escrow Ejecutada:</strong>
            </div>
            <div>• Monto Liberado: <strong>${result.amountReleased?.toFixed(2)} USD</strong></div>
            <div>• Cupón ID: <code>{result.couponId}</code></div>
            <div>• Payout ID: <code>{result.payoutId}</code></div>
            <div>• Estado: <strong>CANJEADO (ST-04)</strong></div>
          </div>
        ) : (
          <div className="modal-badge-info" style={{ background: 'rgba(0,0,0,0.4)', borderColor: '#EF4444' }}>
            <div style={{ color: '#FCA5A5', marginBottom: '4px' }}>
              <strong>Código de Causa:</strong> <code>{result.status}</code>
            </div>
            {result.couponId && (
              <div style={{ color: '#FCA5A5' }}>
                Cupón: <code>{result.couponId}</code>
              </div>
            )}
          </div>
        )}

        <div className="modal-hint">
          <span>Toca cualquier parte de la pantalla para continuar ({countdown}s)</span>
        </div>
      </div>
    </div>
  );
};
