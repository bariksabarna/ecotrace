/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#0D1F15',
          800: '#162A1C',
          700: '#1E3A26',
        },
        eco: {
          500: '#4CAF50',
          400: '#8BC34A',
          300: '#C8E6C9',
        },
        amber: {
          500: '#FF9800',
        },
        danger: '#EF5350',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
