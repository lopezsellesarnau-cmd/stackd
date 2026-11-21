'use client'

import { useEffect, useRef } from 'react'

// Dot morph: one swarm of dots that holds a shape. The pointer stirs the dots
// like a finger in water, and they swirl back home. A tap spins a whirlpool, and
// the next shape spreads from the tap point: near dots leave first, far dots last.
// Dots shrink while they travel and grow back as they land.

export const MORPH_SHAPES = ['bot', 'heart', 'word', 'bolt', 'star'] as const
export type MorphShape = (typeof MORPH_SHAPES)[number]

const THEMES = {
  light: { bg: '#FFFFFF', ink: '#141310', ring: 'rgba(0,0,0,0.06)' },
  dark: { bg: '#0F0F0E', ink: '#F5F5F3', ring: 'rgba(255,255,255,0.08)' },
} as const

const DISPLAY = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const W = 480
const H = 400
const CX = W / 2
const CY = H / 2
const N = 760 // dots in every shape
const WAVE = 700 // px/s the new shape spreads from the tap

type Props = {
  shapes?: readonly MorphShape[]
  word?: string
  theme?: 'light' | 'dark'
  reach?: number
  force?: number
  grain?: number
  idle?: boolean
  onShapeChange?: (s: MorphShape) => void
  className?: string
}

// Draw a shape white on black, so its pixels can be sampled.
function paint(g: CanvasRenderingContext2D, s: MorphShape, word: string) {
  g.clearRect(0, 0, W, H)
  g.fillStyle = '#fff'
  const p = new Path2D()
  if (s === 'bot') {
    // the StackD Bot: squircle body, two tall eyes cut out
    const k = 2.9
    const ox = CX - 50 * k
    const oy = CY - 50 * k
    const body = new Path2D('M36 4h28c18 0 32 14 32 32v28c0 18-14 32-32 32H36C18 96 4 82 4 64V36C4 18 18 4 36 4Z')
    g.setTransform(k, 0, 0, k, ox, oy)
    g.fill(body)
    g.globalCompositeOperation = 'destination-out'
    g.beginPath()
    g.roundRect(30, 34, 12, 24, 6)
    g.roundRect(58, 34, 12, 24, 6)
    g.fill()
    g.globalCompositeOperation = 'source-over'
    g.setTransform(1, 0, 0, 1, 0, 0)
    return
  }
  if (s === 'word') {
    let size = 220
    g.font = `700 ${size}px ${DISPLAY}`
    const m = g.measureText(word).width
    if (m > 420) size = (size * 420) / m
    g.font = `700 ${size}px ${DISPLAY}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(word, CX, CY + size * 0.04)
    return
  }
  if (s === 'heart') {
    p.moveTo(CX, CY + 140)
    p.bezierCurveTo(CX - 230, CY - 10, CX - 120, CY - 185, CX, CY - 75)
    p.bezierCurveTo(CX + 120, CY - 185, CX + 230, CY - 10, CX, CY + 140)
  } else if (s === 'bolt') {
    const pts = [[40, -165], [-100, 25], [-12, 25], [-40, 165], [100, -30], [12, -30]]
    pts.forEach(([x, y], i) => (i ? p.lineTo(CX + x, CY + y) : p.moveTo(CX + x, CY + y)))
    p.closePath()
  } else {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 ? 72 : 168
      const x = CX + Math.cos(a) * r
      const y = CY + 10 + Math.sin(a) * r
      i ? p.lineTo(x, y) : p.moveTo(x, y)
    }
    p.closePath()
  }
  g.fill(p)
}

// N points on a hex grid that fills the shape evenly.
function sample(s: MorphShape, word: string): [number, number][] {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })!
  paint(g, s, word)
  const a = g.getImageData(0, 0, W, H).data
  const inside = (x: number, y: number) => a[((y | 0) * W + (x | 0)) * 4 + 3] > 128
  let area = 0
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (inside(x, y)) area += 4
  const sp = Math.sqrt((Math.max(area, 1) / N) * (2 / Math.sqrt(3)))
  const rowH = (sp * Math.sqrt(3)) / 2
  const pts: [number, number][] = []
  for (let y = rowH / 2, row = 0; y < H; y += rowH, row++)
    for (let x = sp / 2 + (row % 2) * (sp / 2); x < W; x += sp) if (inside(x, y)) pts.push([x, y])
  if (!pts.length) pts.push([CX, CY])
  const out: [number, number][] = []
  for (let i = 0; i < N; i++) out.push(pts[Math.floor((i * pts.length) / N)])
  return out
}

export function DotMorph({
  shapes = MORPH_SHAPES,
  word = 'Hi',
  theme = 'light',
  reach = 80,
  force = 60,
  grain = 1.9,
  idle = true,
  onShapeChange,
  className = '',
}: Props) {
  const cv = useRef<HTMLCanvasElement>(null)
  const opts = useRef({ shapes, word, theme, reach, force, grain, idle, onShapeChange })
  opts.current = { shapes, word, theme, reach, force, grain, idle, onShapeChange }
  const api = useRef<{ wake: () => void; reshape: () => void } | null>(null)

  useEffect(() => {
    const c = cv.current!
    const ctx = c.getContext('2d')!
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = W * dpr
    c.height = H * dpr

    // per dot: position, velocity, home, and the next home with the time it applies
    const x = new Float32Array(N)
    const y = new Float32Array(N)
    const vx = new Float32Array(N)
    const vy = new Float32Array(N)
    const hx = new Float32Array(N)
    const hy = new Float32Array(N)
    const nx = new Float32Array(N)
    const ny = new Float32Array(N)
    const at = new Float64Array(N).fill(Infinity)
    let idx = 0
    let hand: { x: number; y: number } | null = null
    let raf = 0
    let prev = 0
    let touched = performance.now()
    let seen = false
    let visible = false

    const current = () => opts.current.shapes[idx % opts.current.shapes.length] ?? 'bot'

    // Give every dot a new home. Pair by angle round the middle so the swarm sweeps.
    // `from` is the tap point: the new home reaches each dot when the wave gets there.
    const become = (s: MorphShape, from: { x: number; y: number } | null) => {
      const next = sample(s, opts.current.word)
      // pair by angle round the tap point, so the swarm turns about where you pressed
      const ox = from?.x ?? CX
      const oy = from?.y ?? CY
      const ang = (px: number, py: number) => Math.atan2(py - oy, px - ox)
      const a = Array.from({ length: N }, (_, i) => [ang(x[i], y[i]), i] as const).sort((p, q) => p[0] - q[0])
      const b = next.map((h, i) => [ang(h[0], h[1]), i] as const).sort((p, q) => p[0] - q[0])
      const now = performance.now()
      a.forEach(([, i], k) => {
        const h = next[b[k][1]]
        nx[i] = h[0]
        ny[i] = h[1]
        at[i] = from && !still ? now + (Math.hypot(x[i] - from.x, y[i] - from.y) / WAVE) * 1000 : 0
        if (still) {
          x[i] = hx[i] = h[0]
          y[i] = hy[i] = h[1]
        }
      })
      opts.current.onShapeChange?.(s)
    }

    const draw = () => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = THEMES[o.theme].ink
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        // a dot on the move is a small speck; it swells back to full size as it lands
        const sp = Math.hypot(vx[i], vy[i])
        const r = o.grain * (1 - Math.min(0.55, sp * 0.07))
        ctx.moveTo(x[i] + r, y[i])
        ctx.arc(x[i], y[i], r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    const tick = (t: number) => {
      const dt = prev ? Math.min((t - prev) / 16.67, 2.5) : 1
      prev = t
      const o = opts.current
      const R = Math.max(30, Math.min(160, o.reach))
      const S = (Math.max(0, Math.min(100, o.force)) / 100) * 11
      const damp = Math.pow(0.84, dt)
      let busy = !!hand
      for (let i = 0; i < N; i++) {
        if (t >= at[i]) {
          hx[i] = nx[i]
          hy[i] = ny[i]
          at[i] = Infinity
        } else if (at[i] !== Infinity) busy = true
        if (hand) {
          const dx = x[i] - hand.x
          const dy = y[i] - hand.y
          const d = Math.hypot(dx, dy)
          if (d < R && d > 0.01) {
            const f = (1 - d / R) ** 2 * S
            // mostly round the pointer, a little outward: a stir, not a push
            vx[i] += ((-dy / d) * 0.9 + (dx / d) * 0.3) * f * dt
            vy[i] += ((dx / d) * 0.9 + (dy / d) * 0.3) * f * dt
          }
        }
        // on a long trip home, a sideways pull bends the path into a curve
        const ex = hx[i] - x[i]
        const ey = hy[i] - y[i]
        if (ex * ex + ey * ey > 900) {
          vx[i] += -ey * 0.006 * dt
          vy[i] += ex * 0.006 * dt
        }
        vx[i] = (vx[i] + (hx[i] - x[i]) * 0.07 * dt) * damp
        vy[i] = (vy[i] + (hy[i] - y[i]) * 0.07 * dt) * damp
        x[i] += vx[i] * dt
        y[i] += vy[i] * dt
        if (Math.abs(hx[i] - x[i]) < 0.05 && Math.abs(hy[i] - y[i]) < 0.05 && Math.abs(vx[i]) < 0.02 && Math.abs(vy[i]) < 0.02) {
          x[i] = hx[i]
          y[i] = hy[i]
          vx[i] = vy[i] = 0
        } else busy = true
      }
      draw()
      raf = busy ? requestAnimationFrame(tick) : 0
      if (!raf) prev = 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // the whirlpool, then the next shape
    const burst = (p: { x: number; y: number }) => {
      touched = performance.now()
      if (!still) {
        const S = 0.4 + (Math.max(0, Math.min(100, opts.current.force)) / 100) * 1.2
        for (let i = 0; i < N; i++) {
          const dx = x[i] - p.x
          const dy = y[i] - p.y
          const d = Math.hypot(dx, dy)
          if (d > 220 || d < 0.01) continue
          const f = (1 - d / 220) * 22 * S
          vx[i] += ((-dy / d) + (dx / d) * 0.35) * f
          vy[i] += ((dx / d) + (dy / d) * 0.35) * f
        }
      }
      idx++
      become(current(), p)
      wake()
    }

    // start in the first shape, settled
    const first = sample(current(), opts.current.word)
    for (let i = 0; i < N; i++) {
      x[i] = hx[i] = nx[i] = first[i][0]
      y[i] = hy[i] = ny[i] = first[i][1]
    }
    draw()

    api.current = {
      wake,
      reshape: () => {
        become(current(), null)
        wake()
      },
    }

    const where = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    // A finger stirs like the mouse; only a quick tap that doesn't move changes the shape,
    // so on a phone you can drag through the dots without it turning into the next shape
    let press: { x: number; y: number; at: number; moved: boolean } | null = null
    const move = (e: PointerEvent) => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) press.moved = true
      if (still || (e.pointerType !== 'mouse' && !press)) return
      hand = where(e)
      touched = performance.now()
      wake()
    }
    const leave = () => {
      hand = null
      wake()
    }
    const down = (e: PointerEvent) => {
      press = { x: e.clientX, y: e.clientY, at: performance.now(), moved: false }
      if (e.pointerType !== 'mouse') c.setPointerCapture?.(e.pointerId)
    }
    const up = (e: PointerEvent) => {
      const p = press
      press = null
      if (p && !p.moved && performance.now() - p.at < 350) burst(where(e))
      if (e.pointerType !== 'mouse') leave()
    }
    const cancel = () => {
      press = null
      leave()
    }
    c.addEventListener('pointermove', move)
    c.addEventListener('pointerleave', leave)
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointerup', up)
    c.addEventListener('pointercancel', cancel)

    // first reveal: dots fly in from all over and gather into the shape
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (!visible || seen || still) return
      seen = true
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2
        const d = 260 + Math.random() * 120
        x[i] = CX + Math.cos(a) * d
        y[i] = CY + Math.sin(a) * d
        vx[i] = vy[i] = 0
      }
      touched = performance.now()
      wake()
    })
    io.observe(c)

    // when left alone, it changes shape by itself (good for filming)
    const timer = setInterval(() => {
      if (!opts.current.idle || !visible || document.hidden || still) return
      if (performance.now() - touched < 4200) return
      burst({ x: CX + (Math.random() - 0.5) * 160, y: CY + (Math.random() - 0.5) * 120 })
    }, 600)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
      io.disconnect()
      c.removeEventListener('pointermove', move)
      c.removeEventListener('pointerleave', leave)
      c.removeEventListener('pointerdown', down)
      c.removeEventListener('pointerup', up)
      c.removeEventListener('pointercancel', cancel)
    }
  }, [])

  // a new word re-forms the swarm; a colour change only redraws
  useEffect(() => {
    api.current?.reshape()
  }, [word])
  useEffect(() => {
    api.current?.wake()
  }, [theme, grain])

  const t = THEMES[theme]
  return (
    <div
      className={`relative w-full max-w-[480px] select-none overflow-hidden rounded-[28px] ${className}`}
      style={{ aspectRatio: `${W} / ${H}`, background: t.bg, boxShadow: `inset 0 0 0 1px ${t.ring}`, WebkitTapHighlightColor: 'transparent' }}
    >
      <canvas
        ref={cv}
        role="img"
        aria-label="A shape made of dots. Tap to change the shape."
        className="absolute inset-0 h-full w-full cursor-pointer"
        // none: a finger dragging through the dots stays on them instead of scrolling the page
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
