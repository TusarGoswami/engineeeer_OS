/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5ee',
          100: '#ffe7d6',
          200: '#fdcbab',
          300: '#fba775',
          400: '#f58342',
          500: 'rgb(var(--color-brand-rgb) / <alpha-value>)', // Primary Brand Orange (#EF6B22)
          600: 'rgb(var(--color-brand-hover-rgb) / <alpha-value>)', // Hover Accent
          700: 'rgb(var(--color-brand-text-rgb) / <alpha-value>)', // Accessible Brand Text
          800: '#9c3c0e',
          900: '#7c300f',
          950: '#431605',
        },
        orange: {
          50: '#fff5ee',
          100: '#ffe7d6',
          200: '#fdcbab',
          300: '#fba775',
          400: '#f58342',
          500: 'rgb(var(--color-brand-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-brand-hover-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-brand-text-rgb) / <alpha-value>)',
        },
        auth: {
          bg: 'rgb(var(--bg-canvas-rgb) / <alpha-value>)',
          card: 'rgb(var(--bg-card-rgb) / <alpha-value>)',
          input: 'rgb(var(--bg-input-rgb) / <alpha-value>)',
          border: 'rgb(var(--border-subtle-rgb) / <alpha-value>)',
        },
        surface: {
          50: 'rgb(var(--surface-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--surface-100-rgb) / <alpha-value>)', // Primary text
          200: 'rgb(var(--surface-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--surface-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--surface-400-rgb) / <alpha-value>)', // Secondary text
          500: 'rgb(var(--surface-500-rgb) / <alpha-value>)', // Muted text
          600: 'rgb(var(--surface-600-rgb) / <alpha-value>)', // Strong borders
          700: 'rgb(var(--surface-700-rgb) / <alpha-value>)', // Standard borders
          750: 'rgb(var(--surface-750-rgb) / <alpha-value>)', // Subtle divider / hover
          800: 'rgb(var(--surface-800-rgb) / <alpha-value>)', // Elevated surface
          850: 'rgb(var(--surface-850-rgb) / <alpha-value>)', // Card background
          900: 'rgb(var(--surface-900-rgb) / <alpha-value>)', // Secondary elevated surface
          950: 'rgb(var(--surface-950-rgb) / <alpha-value>)', // Main canvas background
        },
        canvas: 'rgb(var(--bg-canvas-rgb) / <alpha-value>)',
        sidebar: 'rgb(var(--bg-sidebar-rgb) / <alpha-value>)',
        navbar: 'rgb(var(--bg-navbar-rgb) / <alpha-value>)',
        card: 'rgb(var(--bg-card-rgb) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated-rgb) / <alpha-value>)',
        panel: 'rgb(var(--bg-surface-rgb) / <alpha-value>)',
        compiler: {
          500: 'rgb(var(--color-compiler-rgb) / <alpha-value>)',
          600: '#09825f',
        },
        success: {
          500: 'rgb(var(--color-compiler-rgb) / <alpha-value>)',
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
      boxShadow: {
        'card-light': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'elevated-light': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
        'fadeIn': 'fade-in 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
