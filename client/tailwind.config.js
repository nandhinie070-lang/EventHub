/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        dark: {
          bg: '#0b0f19',
          card: '#111827',
          cardBorder: '#1f2937',
          surface: '#1e293b'
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(99, 102, 241, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(99, 102, 241, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(168, 85, 247, 0.4)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
