/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          dark: '#073322',
          DEFAULT: '#0d5c3a',
          light: '#147a4f',
          radial: '#198754'
        },
        casino: {
          gold: '#dfb15b',
          goldLight: '#f5d77f',
          goldDark: '#997327',
          leather: '#1f1610',
          leatherBorder: '#3d281a',
          darkBg: '#0f1115',
          cardBack: '#1e293b'
        }
      },
      boxShadow: {
        'felt': 'inset 0 0 100px rgba(0, 0, 0, 0.8), 0 20px 50px rgba(0, 0, 0, 0.9)',
        'chip': '0 4px 6px -1px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        'glow-gold': '0 0 25px rgba(223, 177, 91, 0.6)',
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.6)',
      },
      animation: {
        'deal-card': 'dealCard 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flip': 'flipCard 0.5s ease forwards',
        'badge-pop': 'badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        dealCard: {
          '0%': { transform: 'scale(0.3) translateY(-40px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        },
        flipCard: {
          '0%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        badgePop: {
          '0%': { transform: 'scale(0.5)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
