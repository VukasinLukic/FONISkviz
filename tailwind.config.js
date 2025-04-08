/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5A1B09",
        secondary: "#D35322", 
        accent: "#FCE4BC",
        highlight: "#bfc330",
        special: "#C40B61",
        tertiarypink: "#db72a7",
        tertiarygreen: "#d8d887",
        tertiarybrown: "#a0756b",
      },
      fontFamily: {
        'basteleur': ['Basteleur', 'serif'],
        'caviar': ['Caviar Dreams', 'sans-serif']
      },
      animation: {
        timer: 'timer 30s linear forwards'
      },
      keyframes: {
        timer: {
          '0%': { width: '100%' },
          '100%': { width: '0%' }
        }
      }
    },
  },
  plugins: [],
}
