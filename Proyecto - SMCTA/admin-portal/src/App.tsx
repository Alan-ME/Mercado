import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CommissionForm } from './components/CommissionForm';
import { PriceCollarForm } from './components/PriceCollarForm';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { FinancialSim } from './components/FinancialSim';
import { LivePreview } from './components/LivePreview';
import { TenantConfigDTO } from './types';
import { fetchTenantConfig, saveTenantConfig } from './api/tenant.api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [tenantKey, setTenantKey] = useState<string>('festival');
  const [config, setConfig] = useState<TenantConfigDTO | null>(null);
  const [initialConfig, setInitialConfig] = useState<TenantConfigDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Carga inicial y ante cambio de inquilino
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchTenantConfig(tenantKey)
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantKey]);

  // Inyección reactiva de CSS Variables para Live Theming
  useEffect(() => {
    if (!config?.theme) return;
    const root = document.documentElement;
    root.style.setProperty('--smcta-brand-primary', config.theme.primaryColor);
    root.style.setProperty('--smcta-brand-accent', config.theme.accentColor);
    root.style.setProperty('--smcta-brand-surface', config.theme.surfaceColor);
    root.style.setProperty('--smcta-brand-font', config.theme.fontFamily);
  }, [config?.theme]);

  // Comprueba si hay cambios pendientes por guardar
  const hasUnsavedChanges = Boolean(
    config &&
    initialConfig &&
    JSON.stringify(config) !== JSON.stringify(initialConfig)
  );

  const handleUpdate = (updates: Partial<TenantConfigDTO>) => {
    if (!config) return;
    setConfig({
      ...config,
      ...updates,
      theme: {
        ...config.theme,
        ...(updates.theme || {}),
      },
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const saved = await saveTenantConfig(tenantKey, config);
      setConfig(saved);
      setInitialConfig(JSON.parse(JSON.stringify(saved)));
      setToast({
        message: '¡Parámetros de mercado y tema visual guardados exitosamente!',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Fallo al guardar configuración',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    fetchTenantConfig(tenantKey).then((data) => {
      setConfig(data);
      setInitialConfig(JSON.parse(JSON.stringify(data)));
      setIsLoading(false);
      setToast({ message: 'Configuración recargada desde el servidor.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    });
  };

  if (isLoading || !config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cargando Tenant Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        currentTenantKey={tenantKey}
        onTenantChange={setTenantKey}
        onSave={handleSave}
        onReload={handleReload}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="dashboard-grid">
        {/* Columna Izquierda: Formularios de Negocio y Personalización */}
        <div className="forms-column">
          <CommissionForm config={config} onChange={handleUpdate} />
          <PriceCollarForm config={config} onChange={handleUpdate} />
          <ThemeCustomizer config={config} onChange={handleUpdate} />
          <FinancialSim config={config} />
        </div>

        {/* Columna Derecha: Vista Previa White-Label en Vivo */}
        <div className="preview-column">
          <LivePreview config={config} />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
