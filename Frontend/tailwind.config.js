module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EA540C', // main brand orange
          light: '#FF7A3D',   // lighter variant
          dark: '#B24207'     // darker variant
        },
        secondary: '#FFEEE8',  // soft background accent
      },
      fontFamily: {
        'aclonica': ['Aclonica', 'sans-serif'],
        'jakarta': ['"Plus Jakarta Sans"', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
        'spin-reverse': 'spin 4s linear infinite reverse',
        'float': 'float 10s ease-in-out infinite',
        'swing': 'swing 2s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 1s ease-out',
        'fade-in-right': 'fadeInRight 1s ease-out',
        'fade-in': 'fadeIn 1s ease-out',
        'slide': 'slide 0.5s ease-out forwards',
        'slide-left': 'slideLeft 15s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        swing: {
          '0%, 100%': { transform: 'rotate(-15deg)' },
          '50%': { transform: 'rotate(15deg)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100px)' }
        }
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    }
  },
  plugins: []
}