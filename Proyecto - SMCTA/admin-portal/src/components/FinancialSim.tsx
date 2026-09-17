import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertOctagon } from 'lucide-react';
import { TenantConfigDTO } from '../types';

interface FinancialSimProps {
  config: TenantConfigDTO;
}

export const FinancialSim: React.FC<FinancialSimProps> = ({ config }) => {
  const nominal = 100.00;
  const [askingPrice, setAskingPrice] = useState<number>(140.00);

  const minAllowed = nominal * (config.priceFloorPct / 100);
  const maxAllowed = nominal * (config.priceCeilingPct / 100);
  const isValidRange = askingPrice >= minAllowed && askingPrice <= maxAllowed;

  const sellerFee = Number((askingPrice * (config.sellerTakeRatePct / 100)).toFixed(2));
  const netSeller = Number((askingPrice - sellerFee).toFixed(2));
  const buyerFee = Number((askingPrice * (config.buyerTakeRatePct / 100)).toFixed(2));
  const totalBuyer = Number((askingPrice + buyerFee).toFixed(2));

  const totalCommissions = Number((sellerFee + buyerFee).toFixed(2));
  const platformSplit = Number((totalCommissions * (config.platformRevenueSharePct / 100)).toFixed(2));
  const commerceNetProfit = Number((totalCommissions - platformSplit).toFixed(2));

  return (
    <div className="section-card glass-panel" style={{ marginTop: '24px' }}>
      <div className="section-header">
        <Calculator className="section-icon" size={22} />
        <h2 className="section-title">Simulador Financiero en Tiempo Real (P2P Split)</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="sim-asking-price" className="control-label" style={{ display: 'block', marginBottom: '6px' }}>
            Precio de Oferta P2P Simulado ($)
          </label>
          <input
            id="sim-asking-price"
            type="number"
            min="10"
            max="1000"
            step="5"
            value={askingPrice}
            onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: `1px solid ${isValidRange ? 'var(--border-subtle)' : 'var(--color-danger)'}`,
              padding: '10px 14px',
              borderRadius: '8px',
              width: '100%',
              fontSize: '1.1rem',
              fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <span className="control-label" style={{ display: 'block', marginBottom: '6px' }}>
            Estado de Banda (Price Collar):
          </span>
          {isValidRange ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} />
              <span>Dentro de Banda (${minAllowed.toFixed(0)} - ${maxAllowed.toFixed(0)})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.9rem' }}>
              <AlertOctagon size={18} />
              <span>Violación RN-02 (HTTP 422)</span>
            </div>
          )}
        </div>
      </div>

      {/* Desglose Contable */}
      <div className="fin-breakdown">
        <div className="fin-row">
          <span className="fin-label">Valor Nominal del Cupón Inicial:</span>
          <span className="fin-value">${nominal.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label">Precio Propuesto de Reventa (Asking):</span>
          <span className="fin-value" style={{ color: 'var(--color-info)' }}>${askingPrice.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label">Comisión Vendedor ({config.sellerTakeRatePct}%):</span>
          <span className="fin-value" style={{ color: 'var(--color-danger)' }}>- ${sellerFee.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label">Neto que recibe el Vendedor:</span>
          <span className="fin-value" style={{ color: 'var(--color-success)', fontWeight: 700 }}>${netSeller.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label">Recargo al Comprador ({config.buyerTakeRatePct}%):</span>
          <span className="fin-value" style={{ color: 'var(--color-warning)' }}>+ ${buyerFee.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label">Total pagado por Comprador en Checkout:</span>
          <span className="fin-value" style={{ fontWeight: 700 }}>${totalBuyer.toFixed(2)}</span>
        </div>
        <div className="fin-row" style={{ paddingTop: '10px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="fin-label" style={{ fontWeight: 700, color: '#A7F3D0' }}>Ganancia Neta para tu Comercio:</span>
          <span className="fin-highlight">${commerceNetProfit.toFixed(2)}</span>
        </div>
        <div className="fin-row">
          <span className="fin-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tarifa de Red SMCTA Platform ({config.platformRevenueSharePct}%):
          </span>
          <span className="fin-value" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ${platformSplit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
