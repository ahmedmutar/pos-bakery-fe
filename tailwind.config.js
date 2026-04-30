/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — hijau tua Sajiin #1E4D3B
        primary: {
          50:  '#edf5f0',
          100: '#d0e6d8',
          200: '#a3ccb4',
          300: '#6fad8a',
          400: '#3d8f64',
          500: '#217a4d',
          600: '#1E4D3B',
          700: '#183d2f',
          800: '#122d22',
          900: '#0b1e17',
        },
        // Accent — oranye Sajiin #FF8A00
        accent: {
          50:  '#fff8ec',
          100: '#ffedc9',
          200: '#ffd98f',
          300: '#ffc107',
          400: '#FF8A00',
          500: '#e67e00',
          600: '#cc6f00',
          700: '#a85a00',
        },
        // Gold — kuning Sajiin #FFC107
        gold: {
          100: '#fff9e6',
          200: '#fff0b3',
          300: '#FFE57A',
          400: '#FFC107',
        },
        // Surface — background & border
        surface: {
          50:  '#FFFEF8',
          100: '#FFF4E6',
          200: '#f0ebe3',
          300: '#e0d9ce',
          400: '#c8bfb3',
          500: '#a89e94',
          600: '#857970',
        },
        // Muted — teks sekunder
        muted: {
          300: '#9ca3af',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
        },
        // Dark — teks utama & background gelap
        dark: {
          50:  '#f3f6f4',
          100: '#e0e9e4',
          200: '#b8cfc2',
          300: '#8aad9a',
          400: '#5c8b72',
          500: '#3a6e54',
          600: '#2a5240',
          700: '#1f2d26',
          800: '#162019',
          900: '#0d1410',
        },
        white: '#ffffff',
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'warm':       '0 4px 24px -4px rgba(30, 77, 59, 0.15)',
        'warm-lg':    '0 8px 40px -8px rgba(30, 77, 59, 0.2)',
        'inner-warm': 'inset 0 2px 8px rgba(30, 77, 59, 0.08)',
      },
    },
  },
  plugins: [],
}
