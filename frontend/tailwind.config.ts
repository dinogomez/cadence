import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        recordPulse: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(220,38,38,0)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease forwards',
        'record-pulse': 'recordPulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
