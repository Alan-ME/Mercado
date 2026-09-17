import React from 'react';
import { ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { TenantConfigDTO } from '../types';

interface PriceCollarFormProps {
  config: TenantConfigDTO;
  onChange: (updates: Partial<TenantConfigDTO>) => void;
}

export const PriceCollarForm: React.FC<PriceCollarFormProps> = ({ config, onChange }) => {
  const nominalSample = 100.00;
  const floorPrice = (nominalSample * (config.priceFloorPct / 100)).toFixed(2);
  const ceilingPrice = (nominalSample * (config.priceCeilingPct / 100)).toFixed(2);

  return (
    <div className="section-card glass-panel">
      <div className="section-header">
        <ShieldAlert className="section-icon" size={22} />
        <h2 className="section-title">Bandas de Contención de Precios (Price Collar - RN-02)</h2>
      </div>

      {/* Piso Price Collar */}
      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="price-floor" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} color="#38BDF8" /> Piso de Descuento (Price Floor)
          </label>
          <span className="control-badge" style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            {config.priceFloorPct.toFixed(1)}% del nominal
          </span>
        </div>
        <input
          id="price-floor"
          type="range"
          min="10.0"
          max="90.0"
          step="5.0"
          className="control-range"
          value={config.priceFloorPct}
          onChange={(e) => onChange({ priceFloorPct: parseFloat(e.target.value) })}
        />
        <div className="range-bounds">
          <span>10.0% (Piso agresivo)</span>
          <span>Protección contra dumping</span>
          <span>90.0% (Piso conservador)</span>
        </div>
      </div>

      {/* Techo Price Collar */}
      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="price-ceiling" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#EC4899" /> Techo de Apreciación (Price Ceiling)
          </label>
          <span className="control-badge" style={{ color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            {config.priceCeilingPct.toFixed(1)}% del nominal
          </span>
        </div>
        <input
          id="price-ceiling"
          type="range"
          min="100.0"
          max="500.0"
          step="10.0"
          className="control-range"
          value={config.priceCeilingPct}
          onChange={(e) => onChange({ priceCeilingPct: parseFloat(e.target.value) })}
        />
        <div className="range-bounds">
          <span>100.0% (Sin sobreprecio)</span>
          <span>Mitigación de especulación desmedida</span>
          <span>500.0% (5x del nominal)</span>
        </div>
      </div>

      {/* Rango Permitido Visual */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        border: '1px dashed var(--border-subtle)',
        marginTop: '12px'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Simulación sobre un activo nominal de <strong>${nominalSample.toFixed(2)}</strong>:
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          <span style={{ color: '#38BDF8' }}>Piso: ${floorPrice}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← Intervalo permitido de reventa →</span>
          <span style={{ color: '#EC4899' }}>Techo: ${ceilingPrice}</span>
        </div>
      </div>
    </div>
  );
};
