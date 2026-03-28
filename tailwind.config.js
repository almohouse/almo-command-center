/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0e0e11',
        surface: {
          DEFAULT: '#0e0e11',
          dim: '#0e0e11',
          bright: '#2c2c30',
          variant: '#25252a',
          tint: '#e6e6fa',
          'container-lowest': '#000000',
          'container-low': '#131316',
          container: '#19191d',
          'container-high': '#1f1f23',
          'container-highest': '#2a2a2d',
        },
        primary: {
          DEFAULT: '#e6e6fa',
          fixed: '#e6e6fa',
          'fixed-dim': '#c2c2f5',
          dim: '#d8d8ec',
          container: '#9e9fb2',
        },
        secondary: {
          DEFAULT: '#cacafe',
          dim: '#bdbdef',
          fixed: '#cecdff',
          'fixed-dim': '#bfbff2',
          container: '#42436e',
        },
        tertiary: {
          DEFAULT: '#ff9fe3',
          dim: '#e780cc',
          fixed: '#f68dda',
          'fixed-dim': '#e780cc',
          container: '#f68dda',
        },
        'on-surface': {
          DEFAULT: '#fcf8fc',
          variant: '#acaaae',
        },
        'on-primary': '#525464',
        'on-secondary': '#40426c',
        'on-tertiary': '#6a125c',
        'on-background': '#fcf8fc',
        error: {
          DEFAULT: '#ff6e84',
          dim: '#d73357',
          container: '#a70138',
        },
        'on-error': '#490013',
        outline: {
          DEFAULT: '#767579',
          variant: '#48474b',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px #ff9fe3' },
          '50%': { opacity: '0.5', boxShadow: '0 0 4px #ff9fe3' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
