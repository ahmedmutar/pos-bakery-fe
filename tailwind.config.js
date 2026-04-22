/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crust: {
          50:  '#fdf8f0',
          100: '#f7edda',
          200: '#edd9b3',
          300: '#e0c08a',
          400: '#d4a45e',
          500: '#c98a38',
          600: '#b5722a',
          700: '#955b22',
          800: '#77481e',
          900: '#5c381a',
        },
        dough: {
          50:  '#fefcf8',
          100: '#fdf5e8',
          200: '#faeacc',
          300: '#f5d9a8',
          400: '#eec47e',
          500: '#e5aa52',
        },
        oven: {
          700: '#3d2b1f',
          800: '#2c1e15',
          900: '#1a110c',
        },
        sage: {
          400: '#87a878',
          500: '#6d8f5e',
          600: '#567048',
        },
        cream: '#fefcf8',
      },
      fontFamily: {
        display: ['Libre Baskerville', 'Georgia', 'serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'warm':       '0 4px 24px -4px rgba(93, 56, 26, 0.15)',
        'warm-lg':    '0 8px 40px -8px rgba(93, 56, 26, 0.2)',
        'inner-warm': 'inset 0 2px 8px rgba(93, 56, 26, 0.08)',
      },
    },
  },
  plugins: [],
}
