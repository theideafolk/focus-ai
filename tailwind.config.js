/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7952B3',
        'primary-light': '#9B7AC6',
        'primary-dark': '#5A3B8C'
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: []
};
