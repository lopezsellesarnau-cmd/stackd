import type { Config } from 'tailwindcss'

/**
 * Paleta editorial crema/tinta/terracota (referencia: la UI de Claude) — sustituye
 * al esquema oscuro tipo Linear que usa Aithority. Contrastes verificados contra
 * el fondo crema #F5F1E8: fg-faint es el tono más claro que aún pasa AA en texto
 * pequeño (4.5:1); fg-ghost es solo para texto de display (>24px).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F1E8',
        surface: '#FFFFFF',
        raised: '#FAF7F0',
        elevated: '#F0EBDF',
        accent: {
          DEFAULT: '#C1663D',
          hover: '#B85A33', // 4.6:1 sobre blanco — el que se usa en botones
          soft: 'rgba(193,102,61,0.12)',
        },
        fg: {
          DEFAULT: '#211F1C', // 14.6:1
          muted: '#4A463F', //  8.3:1
          dim: '#6E6A61', //  4.8:1
          faint: '#726D63', //  4.6:1 — mínimo seguro para texto pequeño (AA 4.5:1)
          // Solo para texto de display (>24px): no cumple AA en texto pequeño.
          ghost: '#ABA598',
        },
        warn: '#B8663F',
        ok: '#3F7A4E',
        // Categorías de riesgo del AI Act (solo se usan en Aithority, no en StackD).
        risk: {
          alto: '#B8433F',
          transparencia: '#5A5FA0',
          minimo: '#3F7A4E',
          sin: '#726D63',
        },
      },
      borderColor: {
        line: 'rgba(0,0,0,0.08)',
        'line-strong': 'rgba(0,0,0,0.14)',
      },
      letterSpacing: {
        // Valores medidos en linear.app: -1.408px sobre 64px = -0.022em en display,
        // -0.165px sobre 15px = -0.011em en cuerpo.
        display: '-0.022em',
        body: '-0.011em',
      },
      fontWeight: {
        // Inter Variable permite pesos intermedios; Linear usa 510 en display.
        display: '510',
      },
      fontFamily: {
        // IBM Plex Mono la carga app/layout.tsx y la expone como --font-mono.
        // Es el lenguaje de etiquetado de la estética "ficha técnica".
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        glow: 'radial-gradient(70% 60% at 50% -10%, rgba(193,102,61,0.16) 0%, rgba(245,241,232,0) 70%)',
      },
    },
  },
  plugins: [],
}
export default config
