'use client'

import { useEffect, useRef } from 'react'
import { SHAPES } from './bot'

/**
 * Iron filings · StackD Kit
 * Thousands of tiny ink needles on paper. At rest they lie along the outline of a word (or the Bot's face),
 * the way iron filings trace the lines around a magnet. Your cursor is a magnet: the needles near it swing
 * round and line up along its field, from one pole to the other, growing a little as they're magnetised.
 * Move away and they ease back into the shape. Click and they jump, then settle back.
 * Finished like a figure in print: labels in the corners, a live readout of the field, the magnet drawn as a bar.
 *
 * One canvas, drawn only while something moves and only on screen.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

type Props = {
  /** What the filings trace at rest. */
  shape?: 'word' | 'bot'
  /** The word, when shape is 'word'. Short words work best. */
  text?: string
  /** Space between needles, px. Smaller is denser (and heavier). */
  spacing?: number
  /** How far the magnet reaches, 0 to 100. */
  reach?: number
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Hold the magnet here (0 to 1 across and down), for covers and mock-ups. */
  magnet?: { x: number; y: number }
  /** The editorial finish: corner labels, a live readout and the magnet drawn as a little bar magnet. */
  labels?: boolean
  /** The figure's caption, bottom left. */
  caption?: string
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const THEMES = { light: { paper: '#F2F0EC', ink: '#141310' }, dark: { paper: '#141310', ink: '#F2F0EC' } }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
// the shortest turn between two needle angles; a needle has no head, so it's the same every half turn
const turn = (from: number, to: number) => { let d = (to - from) % Math.PI; if (d > Math.PI / 2) d -= Math.PI; if (d < -Math.PI / 2) d += Math.PI; return d }

type Needle = { x: number; y: number; a: number; va: number; rest: number; hold: number; len: number; restLen: number; dx: number; dy: number; vx: number; vy: number }

export function IronFilings({ shape = 'word', text = 'HELLO', spacing = 8, reach = 50, theme = 'light', width = 560, height = 360, magnet, labels = true, caption = 'Iron filings on paper', className = '' }: Props) {
  const c = THEMES[theme]
  const cv = useRef<HTMLCanvasElement>(null)
  const readout = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    const g = canvas.getContext('2d')!

    // ── the shape, as a soft field: draw it, sample it on the needle grid, blur it ──
    const cols = Math.floor(width / spacing), rows = Math.floor(height / spacing)
    const ox = (width - (cols - 1) * spacing) / 2, oy = (height - (rows - 1) * spacing) / 2
    const m = document.createElement('canvas'); m.width = width; m.height = height
    const mg = m.getContext('2d', { willReadFrequently: true })!
    mg.fillStyle = '#000'
    if (shape === 'bot') {
      const s = Math.min(width, height) * 0.86, k = s / 100
      mg.save(); mg.translate(width / 2 - s / 2, height / 2 - s / 2); mg.scale(k, k)
      mg.fill(new Path2D(SHAPES.hexagon.d))
      // the eyes, cut out
      mg.globalCompositeOperation = 'destination-out'
      for (const ex of [37, 63]) { mg.beginPath(); mg.roundRect(ex - 5.5, 39.5, 11, 21, 5.5); mg.fill() }
      mg.restore()
    } else {
      let size = height * 0.62
      mg.font = `800 ${size}px ${FONT}`
      const tw = mg.measureText(text).width
      if (tw > width * 0.88) { size *= (width * 0.88) / tw; mg.font = `800 ${size}px ${FONT}` }
      mg.textAlign = 'center'; mg.textBaseline = 'middle'
      mg.fillText(text, width / 2, height / 2 + size * 0.04)
    }
    const px = mg.getImageData(0, 0, width, height).data
    let f = new Float32Array(cols * rows)
    const inside = new Float32Array(cols * rows) // the shape itself, sharp
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = Math.round(ox + i * spacing), y = Math.round(oy + j * spacing)
      f[j * cols + i] = inside[j * cols + i] = px[(y * width + x) * 4 + 3] / 255
    }
    // a few box blurs: the field spreads past the edges, so the needles outside follow it too
    for (let pass = 0; pass < 2; pass++) {
      const n = new Float32Array(cols * rows)
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let sum = 0, cnt = 0
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const a = i + di, b = j + dj
          if (a >= 0 && a < cols && b >= 0 && b < rows) { sum += f[b * cols + a]; cnt++ }
        }
        n[j * cols + i] = sum / cnt
      }
      f = n
    }
    const at = (i: number, j: number) => f[clamp(j, 0, rows - 1) * cols + clamp(i, 0, cols - 1)]

    // ── the needles: each lies along the field's contour (across its slope), or drifts where there's none ──
    const needles: Needle[] = []
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const gx = at(i + 1, j) - at(i - 1, j), gy = at(i, j + 1) - at(i, j - 1)
      const slope = Math.hypot(gx, gy)
      const v = at(i, j)
      const along = Math.atan2(gy, gx) + Math.PI / 2
      const loose = rnd() * Math.PI
      const hold = clamp(slope * 6, 0, 1) // how firmly the shape holds it
      const on0 = inside[j * cols + i]
      // deep inside the shape there's no edge to follow: those circle round the middle, like a ball
      const round = Math.atan2(oy + j * spacing - height / 2, ox + i * spacing - width / 2) + Math.PI / 2
      const rest = hold > 0.3 ? along : on0 > 0.5 ? round : hold > 0.05 ? along : loose
      const on = inside[j * cols + i]
      // on the shape: long and dark, so the word reads; around it: short and faint
      const restLen = spacing * (on > 0.5 ? 0.92 : 0.3 + 0.35 * clamp(v * 1.4 + slope * 2, 0, 1))
      needles.push({
        x: ox + i * spacing + (rnd() - 0.5) * spacing * 0.3, y: oy + j * spacing + (rnd() - 0.5) * spacing * 0.3,
        a: rest, va: 0, rest, hold, len: restLen, restLen, dx: 0, dy: 0, vx: 0, vy: 0,
      })
    }

    // ── the magnet: a dipole, north up, that follows the pointer on a soft spring ──
    const mag = { x: -999, y: -999, tx: -999, ty: -999, on: 0, onT: 0 }
    if (magnet) { mag.x = mag.tx = magnet.x * width; mag.y = mag.ty = magnet.y * height; mag.on = mag.onT = 1 }
    const R = (40 + (clamp(reach, 0, 100) / 100) * 110) * (Math.min(width, height) / 440) // where its pull fades, in proportion to the size

    let raf = 0, seen = true, last = performance.now()
    const t0 = last
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const t = (now - t0) / 1000
      if (!magnet) {
        mag.x += (mag.tx - mag.x) * Math.min(1, dt * 14); mag.y += (mag.ty - mag.y) * Math.min(1, dt * 14)
        mag.on += (mag.onT - mag.on) * Math.min(1, dt * 6)
      }
      let moving = mag.on > 0.01 && mag.on < 0.99
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.fillStyle = c.paper
      g.fillRect(0, 0, width, height)
      g.strokeStyle = c.ink
      g.lineCap = 'round'
      for (const n of needles) {
        // the magnet's field here: B = 3(m·r̂)r̂ − m, with m pointing up
        let target = n.rest + (n.hold < 0.05 ? Math.sin(t * 0.6 + n.x * 0.05) * 0.15 : 0)
        let pull = 0
        if (mag.on > 0.01) {
          const rx = n.x - mag.x, ry = n.y - mag.y
          const d = Math.hypot(rx, ry) + 0.001
          const ux = rx / d, uy = ry / d
          const mdot = -uy // m = (0, -1)
          const bx = 3 * mdot * ux, by = 3 * mdot * uy + 1
          pull = clamp((R / Math.max(d, 18)) ** 3, 0, 1) * mag.on
          if (pull > 0.002) target = n.rest + turn(n.rest, Math.atan2(by, bx)) * clamp(pull * 1.4, 0, 1)
          // and they lean toward the magnet a little
          if (pull > 0.02) { n.vx -= ux * pull * 60 * dt; n.vy -= uy * pull * 60 * dt }
        }
        // the needle turns on a spring (the shorter way round) and settles
        if (still) { n.a = target; n.va = 0 }
        else {
          n.va += (turn(n.a, target) * 160 - n.va * 14) * dt
          n.a += n.va * dt
        }
        const lenT = n.restLen * (1 + pull * 0.9)
        n.len += (lenT - n.len) * Math.min(1, dt * 10)
        n.vx += (-n.dx * 90 - n.vx * 10) * dt; n.vy += (-n.dy * 90 - n.vy * 10) * dt
        n.dx += n.vx * dt; n.dy += n.vy * dt
        if (Math.abs(n.va) > 0.02 || Math.abs(n.vx) + Math.abs(n.vy) > 0.5) moving = true
        const cx = n.x + n.dx, cy = n.y + n.dy, hx = Math.cos(n.a) * n.len / 2, hy = Math.sin(n.a) * n.len / 2
        g.globalAlpha = 0.28 + 0.72 * clamp((n.len / spacing - 0.3) / 0.6, 0, 1)
        g.lineWidth = (labels ? 1 : 1.15) + pull * 0.5
        g.beginPath(); g.moveTo(cx - hx, cy - hy); g.lineTo(cx + hx, cy + hy); g.stroke()
      }
      g.globalAlpha = 1
      if (labels && mag.on > 0.02) {
        // the magnet, drawn like a diagram: a little bar, N up (ink), S down (outlined)
        g.save(); g.globalAlpha = mag.on; g.translate(mag.x, mag.y)
        const bw = 10, bh = 26
        g.fillStyle = c.paper; g.strokeStyle = c.ink; g.lineWidth = 1.2
        g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, 3); g.fill(); g.stroke()
        g.fillStyle = c.ink; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh / 2, [3, 3, 0, 0]); g.fill()
        g.font = `600 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillStyle = c.paper; g.fillText('N', 0, -bh / 4 + 0.5)
        g.fillStyle = c.ink; g.fillText('S', 0, bh / 4 + 0.5)
        g.restore()
      }
      if (readout.current) {
        readout.current.textContent = mag.on > 0.02
          ? `x ${(mag.x / width).toFixed(2)}  y ${(mag.y / height).toFixed(2)}  ·  B ${(mag.on * (1 + reach / 35)).toFixed(1)}`
          : 'No field'
      }
      // keep going while things move (or while the free needles drift, if the pointer is around)
      raf = seen && !still && (moving || mag.on > 0.01) ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }

    const point = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect(), k = width / box.width
      return { x: (e.clientX - box.left) * k, y: (e.clientY - box.top) * k }
    }
    const move = (e: PointerEvent) => {
      if (magnet) return
      const p = point(e)
      if (mag.on < 0.02) { mag.x = p.x; mag.y = p.y } // appear where the pointer comes in
      mag.tx = p.x; mag.ty = p.y; mag.onT = 1
      wake()
    }
    const leave = () => { if (magnet) return; mag.onT = 0; wake() }
    // a click: the filings jump away from it, then fall back into place
    const down = (e: PointerEvent) => {
      move(e)
      const p = point(e)
      for (const n of needles) {
        const rx = n.x - p.x, ry = n.y - p.y, d = Math.hypot(rx, ry) + 1
        const k = clamp(220 / d, 0, 6) * (0.6 + Math.random() * 0.8)
        n.vx += (rx / d) * k * 60; n.vy += (ry / d) * k * 60
        n.va += (Math.random() - 0.5) * 40 * clamp(120 / d, 0, 1)
      }
      wake()
    }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointerleave', leave)
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) wake() })
    io.observe(canvas)
    wake()
    return () => {
      cancelAnimationFrame(raf); raf = 0; io.disconnect()
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerleave', leave)
    }
  }, [shape, text, spacing, reach, theme, width, height, magnet?.x, magnet?.y, labels]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative ${className}`} style={{ width, height, fontFamily: FONT }}>
      <canvas
        ref={cv}
        role="img"
        aria-label={shape === 'bot' ? 'The StackD Bot drawn in iron filings' : `${text}, drawn in iron filings`}
        className={`block touch-none rounded-[22px] ${labels ? 'cursor-none' : ''}`}
        style={{ width, height, background: c.paper }}
      />
      {labels ? (
        // the editorial finish: a figure, labelled in its corners
        <div aria-hidden className="pointer-events-none absolute inset-0 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: c.ink }}>
          <span className="absolute left-5 top-4">Fig. 01</span>
          <span className="absolute right-5 top-4">{shape === 'bot' ? 'The Bot' : text}</span>
          {caption ? <span className="absolute bottom-4 left-5 opacity-60">{caption}</span> : null}
          <span ref={readout} className="absolute bottom-4 right-5 tabular-nums opacity-60">No field</span>
        </div>
      ) : null}
    </div>
  )
}
