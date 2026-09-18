import React from 'react';
import { History, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { RedemptionLogEntry } from '../types';

interface RedemptionLogProps {
  logs: RedemptionLogEntry[];
  onClear: () => void;
}

export const RedemptionLog: React.FC<RedemptionLogProps> = ({ logs, onClear }) => {
  return (
    <div className="log-card">
      <div className="log-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="#38BDF8" />
          <h3 className="log-title">Historial de Validaciones en Mostrador</h3>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>
            {logs.length} canjes
          </span>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            className="btn-pill"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={onClear}
          >
            <Trash2 size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No hay canjes registrados en esta sesión de mostrador.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cupón ID</th>
                <th>Estado</th>
                <th>Fondos Liberados</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <code style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>{log.couponId}</code>
                  </td>
                  <td>
                    {log.success ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Aprobado
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontWeight: 600 }}>
                        <XCircle size={14} /> {log.status}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: log.success ? '#10B981' : 'inherit' }}>
                    {log.success ? `$${log.amount.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
