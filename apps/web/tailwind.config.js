/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens White-Label: leen las CSS variables inyectadas por el TenantThemeProvider
        brand: {
          primary: 'var(--smcta-brand-primary)',
          accent: 'var(--smcta-brand-accent)',
          surface: 'var(--smcta-brand-surface)',
        },
      },
      fontFamily: {
        brand: 'var(--smcta-font-family)',
      },
      borderRadius: {
        brand: 'var(--smcta-border-radius)',
      },
    },
  },
  plugins: [],
};
