'use client'

/**
 * Decoración del hero — una rama con hojas y flores, dibujada ÚNICAMENTE con
 * cuadraditos negros alineados a rejilla.
 *
 * Tres cosas la separan de "un sendero de líneas", que es como se leía la
 * versión anterior:
 *  1. JERARQUÍA DE GROSOR — el tallo se rasteriza con varias celdas de ancho y
 *     se va afinando hacia las puntas (taper). Trazos todos iguales = mapa de
 *     carreteras, no planta.
 *  2. RACIMOS DE DENSIDAD VARIABLE — hojas y flores son manchas con caída
 *     radial y borde disgregado (dithered): núcleo denso que se deshace hacia
 *     fuera. Son los focos que le faltaban.
 *  3. ARCO EN VEZ DE PASEO ALEATORIO — la curvatura es un sesgo constante, no
 *     ruido acumulado, así las ramas no acaban paralelas.
 *
 * Entra por la esquina superior derecha y barre hacia el titular abriéndose
 * hacia arriba y a los lados.
 *
 * La planta se genera a tamaño FIJO (misma en cualquier pantalla) y solo se
 * reduce si el lienzo es menor; el cuadrado nunca supera 0.62 de la celda para
 * que los puntos no se fundan en trazos continuos.
 */

import { useEffect, useRef } from 'react'

/** PRNG con semilla — misma planta en cada carga. */
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

const CELL = 7 // paso de la rejilla
const DOT = 4.2 // lado del cuadradito

/**
 * Semilla elegida por barrido, no a ojo: cada parámetro reordena el PRNG y sale
 * una planta distinta, así que se generaron cientos de semillas con estos
 * mismos parámetros y se filtraron por proporción apaisada y densidad.
 */
const SEED = 315

/**
 * Variante de móvil: planta más corta (len 230) con su propia semilla, elegida
 * con el mismo barrido sobre un lienzo de 343×300 — sale 322×273, o sea que se
 * dibuja a escala 1 y los cuadraditos conservan sus 4,2px. Escalar la grande
 * los dejaba en 1,7px y por eso no se veía nada.
 */
const SEED_BAND = 378
const LEN_BAND = 230

/**
 * Genera el conjunto de celdas de la planta. Compartido con el barrido.
 * `len` y `depth` se parametrizan para la variante de móvil: escalar la planta
 * grande a 343px la dejaba en cuadraditos de 1.7px — invisibles. Mejor una
 * planta más corta dibujada casi a tamaño real. Ojo: cambiar `len` cambia el
 * número de segmentos y por tanto reordena el PRNG → sale OTRA planta, así que
 * cada combinación necesita su propia semilla elegida por barrido.
 */
function buildPlant(seed: number, len = 430, depth = 5) {
  const rand = mulberry32(seed)
  // Map en vez de Set: guardamos por celda su distancia a la base, que luego
  // pondera cuánto se mece. Sin esto habría que regenerar la planta en cada
  // fotograma — caro y con parpadeo caótico.
  const cells = new Map<string, number>()
  const add = (cx: number, cy: number) => {
    const k = `${cx},${cy}`
    const d = Math.hypot(cx * CELL, cy * CELL)
    const prev = cells.get(k)
    if (prev === undefined || d > prev) cells.set(k, d)
  }

  /** Traza un segmento con grosor en celdas (desplazamiento perpendicular). */
  function stroke(x1: number, y1: number, x2: number, y2: number, w: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1)
    if (dist < 0.001) return
    const steps = Math.max(2, Math.round(dist / (CELL * 0.7)))
    const px = -(y2 - y1) / dist // perpendicular unitaria
    const py = (x2 - x1) / dist
    const half = (w - 1) / 2
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const bx = x1 + (x2 - x1) * t
      const by = y1 + (y2 - y1) * t
      for (let k = -half; k <= half; k += 1) {
        add(Math.round((bx + px * k * CELL) / CELL), Math.round((by + py * k * CELL) / CELL))
      }
    }
  }

  /** Hoja/flor: mancha con caída radial y borde disgregado. */
  function cluster(x: number, y: number, radius: number, density: number) {
    const c0 = Math.round(x / CELL)
    const r0 = Math.round(y / CELL)
    const rc = Math.ceil(radius / CELL)
    for (let i = -rc; i <= rc; i++) {
      for (let j = -rc; j <= rc; j++) {
        const d = Math.hypot(i * CELL, j * CELL) / radius
        if (d > 1) continue
        // Núcleo denso, borde que se deshace: la caída es lo que da el grano.
        const p = Math.pow(1 - d, 1.5) * density
        if (rand() < p) add(c0 + i, r0 + j)
      }
    }
  }

  function grow(x: number, y: number, angle: number, len: number, depth: number, width: number) {
    if (depth <= 0 || len < CELL * 1.5) return
    const segs = Math.max(3, Math.round(len / (CELL * 2.6)))
    const segLen = len / segs
    let cx = x
    let cy = y
    let a = angle
    // Sesgo constante = arco. El ruido es pequeño, solo para que no sea perfecto.
    const curve = (rand() - 0.5) * 0.05 - 0.03

    for (let i = 0; i < segs; i++) {
      a += curve + (rand() - 0.5) * 0.1
      const nx = cx + Math.cos(a) * segLen
      const ny = cy + Math.sin(a) * segLen
      // Afina a lo largo del propio tramo.
      const w = Math.max(1, Math.round(width * (1 - (i / segs) * 0.4)))
      stroke(cx, cy, nx, ny, w)
      cx = nx
      cy = ny

      if (depth > 1 && i > 0 && rand() < 0.32) {
        const lado = rand() < 0.5 ? -1 : 1
        grow(
          cx,
          cy,
          a + lado * (0.35 + rand() * 0.5),
          len * (0.34 + rand() * 0.34),
          depth - 1,
          Math.max(1, width - 1),
        )
      }
    }

    // Puntas: hojas abundantes, alguna flor más grande y densa.
    if (depth <= 2) {
      if (rand() < 0.26) cluster(cx, cy, CELL * (3.4 + rand() * 1.5), 0.95)
      else cluster(cx, cy, CELL * (1.9 + rand() * 1.0), 0.85)
    }
  }

  // Entra desde la esquina superior derecha barriendo hacia el titular (≈163°).
  grow(0, 0, 2.85, len, depth, 3)
  return cells
}

function bounds(cells: Map<string, number>) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  cells.forEach((_v, key) => {
    const i = key.indexOf(',')
    const cx = +key.slice(0, i)
    const cy = +key.slice(i + 1)
    if (cx < minX) minX = cx
    if (cx > maxX) maxX = cx
    if (cy < minY) minY = cy
    if (cy > maxY) maxY = cy
  })
  return { minX, maxX, minY, maxY, w: (maxX - minX + 1) * CELL, h: (maxY - minY + 1) * CELL }
}

/**
 * `hero`  — entra por la esquina superior derecha, solo en desktop.
 * `band`  — franja centrada a todo el ancho, para móvil: superpuesta al texto
 *           en 375px la copia sería ilegible, así que ahí va debajo y sola.
 */
export function DotTree({ variant = 'hero' }: { variant?: 'hero' | 'band' }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const cells = variant === 'band' ? buildPlant(SEED_BAND, LEN_BAND) : buildPlant(SEED)
    const b = bounds(cells)

    // Aplanamos el Map a un array una sola vez: en cada fotograma solo se
    // recorre y se dibuja, sin volver a generar nada.
    const maxDist = Math.max(...Array.from(cells.values()))
    const puntos = Array.from(cells.entries()).map(([key, dist]) => {
      const i = key.indexOf(',')
      // Peso del meceo: el tallo (cerca de la base) casi no se mueve, las
      // puntas sí. Exponente >1 para que la diferencia se note.
      // Exponente 1.3 y no más: con 1.8 el 38 % de las celdas se quedaban
      // completamente quietas y la planta parecía parpadear en las puntas en
      // vez de mecerse entera. Medido, no elegido a ojo.
      const w = Math.pow(dist / maxDist, 1.3)
      return { cx: +key.slice(0, i), cy: +key.slice(i + 1), w }
    })

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function draw(tiempo = 0) {
      const rect = canvas!.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      if (W < 10 || H < 10) return

      canvas!.width = Math.round(W * dpr)
      canvas!.height = Math.round(H * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)

      // Solo se reduce si no cabe; nunca se amplía.
      const pad = 8
      const scale = Math.min(1, (W - pad * 2) / b.w, (H - pad * 2) / b.h)
      const cs = CELL * scale
      const ds = Math.min(DOT * scale, cs * 0.62)
      const off = (cs - ds) / 2

      // Hero: anclada arriba a la derecha, entra en cuadro por esa esquina.
      // Band: centrada, que es lo único que funciona a todo el ancho.
      const offX =
        variant === 'band' ? (W - b.w * scale) / 2 - b.minX * cs : W - pad - b.maxX * cs
      const offY =
        variant === 'band' ? (H - b.h * scale) / 2 - b.minY * cs : pad - b.minY * cs

      // Brisa: dos ondas lentas de periodo distinto para que no se note el
      // bucle, con desfase según la altura → la ondulación recorre la planta.
      const t1 = tiempo * 0.00035
      const t2 = tiempo * 0.00022
      const amp = 7 * scale

      ctx!.fillStyle = '#111111'
      for (const p of puntos) {
        let x = p.cx * cs + offX + off
        let y = p.cy * cs + offY + off

        if (!sinMovimiento) {
          const fase = p.cy * 0.09 + p.cx * 0.03
          const vaiven = Math.sin(t1 + fase) * 0.75 + Math.sin(t2 + fase * 1.7) * 0.25
          // Redondeo a píxel entero: en fracciones, el canvas suaviza los
          // cuadraditos y se pierde el grano, que es justo lo que da carácter.
          x += Math.round(vaiven * amp * p.w)
          y += Math.round(Math.sin(t2 * 1.3 + fase) * amp * 0.28 * p.w)
        }

        if (x < -cs || x > W + cs || y < -cs || y > H + cs) continue
        ctx!.fillRect(x, y, ds, ds)
      }
    }

    // ResizeObserver: si el canvas monta antes de tener medidas, draw() aborta
    // y sin esto se quedaría en blanco hasta un resize manual.
    let t: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(() => draw(performance.now()), 100)
    })
    ro.observe(canvas)

    let raf = 0
    if (sinMovimiento) {
      draw()
    } else {
      const bucle = (ts: number) => {
        draw(ts)
        raf = requestAnimationFrame(bucle)
      }
      raf = requestAnimationFrame(bucle)
    }

    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [variant])

  if (variant === 'band') {
    return (
      <canvas
        ref={ref}
        aria-hidden
        // 300px no es arbitrario: la planta mide ~487×418, así que por debajo
        // de esa altura el ajuste lo manda el alto y los cuadraditos quedan a
        // ~2px, casi invisibles en un móvil.
        className="pointer-events-none block h-[300px] w-full md:hidden"
      />
    )
  }

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 top-[96px] hidden w-[52%] md:block"
      // Las ramas que llegan al titular se disuelven en vez de cruzarlo.
      style={{
        maskImage: 'linear-gradient(to right, transparent 2%, #000 32%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 2%, #000 32%)',
      }}
    />
  )
}
