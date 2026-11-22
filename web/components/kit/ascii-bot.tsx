'use client'

import { useEffect, useRef } from 'react'
import { SHAPES, EYES, type BotShape, type BotEyes } from './bot'

/**
 * ASCII Bot · StackD Kit
 * The Bot printed as a halftone: a ball of ink dots, shaded like a sphere lit
 * from the top left, with its two eyes left blank. The eyes follow the cursor
 * around the page and blink now and then.
 *
 * Move over it and the dots under your hand turn into characters, densest
 * right under the hand, thinning back to dots along the path behind it
 * (@ → # → + → ·) as the trail cools. Press and a wave of characters rolls out.
 *
 * One number per cell (the heat); the number picks a glyph off a ramp, lightest
 * to densest. Warm cells re-deal their glyph every few frames, so the trail
 * flickers like a terminal redraw; cold dots hold still.
 * Canvas, drawn only while something moves. React + Tailwind, no other dependencies.
 */

/** Ramps of glyphs, lightest to densest. The first is always a blank. */
export const GLYPHS = {
  classic: ' .:-=+*#%@',
  blocks: ' ·░▒▓█',
  code: ' .-=<>/{}#',
  binary: ' .:01',
} as const
export type AsciiGlyphs = keyof typeof GLYPHS

const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
const COLD = 0.04 // below this a cell is a plain dot
const WAVE_S = 1.8 // how long a press's wave lives, s
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

type Props = {
  /** The body, any of the Bot's nine. */
  shape?: BotShape
  /** The eyes, any of the Bot's four. */
  eyes?: BotEyes
  /** The ramp the trail is drawn with. */
  glyphs?: AsciiGlyphs
  /** Box size, px. */
  width?: number
  height?: number
  /** Character size, px. */
  size?: number
  /** How wide the trail is, 0 to 100. */
  reach?: number
  /** Seconds for the trail to cool. */
  trail?: number
  /** Ink colour. Defaults to the CSS `color` it sits in. */
  ink?: string
  className?: string
}

export function AsciiBot({
  shape = 'hexagon',
  eyes = 'tall',
  glyphs = 'binary',
  width = 360,
  height = 260,
  size = 9,
  reach = 45,
  trail = 1.1,
  ink,
  className = '',
}: Props) {
  const cv = useRef<HTMLCanvasElement>(null)
  const knobs = useRef({ glyphs, reach, trail, ink, eyes })
  knobs.current = { glyphs, reach, trail, ink, eyes }

  const st = useRef({
    W: width, H: height,
    cols: 0, rows: 0, cw: 0, ch: 0, ox: 0, oy: 0,
    px: new Float32Array(0), py: new Float32Array(0), // cell centres, px
    ux: new Float32Array(0), uy: new Float32Array(0), // the same, in the Bot's 100-unit box
    mask: new Float32Array(0), // dot size inside the body, 0 outside
    heat: new Float32Array(0),
    face: { cx: 50, cy: 50, rx: 50, ry: 50 },
    hx: -999, hy: -999, lx: NaN, ly: NaN, near: 0, inside: false,
    look: { x: 0, y: 0, tx: 0, ty: 0 },
    blink: -1, // seconds into a blink, -1 when not blinking
    waves: [] as { x: number; y: number; t: number }[],
    deal: 0, tick: 0, raf: 0, ratio: 1, font: '', still: false,
  })

  const inkColour = () => knobs.current.ink ?? (cv.current ? getComputedStyle(cv.current).color : '#141310')

  // The grid, cut to the body and shaded as a sphere
  const build = () => {
    const s = st.current
    const c = cv.current
    if (!c) return
    s.W = width; s.H = height
    const r = Math.min(2, window.devicePixelRatio || 1)
    s.ratio = r
    c.width = Math.round(width * r)
    c.height = Math.round(height * r)
    s.ch = size * 0.82
    s.cw = size * 0.62
    s.cols = Math.floor(width / s.cw - 0.5)
    s.rows = Math.floor(height / s.ch)
    s.ox = (width - s.cols * s.cw) / 2
    s.oy = (height - s.rows * s.ch) / 2
    s.font = `500 ${size}px ${MONO}`
    const n = s.cols * s.rows
    s.px = new Float32Array(n); s.py = new Float32Array(n)
    s.ux = new Float32Array(n); s.uy = new Float32Array(n)
    s.mask = new Float32Array(n); s.heat = new Float32Array(n)

    // Light ink means a dark page: then the lit side is the dense one
    const rgb = inkColour().match(/[\d.]+/g)?.map(Number) ?? [20, 19, 16]
    const dark = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 128

    const body = SHAPES[shape]
    s.face = { cx: body.cx, cy: body.cy, rx: body.rx, ry: body.ry }
    const path = new Path2D(body.d)
    const probe = document.createElement('canvas').getContext('2d')!
    const box = Math.min(width, height) * 0.84
    const k = box / 100, bx = (width - box) / 2, by = (height - box) / 2
    const L = [-0.38, -0.56, 0.74] // light from the top left, toward you

    for (let j = 0; j < s.rows; j++) {
      for (let i = 0; i < s.cols; i++) {
        const q = j * s.cols + i
        // odd rows half a cell over: a halftone screen
        const x = s.ox + (i + 0.5 + (j & 1) * 0.5) * s.cw
        const y = s.oy + (j + 0.5) * s.ch
        const ux = (x - bx) / k, uy = (y - by) / k
        s.px[q] = x; s.py[q] = y; s.ux[q] = ux; s.uy[q] = uy
        if (!probe.isPointInPath(path, ux, uy)) continue
        const nx = (ux - body.cx) / body.rx, ny = (uy - body.cy) / body.ry
        const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
        const lit = 0.2 + 0.8 * Math.max(0, L[0] * nx + L[1] * ny + L[2] * z)
        // never lighter than a third of a dot, so the highlight still reads as body
        s.mask[q] = 0.32 + 0.68 * clamp(dark ? lit : 1.08 - lit, 0, 1)
      }
    }
  }

  const radius = () => 10 + (clamp(knobs.current.reach, 0, 100) / 100) * 56

  // Heat dropped in a soft round at a point
  const stamp = (x: number, y: number, rad: number, amt: number) => {
    const s = st.current
    const c0 = Math.max(0, Math.floor((x - s.ox - rad) / s.cw) - 1)
    const c1 = Math.min(s.cols - 1, Math.ceil((x - s.ox + rad) / s.cw))
    const r0 = Math.max(0, Math.floor((y - s.oy - rad) / s.ch))
    const r1 = Math.min(s.rows - 1, Math.ceil((y - s.oy + rad) / s.ch))
    const R2 = rad * rad
    for (let j = r0; j <= r1; j++) for (let i = c0; i <= c1; i++) {
      const q = j * s.cols + i
      const d = ((s.px[q] - x) ** 2 + (s.py[q] - y) ** 2) / R2
      if (d >= 1) continue
      const t = 1 - d
      s.heat[q] = Math.min(1, s.heat[q] + amt * t * t)
    }
  }

  // Is a point (in the 100-unit box) inside one of the eyes?
  const eyeTest = () => {
    const s = st.current
    const e = EYES[knobs.current.eyes]
    const f = s.face
    const gap = Math.min(19, f.rx * 0.38)
    const lx = s.look.x * f.rx * 0.32, ly = s.look.y * f.ry * 0.3
    // a blink closes the lids and opens them again in 0.18 s
    const b = s.blink < 0 ? 0 : Math.sin(Math.PI * clamp(s.blink / 0.18, 0, 1))
    const hh = Math.max(0.9, (e.h / 2) * (1 - 0.92 * b))
    const list = [-1, 1].map((side) => {
      // the eye on the side it looks toward narrows, as if on a sphere
      const hw = (e.w / 2) * (1 - 0.3 * Math.max(0, side * s.look.x))
      return { x: f.cx + side * gap + lx, y: f.cy + ly, hw, hh, r: Math.min(e.r, hw, hh) }
    })
    return (ux: number, uy: number) => {
      for (const o of list) {
        const dx = Math.max(Math.abs(ux - o.x) - (o.hw - o.r), 0)
        const dy = Math.max(Math.abs(uy - o.y) - (o.hh - o.r), 0)
        if (dx * dx + dy * dy <= o.r * o.r) return true
      }
      return false
    }
  }

  const paint = () => {
    const s = st.current
    const c = cv.current
    if (!c || !s.cols) return
    const g = c.getContext('2d')!
    g.setTransform(s.ratio, 0, 0, s.ratio, 0, 0)
    g.clearRect(0, 0, s.W, s.H)
    g.fillStyle = inkColour()
    g.font = s.font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const ramp = Array.from(GLYPHS[knobs.current.glyphs] ?? GLYPHS.classic)
    const top = ramp.length - 1
    const dot = Math.min(s.cw, s.ch) * 0.46
    const rad = radius(), R2 = rad * rad
    const inEye = eyeTest()
    const waves = s.waves.map((w) => {
      const p = w.t / WAVE_S
      return { x: w.x, y: w.y, R: 6 + (1 - (1 - p) ** 3) * Math.hypot(s.W, s.H) * 0.7, amp: 0.65 * (1 - p) ** 2 * Math.min(1, p * 8) }
    })

    for (let q = 0; q < s.mask.length; q++) {
      const m = s.mask[q]
      if (m <= 0 || inEye(s.ux[q], s.uy[q])) continue
      const x = s.px[q], y = s.py[q]
      let h = s.heat[q]
      // the hand's own patch is worked out fresh, so a resting hand keeps it
      if (s.near > 0.002) {
        const d = ((x - s.hx) ** 2 + (y - s.hy) ** 2) / R2
        if (d < 1) h = Math.max(h, 0.95 * s.near * (1 - d) * (1 - d))
      }
      for (const w of waves) {
        const d = (Math.hypot(x - w.x, y - w.y) - w.R) / 22
        if (d > -2.5 && d < 2.5) h += w.amp * Math.exp(-d * d)
      }
      h *= 0.6 + 0.4 * m
      if (h <= COLD) {
        g.beginPath(); g.arc(x, y, Math.max(0.45, dot * Math.sqrt(m)), 0, Math.PI * 2); g.fill()
        continue
      }
      // warm cells shimmer between neighbouring glyphs
      let u = Math.min(1, h) * top + 0.5
      if (!s.still) u += (hash(q, s.deal) - 0.5) * 1.5 * Math.min(1, h * 2)
      const idx = clamp(Math.floor(u), 1, top)
      if (idx === 1 && ramp[1] === '.') {
        g.beginPath(); g.arc(x, y, Math.max(0.45, dot * Math.sqrt(m)), 0, Math.PI * 2); g.fill()
      } else g.fillText(ramp[idx], x, y)
    }
  }

  // The loop runs only while something is moving
  const run = () => {
    const s = st.current
    if (s.raf) return
    let prev = performance.now()
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000)
      prev = t
      const keep = Math.exp((-dt * 3) / Math.max(0.1, knobs.current.trail))
      let warm = 0
      for (let q = 0; q < s.heat.length; q++) {
        const h = s.heat[q] * keep
        s.heat[q] = h < 0.003 ? 0 : h
        if (h > warm) warm = h
      }
      s.waves = s.waves.filter((w) => (w.t += dt) < WAVE_S)
      s.near += ((s.inside ? 1 : 0) - s.near) * (1 - Math.pow(0.004, dt))
      const ease = 1 - Math.pow(0.0005, dt)
      s.look.x += (s.look.tx - s.look.x) * ease
      s.look.y += (s.look.ty - s.look.y) * ease
      if (s.blink >= 0 && (s.blink += dt) > 0.18) s.blink = -1
      if ((s.tick += dt) > 0.07) { s.tick = 0; s.deal++ }
      paint()
      const idle = warm === 0 && !s.waves.length && s.blink < 0
        && Math.abs((s.inside ? 1 : 0) - s.near) < 0.004
        && Math.abs(s.look.tx - s.look.x) < 0.002 && Math.abs(s.look.ty - s.look.y) < 0.002
      s.raf = idle ? 0 : requestAnimationFrame(step)
    }
    s.raf = requestAnimationFrame(step)
  }

  useEffect(() => {
    st.current.still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    build(); paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, width, height, size, ink])
  useEffect(() => { paint() }, [glyphs, eyes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = st.current
    // the eyes follow the cursor anywhere on the page
    const onMove = (e: PointerEvent) => {
      const c = cv.current
      if (!c) return
      const r = c.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const reachPx = Math.max(r.width, 1) * 0.9
      const f = Math.min(1, d / reachPx)
      s.look.tx = (dx / d) * f
      s.look.ty = (dy / d) * f
      run()
    }
    // a blink every few seconds
    let timer = 0
    const blink = () => {
      timer = window.setTimeout(() => { if (!s.still) { s.blink = 0; run() } blink() }, 2600 + Math.random() * 3200)
    }
    blink()
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      clearTimeout(timer)
      cancelAnimationFrame(s.raf); s.raf = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The pointer in the box's own units, so a scaled-down tile still lines up
  const where = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    const k = r.width / st.current.W || 1
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }
  }

  // The hand stamps along the whole line since the last event, so a flick is one stroke
  const move = (e: React.PointerEvent) => {
    const s = st.current
    const { x, y } = where(e)
    const rad = radius()
    if (Number.isNaN(s.lx)) { s.lx = x; s.ly = y }
    const n = Math.max(1, Math.ceil(Math.hypot(x - s.lx, y - s.ly) / (rad / 3)))
    for (let i = 1; i <= n; i++) {
      const f = i / n
      stamp(s.lx + (x - s.lx) * f, s.ly + (y - s.ly) * f, rad, 0.5)
    }
    s.lx = x; s.ly = y; s.hx = x; s.hy = y
    s.inside = true
    run()
  }

  return (
    <div
      className={`relative touch-none select-none ${className}`}
      style={{ width, height }}
      onPointerEnter={(e) => { st.current.lx = NaN; move(e) }}
      onPointerMove={move}
      onPointerLeave={() => { const s = st.current; s.inside = false; s.lx = NaN; run() }}
      onPointerDown={(e) => {
        const s = st.current
        const { x, y } = where(e)
        s.waves.push({ x, y, t: 0 })
        s.blink = 0
        run()
      }}
      role="img"
      aria-label="The Bot drawn in ink dots; moving over it leaves a trail of characters"
    >
      <canvas ref={cv} className="block" style={{ width, height }} aria-hidden="true" />
    </div>
  )
}

/* A stable 0..1 per cell per deal: noise that holds for a few frames */
function hash(k: number, n: number) {
  let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(n + 0x632be5ab, 0xc2b2ae35)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return (h >>> 0) / 4294967296
}
