/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // DiuMed Design System
        'mineral-black': 'var(--color-mineral-black)',
        'deep-graphite': 'var(--color-deep-graphite)',
        'raised-graphite': 'var(--color-deep-graphite)', /* Mapped similarly for now */
        'warm-pearl': 'var(--color-warm-pearl)',
        'soft-bone': 'var(--color-soft-bone)',
        stone: 'var(--color-stone)',
        'muted-slate': 'var(--color-muted-slate)',
        'signal-teal': 'var(--color-signal-teal)',
        'signal-burgundy': '#9A4F58', /* Kept static for specific UI elements */
        'signal-amber': 'var(--color-signal-amber)',
        'emergency-red': 'var(--color-emergency-red)',
        // Semantic tokens
        surface: {
          base: 'var(--color-mineral-black)',
          raised: 'var(--color-deep-graphite)',
          instrument: 'var(--color-deep-graphite)',
          overlay: 'rgba(23,27,30,0.92)',
          warning: 'rgba(210,163,71,0.12)',
          emergency: 'rgba(214,91,85,0.12)',
          measure: 'rgba(87,185,167,0.10)',
        },
      },
      backgroundImage: {
        'material-mineral': 'linear-gradient(145deg, #171B1E 0%, #0D1012 100%)',
        'material-pearl': 'linear-gradient(135deg, #F4F0E7 0%, #E7E1D6 100%)',
        'material-burgundy': 'linear-gradient(145deg, #9A4F58 0%, #171B1E 100%)',
        'material-teal': 'linear-gradient(145deg, #57B9A7 0%, #171B1E 100%)',
        'material-glass': 'linear-gradient(180deg, rgba(32,38,42,0.8) 0%, rgba(23,27,30,0.6) 100%)',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Instrument readout sizes
        'readout-sm': ['2rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '300' }],
        'readout-md': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '200' }],
        'readout-lg': ['5rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '200' }],
      },
      borderRadius: {
        instrument: '2px',
        card: '12px',
        modal: '20px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-breathe': 'signalBreathe 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        signalBreathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      screens: {
        xs: '360px',
        sm: '390px',
        md: '430px',
        lg: '768px',
        xl: '1024px',
      },
    },
  },
  plugins: [],
}
