import React from 'react';
import { Save, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  currentTenantKey: string;
  onTenantChange: (key: string) => void;
  onSave: () => void;
  onReload: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTenantKey,
  onTenantChange,
  onSave,
  onReload,
  isSaving,
  hasUnsavedChanges,
}) => {
  return (
    <header className="top-header glass-panel">
      <div className="brand-badge">
        <div className="brand-logo-icon">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="brand-title">SMCTA Tenant Portal</h1>
          <p className="brand-subtitle">Panel de Configuración de Mercado B2B & White-Label</p>
        </div>
      </div>

      <div className="header-actions">
        <div>
          <label htmlFor="tenant-select" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
            Inquilino (Tenant):
          </label>
          <select
            id="tenant-select"
            className="tenant-select"
            value={currentTenantKey}
            onChange={(e) => onTenantChange(e.target.value)}
          >
            <option value="festival">Festival Musical Vibe (festival)</option>
            <option value="hotel">Grand Hotel & Spa (hotel)</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onReload}
          title="Recargar configuración"
        >
          <RefreshCw size={16} />
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          id="btn-save-config"
        >
          <Save size={18} />
          {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Cambios' : 'Actualizado'}
        </button>
      </div>
    </header>
  );
};
