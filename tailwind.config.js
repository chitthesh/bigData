/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 12px 30px -20px rgba(15, 23, 42, 0.3)'
      }
    }
  },
  plugins: []
}
