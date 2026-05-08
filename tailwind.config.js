/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8E1FE',
          100: '#B8A3F9',
          200: '#A080F7',
          300: '#8B6FF5',
          400: '#7A5DF3',
          500: '#6C4CF1',
          600: '#5A3DD9',
          700: '#4B2EDB',
          800: '#3D24B8',
          900: '#2A1A8F',
          darkest: '#2a1a8f',
          darker: '#3d24b8',
          dark: '#5b3dd9',
          light: '#8b6ff5',
          lighter: '#b8a3f9',
          lightest: '#e8e1fe',
        }
      }
    },
  },
  plugins: [],
}
