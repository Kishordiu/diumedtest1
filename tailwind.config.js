/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-raised': 'var(--bg-raised)',
        'bg-instrument': 'var(--bg-instrument)',
        
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-technical': 'var(--text-technical)',
        
        'signal-teal': 'var(--color-signal-teal)',
        'signal-amber': 'var(--color-signal-amber)',
        'signal-burgundy': 'var(--color-signal-burgundy)',
        'emergency-red': 'var(--color-emergency)',
        
        // Retain legacy aliases temporarily if needed
        'mineral-black': 'var(--bg-base)',
        'deep-graphite': 'var(--bg-raised)',
        'warm-pearl': 'var(--text-primary)',
        'soft-bone': 'var(--text-secondary)',
        stone: 'var(--text-muted)',
        'muted-slate': 'var(--text-technical)',
      },
      zIndex: {
        'nav': '40',
        'floating': '45',
        'backdrop': '80',
        'sheet': '90',
        'sheet-controls': '95'
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
