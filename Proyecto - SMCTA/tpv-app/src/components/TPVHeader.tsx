import React from 'react';
import { Store, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface TPVHeaderProps {
  currentTenantId: string;
  onTenantChange: (tenantId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TPVHeader: React.FC<TPVHeaderProps> = ({
  currentTenantId,
  onTenantChange,
  soundEnabled,
  onToggleSound,
}) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="tpv-header">
      <div className="tpv-brand">
        <div className="tpv-badge-icon">
          <Store size={22} />
        </div>
        <div>
          <h1 className="tpv-title">Terminal TPV - Canje en Mostrador</h1>
          <p className="tpv-subtitle">Validación Criptográfica & Liquidación Escrow</p>
        </div>
      </div>

      <div className="tpv-header-controls">
        <label htmlFor="tpv-tenant-select" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Comercio:
        </label>
        <select
          id="tpv-tenant-select"
          className="select-pos"
          value={currentTenantId}
          onChange={(e) => onTenantChange(e.target.value)}
        >
          <option value="11111111-1111-1111-1111-111111111111">Festival Musical Vibe</option>
          <option value="22222222-2222-2222-2222-222222222222">Grand Hotel & Spa</option>
        </select>

        <button
          type="button"
          className="btn-icon-pos"
          onClick={onToggleSound}
          title={soundEnabled ? 'Silenciar sonidos de confirmación' : 'Activar sonidos'}
        >
          {soundEnabled ? <Volume2 size={18} color="#10B981" /> : <VolumeX size={18} color="#94A3B8" />}
        </button>

        <button
          type="button"
          className="btn-icon-pos"
          onClick={toggleFullScreen}
          title="Pantalla Completa (Modo Kiosco / Terminal)"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </header>
  );
};
