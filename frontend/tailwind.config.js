/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte}'],
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
        brand: {
          50: '#f0f5ff',
          100: '#e0edff',
          200: '#b9d9ff',
          300: '#7bb8ff',
          400: '#3694ff',
          500: '#0c6ef5',
          600: '#0052d2',
          700: '#0041aa',
          800: '#00388c',
          900: '#062f74',
        },
      },
    },
  },
  plugins: [],
};
