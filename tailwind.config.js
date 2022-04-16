const colors = require('tailwindcss/colors')

module.exports = {
  important: false,
  content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './pages/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class', // 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f3f4',
          100: '#e8e8e8',
          200: '#c5c5c6',
          300: '#a1a2a3',
          400: '#5b5d5e',
          500: '#151719',
          600: '#131517',
          700: '#101113',
          800: '#0d0e0f',
          900: '#0a0b0c'
        },
        accent: colors.amber
      },
      backgroundImage: (theme) => ({
        check: "url('/images/check.svg')"
      }),
      skew: {
        '-20': '-20deg'
      }
    },
    fontFamily: {
      minecraft: ['minecraftiaregular', 'sans-serif'],
      primary: ['Inter', 'sans-serif']
    }
  },
  plugins: []
}
