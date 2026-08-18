/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#ff6600',
        navy: {
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0d1f33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
