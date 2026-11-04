/** @type {import('tailwindcss').Config} */

// Los colores viven como canales "R G B" en CSS variables para que Tailwind pueda aplicarles
// opacidad (bg-panel/80, bg-brand-accent/15). Con un hex pelado en la variable eso no anda.
const rgb = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chrome de terminal de trading, calcado de AppColors del diseño Flutter.
        // Cambia entre oscuro y claro según data-theme en <html>.
        canvas: rgb('--term-bg'),
        panel: rgb('--term-surface'),
        raised: rgb('--term-elevated'),
        line: rgb('--term-border'),
        fg: rgb('--term-text'),
        muted: rgb('--term-muted'),
        // Semántica de mercado: verde sube, rojo baja. No dependen del tenant.
        up: rgb('--mkt-up'),
        down: rgb('--mkt-down'),
        warn: rgb('--mkt-warn'),
        info: rgb('--mkt-info'),
        // Tokens White-Label: los inyecta TenantThemeProvider desde la config del comercio.
        brand: {
          primary: rgb('--smcta-brand-primary-rgb'),
          accent: rgb('--smcta-brand-accent-rgb'),
          'primary-fg': rgb('--smcta-brand-primary-fg'),
          'accent-fg': rgb('--smcta-brand-accent-fg'),
          surface: 'var(--smcta-brand-surface)',
        },
      },
      fontFamily: {
        brand: 'var(--smcta-font-family)',
      },
      borderRadius: {
        brand: 'var(--smcta-border-radius)',
        card: '14px',
        ctl: '10px',
      },
    },
  },
  plugins: [],
};
