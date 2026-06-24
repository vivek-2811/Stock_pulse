/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // app is dark-only, but keep the hook available
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#10141a',
          dim: '#10141a',
          bright: '#353940',
          lowest: '#0a0e14',
          low: '#181c22',
          container: '#1c2026',
          high: '#262a31',
          highest: '#31353c',
        },
        'on-surface': '#dfe2eb',
        'on-surface-variant': '#b9cbbb',
        'inverse-surface': '#dfe2eb',
        'inverse-on-surface': '#2d3137',

        outline: '#849586',
        'outline-variant': '#3b4b3e',
        'surface-tint': '#00e383',

        primary: {
          DEFAULT: '#f2fff1',
          on: '#00391d',
          container: '#00ff94',
          'on-container': '#00713f',
        },
        'inverse-primary': '#006d3c',

        secondary: {
          DEFAULT: '#ffb3b6',
          on: '#68001a',
          container: '#c7003a',
          'on-container': '#ffd7d7',
        },

        tertiary: {
          DEFAULT: '#fffbf9',
          on: '#3c2f00',
          container: '#ffdc71',
          'on-container': '#775f00',
        },

        error: {
          DEFAULT: '#ffb4ab',
          on: '#690005',
          container: '#93000a',
          'on-container': '#ffdad6',
        },

        'primary-fixed': '#5bffa1',
        'primary-fixed-dim': '#00e383',
        'on-primary-fixed': '#00210e',
        'on-primary-fixed-variant': '#00522c',

        'secondary-fixed': '#ffdada',
        'secondary-fixed-dim': '#ffb3b6',
        'on-secondary-fixed': '#40000c',
        'on-secondary-fixed-variant': '#920028',

        'tertiary-fixed': '#ffe085',
        'tertiary-fixed-dim': '#e5c45b',
        'on-tertiary-fixed': '#231b00',
        'on-tertiary-fixed-variant': '#574500',

        background: '#10141a',
        'on-background': '#dfe2eb',
        'surface-variant': '#31353c',

        // Custom semantic tokens used throughout StockPulse
        'surface-glass': 'rgba(255, 255, 255, 0.03)',
        'border-glass': 'rgba(255, 255, 255, 0.08)',
        'text-muted': '#8A8F98',

        // Direct app accent aliases (handy shorthand in components)
        'app-bg': '#0A0E14',
        'app-green': '#00FF94',
        'app-red': '#FF3B5C',
      },

      backgroundColor: {
        'chart-fill-green': 'rgba(0, 255, 148, 0.1)',
        'chart-fill-red': 'rgba(255, 59, 92, 0.1)',
      },

      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        'display-ticker': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-data': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.05em' }],
      },

      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },

      maxWidth: {
        'container-max': '1280px',
      },

      spacing: {
        gutter: '24px',
        'margin-mobile': '16px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
      },

      backdropBlur: {
        glass: '24px', // sits within the documented 20-40px glass blur range
      },

      boxShadow: {
        // Ambient outer glow for active/hovered elements (Primary Green @ 10%)
        'glow-green': '0 0 24px rgba(0, 255, 148, 0.10)',
        'glow-red': '0 0 24px rgba(255, 59, 92, 0.10)',
        'glow-green-sm': '0 0 12px rgba(0, 255, 148, 0.18)',
        'glow-red-sm': '0 0 12px rgba(255, 59, 92, 0.18)',
        // Chart endpoint dot glow
        'dot-green': '0 0 8px 2px rgba(0, 255, 148, 0.6)',
        'dot-red': '0 0 8px 2px rgba(255, 59, 92, 0.6)',
      },

      backgroundImage: {
        // 1px gradient border trick: pair with bg-clip / mask in component, or use border-image utilities
        'glass-border-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
        'chart-gradient-green':
          'linear-gradient(180deg, rgba(0,255,148,0.20) 0%, rgba(0,255,148,0) 100%)',
        'chart-gradient-red':
          'linear-gradient(180deg, rgba(255,59,92,0.20) 0%, rgba(255,59,92,0) 100%)',
      },
    },
  },
  plugins: [],
}
