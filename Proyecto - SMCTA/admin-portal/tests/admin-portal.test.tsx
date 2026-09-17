import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../src/App';

describe('Tenant Admin Portal B2B (US-05 / Sprint 7)', () => {
  it('Debe renderizar el panel de administración con el título del proyecto', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('SMCTA Tenant Portal')).toBeInTheDocument();
      expect(screen.getByText(/Panel de Configuración de Mercado B2B/i)).toBeInTheDocument();
    });
  });

  it('Debe cargar los parámetros de Take-Rates y límites operativos de negocio', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Take-Rate Vendedor/i)).toBeInTheDocument();
      expect(screen.getByText(/Take-Rate Comprador/i)).toBeInTheDocument();
      expect(screen.getByText(/Reventas Diarias Máximas/i)).toBeInTheDocument();
      expect(screen.getByText(/Cierre de Mercado P2P/i)).toBeInTheDocument();
    });
  });

  it('Debe mostrar la sección de Price Collar con bandas de descuento y apreciación', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Piso de Descuento \(Price Floor\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Techo de Apreciación \(Price Ceiling\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Intervalo permitido de reventa/i)).toBeInTheDocument();
    });
  });

  it('Debe renderizar la tarjeta interactiva de Live Preview White-Label', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Previsualización en Vivo')).toBeInTheDocument();
      expect(screen.getByText('Entrada VIP Acceso General')).toBeInTheDocument();
      expect(screen.getByText('ST-02 EN_WALLET')).toBeInTheDocument();
      expect(screen.getByText('Publicar en Mercado P2P')).toBeInTheDocument();
    });
  });

  it('Debe calcular en el simulador financiero el desglose de comisiones', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Simulador Financiero en Tiempo Real/i)).toBeInTheDocument();
      expect(screen.getByText(/Ganancia Neta para tu Comercio/i)).toBeInTheDocument();
    });
  });
});
