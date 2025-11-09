/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Color Palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#007cf0', // Main accent color
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001a33',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4', 
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00dfd8', // Secondary accent color
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        luxury: {
          gold: '#D4AF37', // Rich gold
          'gold-light': '#F4E4BC',
          'gold-dark': '#B8941F',
          'gold-pure': '#FFD700', // Pure gold for gradient borders
          diamond: '#F8FAFC', // Diamond white
          silver: '#E2E8F0',
          platinum: '#94A3B8',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'serif': ['Playfair Display', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'luxury': ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem', 
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem', // Extra large for luxury feel
        '2xl': '2rem', // Even larger for premium cards
        '3xl': '3rem',
        'full': '9999px', // For circular elements
        'luxury': '2rem',
      },
      boxShadow: {
        // Multi-layered luxury shadows
        'luxury-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'luxury': '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.08)',
        'luxury-lg': '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.1)',
        'luxury-xl': '0 16px 64px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.12)',
        'luxury-2xl': '0 24px 96px rgba(0, 0, 0, 0.12), 0 12px 48px rgba(0, 0, 0, 0.15)',
        'luxury-card': '0 8px 32px rgba(0, 124, 240, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'luxury-button': '0 4px 16px rgba(0, 124, 240, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 3px rgba(0, 0, 0, 0.12)',
        'gradient-border': '0 4px 40px rgba(36, 37, 130, 0.08)', // Subtle inner/outer shadow for lifted effect
        'hover-lift': '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)', // Enhanced hover shadow
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        // Custom luxury animations
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 124, 240, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 124, 240, 0.6)' },
        },
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'luxury-gradient-light': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f4e4bc 0%, #d4af37 50%, #b8941f 100%)',
        'diamond-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
        'gradient-border-gold-blue': 'linear-gradient(90deg, #FFD700 0%, #09c6f9 100%)', // Gold to blue gradient
        'gradient-border': 'linear-gradient(90deg, #FFD700 0%, #09c6f9 100%)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
