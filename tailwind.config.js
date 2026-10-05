/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crm: {
          bg: '#F8FAFC',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          surface: '#FFFFFF',
          hover: '#F1F5F9',
          border: '#E2E8F0',
          borderLight: '#CBD5E1',
          input: '#FFFFFF',
          primary: '#2563EB',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          indigo: '#1E1B4B',
          purple: '#7C3AED',
          cyan: '#06B6D4',
        },
        blue: {
          300: '#1D4ED8',
          400: '#2563EB',
          800: '#DBEAFE',
          900: '#EFF6FF',
          950: '#EFF6FF',
        },
        cyan: {
          300: '#0E7490',
          400: '#06B6D4',
          800: '#CFFAFE',
          900: '#ECFEFF',
          950: '#ECFEFF',
        },
        violet: {
          300: '#6D28D9',
          400: '#7C3AED',
          800: '#EDE9FE',
          900: '#F5F3FF',
          950: '#F5F3FF',
        },
        emerald: {
          300: '#047857',
          400: '#059669',
          800: '#D1FAE5',
          900: '#ECFDF5',
          950: '#ECFDF5',
        },
        amber: {
          300: '#B45309',
          400: '#D97706',
          800: '#FEF3C7',
          900: '#FFFBEB',
          950: '#FFFBEB',
        },
        rose: {
          300: '#BE123C',
          400: '#E11D48',
          800: '#FFE4E6',
          900: '#FFF1F2',
          950: '#FFF1F2',
        },
        indigo: {
          300: '#4338CA',
          400: '#4F46E5',
          800: '#E0E7FF',
          900: '#EEF2FF',
          950: '#EEF2FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'crm-sm': '0 1px 2px rgba(15, 23, 42, 0.05)',
        'crm-md': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'crm-lg': '0 10px 24px rgba(15, 23, 42, 0.10)',
        'crm-blue': '0 0 0 3px rgba(37, 99, 235, 0.12)',
        'crm-violet': '0 0 0 3px rgba(124, 58, 237, 0.12)',
        'crm-cyan': '0 0 0 3px rgba(8, 145, 178, 0.12)',
      }
    },
  },
  plugins: [],
}
