import React from 'react';
import { QrCode, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import { TenantConfigDTO } from '../types';

interface LivePreviewProps {
  config: TenantConfigDTO;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ config }) => {
  const { theme } = config;

  return (
    <div className="preview-container">
      <div className="preview-phone-card" style={{ fontFamily: theme.fontFamily }}>
        {/* Barra superior de la vista previa */}
        <div className="preview-bar">
          <div className="preview-logo">
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Sparkles size={14} />
            </div>
            <span>{config.companyName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            <span>Previsualización en Vivo</span>
          </div>
        </div>

        {/* Tarjeta de Cupón White-Label */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderTop: `3px solid ${theme.accentColor}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span
                style={{
                  background: '#DEF7EC',
                  color: '#03543F',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '6px',
                }}
              >
                ST-02 EN_WALLET
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>Entrada VIP Acceso General</h3>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Subdominio: {config.subdomain}.smcta.local</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Valor Nominal</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>$100.00</span>
            </div>
          </div>

          {/* QR Criptográfico Mock */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <QrCode size={48} color={theme.primaryColor} />
            <div style={{ color: '#0F172A', fontSize: '0.75rem' }}>
              <strong style={{ display: 'block', color: theme.primaryColor }}>Token HMAC Dinámico (30s)</strong>
              <span>Garantía de Custodia en Escrow</span>
            </div>
          </div>

          {/* Botón Primario con Tematización del Tenant */}
          <button
            type="button"
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: `0 4px 14px ${theme.accentColor}40`,
            }}
          >
            <ShoppingBag size={16} />
            <span>Publicar en Mercado P2P</span>
          </button>
        </div>

        {/* Resumen de Reglas de Mercado en el Widget */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', marginBottom: '6px' }}>
            <ShieldCheck size={14} color="#38BDF8" />
            <span>Condiciones Activas del Comercio:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#E2E8F0' }}>
            <div>• Venta: -{config.sellerTakeRatePct}%</div>
            <div>• Compra: +{config.buyerTakeRatePct}%</div>
            <div>• Piso P2P: {config.priceFloorPct}%</div>
            <div>• Techo P2P: {config.priceCeilingPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
