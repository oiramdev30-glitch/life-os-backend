/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0B0E1A',
        cardBg: '#111520',
        accent: '#7C3AED',     // púrpura
        accentPink: '#EC4899',
        accentBlue: '#3B82F6',
        accentCyan: '#06B6D4',
        muted: '#8B8E9E',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 15% 30%, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0) 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}