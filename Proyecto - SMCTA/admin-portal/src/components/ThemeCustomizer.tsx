import React from 'react';
import { Palette, Type, Image as ImageIcon } from 'lucide-react';
import { TenantConfigDTO } from '../types';

interface ThemeCustomizerProps {
  config: TenantConfigDTO;
  onChange: (updates: Partial<TenantConfigDTO>) => void;
}

const PRESET_PALETTES = [
  { name: 'Festival Neon', primary: '#6B21A8', accent: '#EC4899', surface: '#0F172A' },
  { name: 'Luxury Emerald', primary: '#065F46', accent: '#10B981', surface: '#062016' },
  { name: 'Midnight Cyber', primary: '#1E3A8A', accent: '#38BDF8', surface: '#030712' },
  { name: 'Sunset Amber', primary: '#9A3412', accent: '#F59E0B', surface: '#1C1917' },
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ config, onChange }) => {
  const theme = config.theme;

  const updateThemeField = (field: string, value: string) => {
    onChange({
      theme: {
        ...theme,
        [field]: value,
      },
    });
  };

  return (
    <div className="section-card glass-panel">
      <div className="section-header">
        <Palette className="section-icon" size={22} />
        <h2 className="section-title">Personalizador de Marca White-Label (Live Theming)</h2>
      </div>

      {/* Paletas predeterminadas */}
      <div style={{ marginBottom: '18px' }}>
        <span className="control-label" style={{ display: 'block', marginBottom: '8px' }}>
          Paletas Rápidas:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => {
                onChange({
                  theme: {
                    ...theme,
                    primaryColor: p.primary,
                    accentColor: p.accent,
                    surfaceColor: p.surface,
                  },
                });
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`,
                  display: 'inline-block',
                }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Color Primario */}
        <div>
          <label htmlFor="primary-color" className="control-label" style={{ display: 'block', marginBottom: '6px' }}>
            Color Primario
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="primary-color"
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateThemeField('primaryColor', e.target.value)}
              style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => updateThemeField('primaryColor', e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 10px',
                borderRadius: '6px',
                width: '100%',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Color Acento */}
        <div>
          <label htmlFor="accent-color" className="control-label" style={{ display: 'block', marginBottom: '6px' }}>
            Color de Acento / Highlights
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="accent-color"
              type="color"
              value={theme.accentColor}
              onChange={(e) => updateThemeField('accentColor', e.target.value)}
              style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => updateThemeField('accentColor', e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 10px',
                borderRadius: '6px',
                width: '100%',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tipografía */}
      <div className="control-group">
        <label htmlFor="font-family" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Type size={16} /> Familia Tipográfica Base
        </label>
        <select
          id="font-family"
          className="tenant-select"
          style={{ width: '100%', padding: '10px 14px' }}
          value={theme.fontFamily}
          onChange={(e) => updateThemeField('fontFamily', e.target.value)}
        >
          <option value="Outfit, sans-serif">Outfit (Moderna & Enérgica)</option>
          <option value="Inter, sans-serif">Inter (Limpia & Minimalista)</option>
          <option value="'Roboto', sans-serif">Roboto (Clásica & Corporativa)</option>
          <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Fintech)</option>
        </select>
      </div>

      {/* Logo URL */}
      <div className="control-group" style={{ marginBottom: 0 }}>
        <label htmlFor="logo-url" className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <ImageIcon size={16} /> URL del Logotipo de Marca
        </label>
        <input
          id="logo-url"
          type="text"
          value={theme.logoUrl}
          placeholder="https://tudominio.com/logo.png o /assets/logo.png"
          onChange={(e) => updateThemeField('logoUrl', e.target.value)}
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            padding: '10px 12px',
            borderRadius: '6px',
            width: '100%',
            fontSize: '0.85rem',
          }}
        />
      </div>
    </div>
  );
};
