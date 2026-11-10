import type { Config } from 'tailwindcss'

/**
 * Minimal editorial (10 nov 2026): el estilo personal de Arnau (el de arnau-lopez.com) sobre
 * blanco puro, con otra composición. Acento: el terracota de StackD.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shimmer: { from: { backgroundPosition: '100% 0' }, to: { backgroundPosition: '-100% 0' } },
      },
      animation: { shimmer: 'shimmer 1.6s linear infinite' },
      colors: {
        paper: '#FFFFFF',
        card: '#F2F2F0',
        ink: '#141310',
        accent: '#C1663D',
        line: 'rgba(20,19,16,0.10)',
        fg: {
          muted: 'rgba(20,19,16,0.72)',
          dim: 'rgba(20,19,16,0.55)',
          faint: 'rgba(20,19,16,0.42)',
          ghost: 'rgba(20,19,16,0.28)',
        },
      },
    },
  },
  plugins: [],
}
export default config
