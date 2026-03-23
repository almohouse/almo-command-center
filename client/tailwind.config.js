/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0f',
          1: '#0f0f18',
          2: '#13131f',
          3: '#18182a',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          hover: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          orange: '#f97316',
        },
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          muted: '#475569',
        },
      },
      backdropBlur: {
        xl: '24px',
        '2xl': '40px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-lg': '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow-blue': '0 0 24px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
