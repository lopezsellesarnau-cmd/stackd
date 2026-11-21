'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Heat word · StackD Kit 24
 * A word (or the Bot, or a field of dots) in solid ink with soft, liquid edges. Bring the cursor
 * and heat pools under it: the strokes nearby swell and run into each other, and the shape shows its
 * heat, a glowing rim through the palette to an ink core. Leave and it cools back to ink. The Bot
 * watches the cursor and blinks when you go. Press it for the next shape.
 *
 * How: the shape is drawn once, blurred (three box blurs, close to a gaussian), into a field of how deep
 * each pixel sits inside a stroke. Every frame the cursor adds a round of heat to that field; a pixel
 * shows where the field passes a line, coloured by how far past it is. Strokes close together add up,
 * so they fuse where the heat is. One canvas, no libraries. Respects reduced motion.
 */

export type HeatShape = 'word' | 'bot' | 'dots'
type RGB = [number, number, number]

/** Palettes from the rim (0) to just before the core. The core is always the ink (or white on dark). */
export const HEAT_PALETTES: Record<string, RGB[]> = {
  ember: [[255, 236, 190], [240, 196, 110], [190, 147, 68], [214, 86, 42], [144, 25, 25], [70, 12, 20]],
  moss: [[238, 244, 205], [196, 214, 130], [108, 133, 68], [58, 86, 46], [32, 48, 30]],
  lilac: [[246, 242, 255], [201, 184, 255], [140, 118, 240], [74, 62, 170], [36, 30, 90]],
}

type Props = {
  /** The word, for shape "word". Short words melt best. Default "INK". */
  text?: string
  /** The shape it starts on. Pressing steps to the next. Default "word". */
  shape?: HeatShape
  /** "ember" (Ochre to Wine), "moss" (Olive), "lilac", or your own list of RGB stops. */
  palette?: keyof typeof HEAT_PALETTES | RGB[]
  /** How much heat the cursor brings, 0 to 1. Default 0.6. */
  heat?: number
  /** "light": ink on white (default). "dark": white on ink. */
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Press to change shape. Default true. */
  cycle?: boolean
  /** Heat at a fixed point (0 to 1 across and down), with no cursor: for still images and empty states. */
  glow?: { x: number; y: number }
  /** Called when a press changes the shape. */
  onShapeChange?: (shape: HeatShape) => void
  className?: string
}

const SHAPES: HeatShape[] = ['word', 'bot', 'dots']
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
const calm = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** One box blur pass along lines: `len` long, `step` apart inside a line, `next` between lines */
function box(src: Float32Array, dst: Float32Array, lines: number, len: number, rad: number, next: number, step: number) {
  // Called as (w lines of h) or (h lines of w): a line starts at l * next, its pixels are `step` apart
  const k = 1 / (rad * 2 + 1)
  for (let l = 0; l < lines; l++) {
    const o = l * next
    let sum = src[o] * (rad + 1)
    for (let i = 1; i <= rad; i++) sum += src[o + Math.min(i, len - 1) * step]
    for (let i = 0; i < len; i++) {
      dst[o + i * step] = sum * k
      sum += src[o + Math.min(i + rad + 1, len - 1) * step] - src[o + Math.max(i - rad, 0) * step]
    }
  }
}

/** 256 colours: the palette stops, then the core */
function ramp(stops: RGB[], core: RGB) {
  const all = [...stops, core]
  const out = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const u = (i / 255) * (all.length - 1), k = Math.min(all.length - 2, Math.floor(u)), f = u - k
    for (let c = 0; c < 3; c++) out[i * 3 + c] = all[k][c] + (all[k + 1][c] - all[k][c]) * f
  }
  return out
}

export function HeatWord({
  text = 'INK',
  shape: start = 'word',
  palette = 'ember',
  heat = 0.6,
  theme = 'light',
  width = 320,
  height = 180,
  cycle = true,
  glow,
  onShapeChange,
  className = '',
}: Props) {
  const [shape, setShape] = useState<HeatShape>(start)
  useEffect(() => setShape(start), [start])
  const dark = theme === 'dark'
  const canvas = useRef<HTMLCanvasElement>(null)
  // Where a press started, to tell a tap (change shape) from painting with a finger
  const press = useRef<{ x: number; y: number; at: number; moved: boolean } | null>(null)
  const knobs = useRef({ palette, heat, dark })
  knobs.current = { palette, heat, dark }

  const s = useRef({
    x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, // the hand, eased, and where it is
    on: 0, want: 0, // how present the hand is
    blink: 0, // 0 open, 1 shut
    grow: 0, // the shape coming in
    raf: 0, last: 0,
    field: null as Float32Array | null, fw: 0, fh: 0,
    tmp: null as HTMLCanvasElement | null,
    run: () => {},
  })

  useEffect(() => {
    const st = s.current
    const c = canvas.current
    if (!c) return
    const r = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.round(width * r), h = Math.round(height * r)
    c.width = w; c.height = h
    st.fw = w; st.fh = h
    st.tmp = st.tmp ?? document.createElement('canvas')
    st.tmp.width = w; st.tmp.height = h
    const u0 = Math.min(width / 320, height / 180)
    // Blur radius of each pass, px. Letters get less, so the holes in e, a and o stay open
    const rad = Math.max(2, Math.round((shape === 'word' ? 4.5 : 7) * r * u0))
    const buf = new Float32Array(w * h)
    const out = c.getContext('2d')!
    const img = out.createImageData(w, h)
    let lut = new Uint8ClampedArray(0), lutKey = ''
    let live = true

    // The shape, white on black, into tmp; then blurred into the field
    const draw = () => {
      const g = st.tmp!.getContext('2d', { willReadFrequently: true })!
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff'
      const u = Math.min(w / 320, h / 180) // drawn for 320 × 180, scaled to the box
      if (shape === 'word') {
        let size = 130 * u
        const font = (px: number) => `800 ${px}px Inter, "SF Pro Display", system-ui, sans-serif`
        g.font = font(size)
        size = Math.min(size, (size * w * 0.84) / Math.max(1, g.measureText(text).width))
        g.font = font(size)
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText(text, w / 2, h / 2 + size * 0.05)
      } else if (shape === 'bot') {
        // The Bot: a pill body with its two tall eyes cut out, looking toward the hand
        const bw = 190 * u, bh = 132 * u, x0 = (w - bw) / 2, y0 = (h - bh) / 2
        g.beginPath(); g.roundRect(x0, y0, bw, bh, bh / 2); g.fill()
        g.globalCompositeOperation = 'destination-out'
        const lx = (st.x - 0.5) * 34 * u, ly = (st.y - 0.5) * 22 * u
        const ew = 34 * u, eh = 64 * u * (1 - 0.85 * st.blink)
        for (const side of [-1, 1]) {
          const cx = w / 2 + side * 36 * u + lx, cy = h / 2 + ly
          g.beginPath(); g.roundRect(cx - ew / 2, cy - eh / 2, ew, eh, Math.min(ew, eh) / 2); g.fill()
        }
        g.globalCompositeOperation = 'source-over'
      } else {
        // Dots on a loose grid, close enough that heat runs them together
        let seed = 11
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
        for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) {
          const x = w / 2 + (i - 3) * 40 * u + (rand() - 0.5) * 10 * u
          const y = h / 2 + (j - 1) * 42 * u + (rand() - 0.5) * 10 * u
          g.beginPath(); g.arc(x, y, (9 + rand() * 8) * u, 0, Math.PI * 2); g.fill()
        }
      }
      // Blur: a box blur across and down, three times over
      const d = g.getImageData(0, 0, w, h).data
      const f = st.field && st.field.length === w * h ? st.field : new Float32Array(w * h)
      for (let i = 0; i < w * h; i++) f[i] = d[i * 4] / 255
      for (let n = 0; n < 3; n++) { box(f, buf, w, h, rad, 1, w); box(buf, f, h, w, rad, w, 1) }
      st.field = f
    }

    const paint = () => {
      const { palette: p, heat: hot, dark: dk } = knobs.current
      const ink: RGB = dk ? [255, 255, 255] : [20, 19, 16]
      const key = (typeof p === 'string' ? p : JSON.stringify(p)) + dk
      if (key !== lutKey) { lut = ramp(typeof p === 'string' ? HEAT_PALETTES[p] ?? HEAT_PALETTES.ember : p, ink); lutKey = key }
      const f = st.field!, d = img.data
      const hx = st.x * w, hy = st.y * h
      const R = 70 * r * Math.min(w / r / 320, h / r / 180) * (0.8 + hot * 0.6)
      const R2 = R * R, on = st.on, amp = on * (0.25 + hot * 0.45), g = st.grow
      for (let y = 0, i = 0; y < h; y++) {
        const dy2 = (y - hy) * (y - hy)
        for (let x = 0; x < w; x++, i++) {
          let v = f[i] * g
          let m = 0
          if (on > 0.003) {
            const q = ((x - hx) * (x - hx) + dy2) / R2
            if (q < 2.2) {
              const e = Math.exp(-q * 1.6)
              v += amp * e * Math.min(1, v * 3 + 0.15) // heat pools where there's ink, a little beyond
              m = on * e
            }
          }
          // Where the field passes the line it's ink; heat lowers the line, so strokes swell
          const lo = 0.4 - 0.16 * m, a = smooth(lo, lo + 0.1, v)
          const o = i * 4
          if (a <= 0) { d[o + 3] = 0; continue }
          let R0 = ink[0], G0 = ink[1], B0 = ink[2]
          if (m > 0.01) {
            // The heat: rim colours where it's barely past the line, the core deep inside
            const t = Math.pow(clamp((v - lo) / 1.1, 0, 1), 1.3), li = Math.round(t * 255) * 3
            const k = smooth(0, 0.6, m)
            R0 += (lut[li] - R0) * k; G0 += (lut[li + 1] - G0) * k; B0 += (lut[li + 2] - B0) * k
          }
          d[o] = R0; d[o + 1] = G0; d[o + 2] = B0; d[o + 3] = a * 255
        }
      }
      out.putImageData(img, 0, 0)
    }

    // The loop runs only while something moves
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - st.last) / 1000 || 1 / 60)
      st.last = now
      const still = calm()
      const e = still ? 1 : 1 - Math.pow(0.0015, dt)
      st.x += (st.tx - st.x) * e; st.y += (st.ty - st.y) * e
      st.on += (st.want - st.on) * (still ? 1 : 1 - Math.pow(0.02, dt))
      st.grow = still ? 1 : Math.min(1, st.grow + dt / 0.7)
      if (st.blink > 0) st.blink = Math.max(0, st.blink - dt / 0.22)
      if (shape === 'bot') draw() // the eyes move
      paint()
      const moving = st.grow < 1 || st.blink > 0 || Math.abs(st.want - st.on) > 0.003 || Math.abs(st.tx - st.x) > 0.001 || Math.abs(st.ty - st.y) > 0.001
      if (!moving && st.want === 0) st.on = 0
      st.raf = moving ? requestAnimationFrame(frame) : 0
    }
    st.run = () => { if (!st.raf && live) { st.last = performance.now(); st.raf = requestAnimationFrame(frame) } }

    st.grow = 0
    if (glow) { st.tx = st.x = glow.x; st.ty = st.y = glow.y; st.want = 1 }
    const go = () => { if (!live) return; draw(); st.run() }
    // The word waits for its font, or the first frame draws the fallback
    if (shape === 'word' && document.fonts) document.fonts.load('800 100px Inter').then(go, go)
    else go()
    return () => { live = false; cancelAnimationFrame(st.raf); st.raf = 0 }
  }, [shape, text, width, height])

  // Palette, heat or theme changed: repaint once
  useEffect(() => { s.current.run() }, [palette, heat, theme])

  const aim = (e: React.PointerEvent) => {
    const b = e.currentTarget.getBoundingClientRect()
    s.current.tx = (e.clientX - b.left) / b.width
    s.current.ty = (e.clientY - b.top) / b.height
  }

  return (
    <div
      className={`relative select-none ${cycle ? 'cursor-pointer' : ''} ${className}`}
      // touch-action none: a finger painting on it stays on it, instead of scrolling the page
      style={{ width, height, touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
      onPointerEnter={(e) => { aim(e); const st = s.current; st.x = st.tx; st.y = st.ty; st.want = 1; st.run() }}
      onPointerMove={(e) => { const p = press.current; if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) p.moved = true; aim(e); s.current.want = 1; s.current.run() }}
      onPointerLeave={() => { const st = s.current; st.want = glow ? 1 : 0; if (glow) { st.tx = glow.x; st.ty = glow.y }; if (shape === 'bot' && !calm()) st.blink = 1; st.run() }}
      onPointerDown={(e) => { press.current = { x: e.clientX, y: e.clientY, at: performance.now(), moved: false } }}
      onPointerUp={(e) => { const p = press.current; if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) p.moved = true }}
      // Only a quick tap changes the shape: painting with a finger and lifting it doesn't
      onClick={cycle ? () => { const p = press.current; press.current = null; if (p && (p.moved || performance.now() - p.at > 350)) return; const n = SHAPES[(SHAPES.indexOf(shape) + 1) % SHAPES.length]; setShape(n); onShapeChange?.(n) } : undefined}
      role={cycle ? 'button' : 'img'}
      aria-label={shape === 'word' ? text : shape === 'bot' ? 'The StackD Bot' : 'Dots'}
    >
      <canvas ref={canvas} aria-hidden className="block" style={{ width, height }} />
    </div>
  )
}
