import type { Config } from 'tailwindcss'

/**
 * Lenguaje "minimal espacio abierto" (5 oct 2026), el mismo de arnau-lopez.com
 * (vault: Diseño/10-minimal-espacio-abierto). Diferencia deliberada con el
 * portfolio: el acento de StackD es su terracota #C1663D, no el rust #B0413D.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FCFCFB',
        card: '#EDEDEB',
        ink: '#141310',
        accent: '#C1663D',
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
