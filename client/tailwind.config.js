/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6500', // Primary Brand Accent
          600: '#E65300', // Hover Accent
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6500',
          600: '#E65300',
          700: '#c2410c',
        },
        auth: {
          bg: '#0B0D11',
          card: '#151922',
          input: '#0D1015',
          border: '#292E38',
        },
        surface: {
          50: '#FAFAFA',
          100: '#F4F4F5', // Primary text
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA', // Secondary text
          500: '#71717A', // Muted text
          600: '#3F4450',
          700: '#292E38', // Standard borders
          800: '#292E38', // Border alias
          850: '#151922', // Card background
          900: '#101319', // Secondary background / Panel
          950: '#0B0D11', // Main canvas background
        },
        canvas: '#0B0D11',
        card: '#151922',
        elevated: '#1B202A',
        panel: '#101319',
        compiler: {
          500: '#10b981', // Emerald / Compiler Green
          600: '#059669',
        },
        signal: {
          500: '#f59e0b', // Amber / Signal Amber
          600: '#d97706',
        },
        fault: {
          500: '#ef4444', // Rose / Fault Rose
          600: '#dc2626',
        },
        alumni: {
          500: '#8b5cf6', // Violet / Senior & Alumni
          600: '#7c3aed',
        },
        logic: {
          500: '#38BDF8', // Terminal Cyan
          600: '#0284c7',
        },
        cyan: {
          400: '#38BDF8',
          500: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
