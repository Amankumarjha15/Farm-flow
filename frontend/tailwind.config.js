/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep furrow greens — the working color of the product
        furrow: {
          950: '#0f1f16',
          900: '#16301f',
          800: '#1f4229',
          700: '#2a5636',
          600: '#396f45',
          500: '#4d8a58',
          100: '#e4efe2',
          50: '#f2f7ef',
        },
        // Ripe wheat gold — accent for value, price, and calls to action
        wheat: {
          600: '#b8842a',
          500: '#d19f3d',
          400: '#e0b95f',
          300: '#eccc84',
          100: '#faf1dc',
        },
        // Overcast sky — logistics / trust / info
        overcast: {
          600: '#3d6b82',
          500: '#4f849e',
          100: '#e6eff2',
        },
        clay: '#a8552f',
        soil: '#3a2e26',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}

