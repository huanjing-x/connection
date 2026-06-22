/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#f5f0e8',
        'parchment-dark': '#ede4d3',
        'parchment-light': '#faf6ee',
        ink: '#3d2b1f',
        'ink-light': '#6b5a4e',
        accent: '#8b5e3c',
        'accent-light': '#a67c52',
        border: '#d4c5a9',
      },
    },
  },
  plugins: [],
}
