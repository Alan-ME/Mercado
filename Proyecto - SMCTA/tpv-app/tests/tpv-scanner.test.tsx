import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../src/App';

describe('Terminal TPV - Scanner de Canje Físico (US-06 / TASK-008)', () => {
  it('Debe renderizar la terminal con el título y controles de operador', () => {
    render(<App />);
    expect(screen.getByText('Terminal TPV - Canje en Mostrador')).toBeInTheDocument();
    expect(screen.getByText(/Visor Óptico de Canje/i)).toBeInTheDocument();
    expect(screen.getByText(/Historial de Validaciones/i)).toBeInTheDocument();
  });

  it('Debe procesar un canje válido (<30s), mostrar pantalla verde de éxito y registrar fondos liberados', async () => {
    render(<App />);

    const scanValidBtn = screen.getByText(/Escanear QR Válido \(<30s\)/i);
    fireEvent.click(scanValidBtn);

    await waitFor(() => {
      expect(screen.getByText('¡Canje Autorizado!')).toBeInTheDocument();
      expect(screen.getByText(/Transferencia Escrow Ejecutada:/i)).toBeInTheDocument();
      expect(screen.getByText(/CANJEADO \(ST-04\)/i)).toBeInTheDocument();
    });
  });

  it('Debe rechazar un token caducado (>30s) y mostrar pantalla roja de error', async () => {
    render(<App />);

    const scanExpiredBtn = screen.getByText(/Escanear QR Caducado \(>30s\)/i);
    fireEvent.click(scanExpiredBtn);

    await waitFor(() => {
      expect(screen.getByText('Canje Rechazado')).toBeInTheDocument();
      expect(screen.getAllByText(/Token QR caducado/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Debe rechazar un token perteneciente a otro Tenant', async () => {
    render(<App />);

    const scanWrongBtn = screen.getByText(/Escanear QR de Otro Tenant/i);
    fireEvent.click(scanWrongBtn);

    await waitFor(() => {
      expect(screen.getByText('Canje Rechazado')).toBeInTheDocument();
      expect(screen.getAllByText(/pertenece a otro comercio o festival/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Debe agregar los registros de canje al historial de sesión', async () => {
    render(<App />);

    const scanValidBtn = screen.getByText(/Escanear QR Válido \(<30s\)/i);
    fireEvent.click(scanValidBtn);

    await waitFor(() => {
      expect(screen.getByText('Aprobado')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });
});
