import React from 'react';
import { Percent, Clock, Repeat } from 'lucide-react';
import { TenantConfigDTO } from '../types';

interface CommissionFormProps {
  config: TenantConfigDTO;
  onChange: (updates: Partial<TenantConfigDTO>) => void;
}

export const CommissionForm: React.FC<CommissionFormProps> = ({ config, onChange }) => {
  return (
    <div className="section-card glass-panel">
      <div className="section-header">
        <Percent className="section-icon" size={22} />
        <h2 className="section-title">Comisiones y Parámetros Operativos (Take-Rates)</h2>
      </div>

      {/* Take Rate Vendedor */}
      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="seller-take-rate" className="control-label">
            Take-Rate Vendedor (Deducción al vender)
          </label>
          <span className="control-badge">{config.sellerTakeRatePct.toFixed(2)}%</span>
        </div>
        <input
          id="seller-take-rate"
          type="range"
          min="1.0"
          max="10.0"
          step="0.1"
          className="control-range"
          value={config.sellerTakeRatePct}
          onChange={(e) => onChange({ sellerTakeRatePct: parseFloat(e.target.value) })}
        />
        <div className="range-bounds">
          <span>Mín: 1.0%</span>
          <span>Recomendado: 3.5%</span>
          <span>Máx: 10.0%</span>
        </div>
      </div>

      {/* Take Rate Comprador */}
      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="buyer-take-rate" className="control-label">
            Take-Rate Comprador (Recargo al comprar)
          </label>
          <span className="control-badge">{config.buyerTakeRatePct.toFixed(2)}%</span>
        </div>
        <input
          id="buyer-take-rate"
          type="range"
          min="0.0"
          max="10.0"
          step="0.1"
          className="control-range"
          value={config.buyerTakeRatePct}
          onChange={(e) => onChange({ buyerTakeRatePct: parseFloat(e.target.value) })}
        />
        <div className="range-bounds">
          <span>Mín: 0.0%</span>
          <span>Recomendado: 2.5%</span>
          <span>Máx: 10.0%</span>
        </div>
      </div>

      {/* Máximo Reventas Diarias */}
      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="max-resales" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Repeat size={16} /> Reventas Diarias Máximas por Usuario
          </label>
          <span className="control-badge">{config.maxDailyResalesPerUser} ops/día</span>
        </div>
        <input
          id="max-resales"
          type="range"
          min="1"
          max="20"
          step="1"
          className="control-range"
          value={config.maxDailyResalesPerUser}
          onChange={(e) => onChange({ maxDailyResalesPerUser: parseInt(e.target.value, 10) })}
        />
        <div className="range-bounds">
          <span>1 operación</span>
          <span>Protección Anti-Especulación</span>
          <span>20 operaciones</span>
        </div>
      </div>

      {/* Cierre de Ventana Previo al Evento */}
      <div className="control-group" style={{ marginBottom: 0 }}>
        <div className="control-label-row">
          <label htmlFor="closure-hours" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Cierre de Mercado P2P antes del Evento
          </label>
          <span className="control-badge">{config.closureHoursBeforeEvent} horas</span>
        </div>
        <input
          id="closure-hours"
          type="range"
          min="1"
          max="72"
          step="1"
          className="control-range"
          value={config.closureHoursBeforeEvent}
          onChange={(e) => onChange({ closureHoursBeforeEvent: parseInt(e.target.value, 10) })}
        />
        <div className="range-bounds">
          <span>1 hora antes</span>
          <span>Ventana de seguridad para canje</span>
          <span>72 horas antes</span>
        </div>
      </div>
    </div>
  );
};
