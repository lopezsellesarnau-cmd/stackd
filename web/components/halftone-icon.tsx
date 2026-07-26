/**
 * Iconos en trama de puntos — mismo lenguaje que la rama del hero
 * (dot-tree.tsx), pero aquí la forma es un icono reconocible (casa, chat,
 * claqueta, llave) en vez de una planta orgánica: silueta con núcleo denso
 * y borde que se deshace en puntos sueltos, como un halftone.
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

function circleDist(cx: number, cy: number, r: number): DistFn {
  return (x, y) => r - Math.hypot(x - cx, y - cy)
}

export const HALFTONE_SHAPES = {
  house: [
    polyDist([
      [50, 10],
      [15, 48],
      [85, 48],
    ]),
    polyDist([
      [20, 48],
      [80, 48],
      [80, 88],
      [20, 88],
    ]),
  ],
  chat: [
    polyDist([
      [15, 15],
      [85, 15],
      [85, 65],
      [15, 65],
    ]),
    polyDist([
      [25, 65],
      [42, 65],
      [28, 85],
    ]),
  ],
  clapper: [
    polyDist([
      [15, 35],
      [85, 35],
      [85, 85],
      [15, 85],
    ]),
    polyDist([
      [12, 15],
      [88, 15],
      [82, 32],
      [18, 32],
    ]),
  ],
  key: [
    circleDist(35, 35, 18),
    polyDist([
      [31, 35],
      [41, 35],
      [41, 88],
      [31, 88],
    ]),
    polyDist([
      [41, 68],
      [53, 68],
      [53, 75],
      [41, 75],
    ]),
    polyDist([
      [41, 79],
      [50, 79],
      [50, 86],
      [41, 86],
    ]),
  ],
} satisfies Record<string, DistFn[]>

export type HalftoneShape = keyof typeof HALFTONE_SHAPES

function buildDots(shape: HalftoneShape, seed: number) {
  const fns = HALFTONE_SHAPES[shape]
  const rand = mulberry32(seed)
  const cell = 2.4
  const dots: { x: number; y: number; s: number }[] = []
  for (let gy = 0; gy < 100 / cell; gy++) {
    for (let gx = 0; gx < 100 / cell; gx++) {
      const x = gx * cell + cell / 2
      const y = gy * cell + cell / 2
      let depth = -Infinity
      for (const f of fns) {
        const d = f(x, y)
        if (d > depth) depth = d
      }
      if (depth <= 0) continue
      // Núcleo denso, borde que se deshace: la caída es lo que da el grano
      // (mismo criterio que cluster() en dot-tree.tsx).
      const d = Math.min(1, depth / 14)
      const p = Math.pow(d, 0.55)
      if (rand() > p) continue
      const s = cell * (0.3 + 0.55 * d) * (0.75 + rand() * 0.35)
      dots.push({ x: x - s / 2, y: y - s / 2, s })
    }
  }
  return dots
}

export function HalftoneIcon({
  shape,
  seed,
  className,
}: {
  shape: HalftoneShape
  seed: number
  className?: string
}) {
  const dots = buildDots(shape, seed)
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {dots.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width={d.s} height={d.s} fill="currentColor" />
      ))}
    </svg>
  )
}
