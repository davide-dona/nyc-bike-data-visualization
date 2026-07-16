import { UI_COLORS, LETTER_SPACING, FONT_STACK_SANS, FONT_STACK_MONO } from './utils/editorialTokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './components/**/*.{js,jsx}',
    'App.jsx',
    './styles/**/*.css',
    './features/**/*.{js,jsx,css}',
  ],
  theme: {
    extend: {
      colors: UI_COLORS,
      fontFamily: {
        sans: FONT_STACK_SANS,
        mono: FONT_STACK_MONO,
      },
      letterSpacing: LETTER_SPACING,
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'spin-fast': 'spin 0.8s linear infinite',
        'fade-up': 'fade-up 400ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
