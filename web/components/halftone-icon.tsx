/**
 * Ilustraciones en ASCII o trama de puntos — mismo lenguaje que la rama del
 * hero (dot-tree.tsx): silueta con núcleo denso y borde que se deshace.
 *
 * Dos fuentes de forma:
 *  · `video` — la única silueta hecha a mano que quedó en pie (un botón de
 *    play). Las demás (casa, chat, edificio, llave...) se probaron y no se
 *    entendían — geometría a mano sin detalle real no lee como un icono, solo
 *    como una mancha. Se quitaron en vez de forzarlas.
 *  · `PhotoDots` — halftone de verdad a partir de una foto de referencia
 *    (photo-art-data.ts), esa es la fuente para todo lo que necesite leerse
 *    de cerca.
 *
 * Determinista (PRNG con semilla) para que sea seguro renderizarlo en
 * servidor sin mismatch de hidratación — no hace falta 'use client'.
 */

type Punto = [number, number]
type DistFn = (x: number, y: number) => number

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Distancia con signo al borde de un polígono convexo — positiva dentro. */
function polyDist(poly: Punto[]): DistFn {
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    area += x1 * y2 - x2 * y1
  }
  const pts = area < 0 ? [...poly].reverse() : poly
  return (x, y) => {
    let minD = Infinity
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      const ex = x2 - x1
      const ey = y2 - y1
      const len = Math.hypot(ex, ey) || 1
      const nx = -ey / len
      const ny = ex / len
      const d = (x - x1) * nx + (y - y1) * ny
      if (d < minD) minD = d
    }
    return minD
  }
}

/** Anillo (círculo hueco) — para un botón de play, no un disco relleno. */
function ringDist(cx: number, cy: number, rOuter: number, grosor: number): DistFn {
  return (x, y) => {
    const d = Math.hypot(x - cx, y - cy)
    return Math.min(rOuter - d, d - (rOuter - grosor))
  }
}

const VIDEO_SHAPE: DistFn[] = [
  ringDist(50, 50, 44, 11),
  polyDist([
    [36, 26],
    [36, 74],
    [74, 50],
  ]),
]

function depthAt(fns: DistFn[], x: number, y: number): number {
  let depth = -Infinity
  for (const f of fns) {
    const d = f(x, y)
    if (d > depth) depth = d
  }
  return depth
}

/**
 * Rampa clásica de ASCII art (Paul Bourke, dominio público) — mezcla letras,
 * números y símbolos de teclado ordenados de "vacío" a "denso", igual que las
 * imágenes de referencia. Nada de cuadraditos aquí: es texto monoespaciado.
 */
const ASCII_RAMP =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

function buildAscii(seed: number, cols: number, rows: number) {
  const rand = mulberry32(seed)
  const lines: string[] = []
  for (let gy = 0; gy < rows; gy++) {
    let line = ''
    for (let gx = 0; gx < cols; gx++) {
      const x = ((gx + 0.5) / cols) * 100
      // Las celdas de texto son más altas que anchas — se corrige el muestreo
      // en Y para que la silueta no salga achatada.
      const y = ((gy + 0.5) / rows) * 100
      const depth = depthAt(VIDEO_SHAPE, x, y)
      if (depth <= 0) {
        line += ' '
        continue
      }
      const d = Math.min(1, depth / 6)
      // Borde que se deshace: por debajo de cierta densidad, cae por dados —
      // así el contorno se disgrega en vez de cortar en seco.
      if (d < 0.25 && rand() > (d / 0.25) * 0.75) {
        line += ' '
        continue
      }
      const jitter = (rand() - 0.5) * 0.22
      const idx = Math.max(0, Math.min(ASCII_RAMP.length - 1, Math.round((d + jitter) * (ASCII_RAMP.length - 1))))
      line += ASCII_RAMP[idx]
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export function AsciiIcon({
  shape,
  seed,
  cols = 72,
  rows = 40,
  className,
}: {
  shape: 'video'
  seed: number
  cols?: number
  rows?: number
  className?: string
}) {
  const art = buildAscii(seed, cols, rows)
  return (
    <pre
      aria-hidden
      className={className}
      style={{ fontFamily: 'var(--font-mono, monospace)', lineHeight: 1, margin: 0, whiteSpace: 'pre' }}
    >
      {art}
    </pre>
  )
}

/**
 * Halftone a partir de una foto real (rejilla de densidad precalculada en
 * photo-art-data.ts) — cuadraditos cuya silueta no sale de geometría a mano,
 * sale de la imagen de referencia de verdad: la luz y la sombra de la foto
 * son la densidad de puntos.
 */
export function PhotoDots({
  grid,
  seed,
  className,
}: {
  grid: number[][]
  seed: number
  className?: string
}) {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const rand = mulberry32(seed)
  const dots: { x: number; y: number; s: number }[] = []
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const d = grid[gy][gx]
      if (d <= 0) continue
      // Grano en el borde: a menos densidad, más probable que el punto no
      // salga — así el contorno se deshace en vez de cortar en seco.
      const p = Math.pow(d, 0.6)
      if (rand() > p && d < 0.6) continue
      const s = (0.3 + 0.62 * d) * (0.8 + rand() * 0.28)
      dots.push({ x: gx + (1 - s) / 2, y: gy + (1 - s) / 2, s })
    }
  }
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className={className} aria-hidden>
      {dots.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width={d.s} height={d.s} fill="currentColor" />
      ))}
    </svg>
  )
}
