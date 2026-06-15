/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b3c9ff',
          300: '#7aa3ff',
          400: '#3d74ff',
          500: '#1a4dff',
          600: '#0030e6',
          700: '#0026c4',
          800: '#001e9c',
          900: '#00177a',
        },
      },
    },
  },
  plugins: [],
};
