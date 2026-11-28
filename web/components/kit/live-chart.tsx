'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Live chart · StackD Kit
 * A line chart that's alive: new values arrive on their own and the line slides left to make room, smoothly, not in
 * jumps. The newest point pulses at the right end, the scale eases up and down to fit, and the big number on top rolls
 * to each new value. Point at the line and a marker follows it like jelly, with the value and its time.
 *
 * One canvas, drawn only on screen. React + Tailwind, no other dependencies. Respects reduced motion.
 */

type Props = {
  /** What the chart shows, above the number. */
  label?: string
  /** Where each new value comes from. Default: a made-up stream around 1,200. */
  next?: () => number
  /** How often a new value arrives, ms. */
  every?: number
  /** How many values are on screen. */
  points?: number
  format?: (n: number) => string
  /** The line's colour. Default: ink on light, cream on dark. */
  color?: string
  theme?: 'light' | 'dark'
  /** Height of the chart, px (the width follows its container). */
  height?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const THEMES = {
  light: { ink: '#141310', mute: 'rgba(20,19,16,0.45)', grid: 'rgba(20,19,16,0.06)', label: '#141310', labelText: '#FFFFFF', card: '#FFFFFF' },
  dark: { ink: '#F2F0EC', mute: 'rgba(242,240,236,0.45)', grid: 'rgba(242,240,236,0.07)', label: '#F2F0EC', labelText: '#141310', card: '#141310' },
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const rgb = (hex: string) => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',') }

// a made-up stream that wanders like real traffic: a slow wave, a little noise, now and then a burst
const stream = () => {
  let v = 1200, t = 0, burst = 0
  return () => {
    t++
    if (Math.random() < 0.07) burst += 180 + Math.random() * 160
    burst *= 0.72
    v += (1200 + Math.sin(t / 9) * 220 - v) * 0.18 + (Math.random() - 0.5) * 70
    return Math.max(0, Math.round(v + burst))
  }
}

export function LiveChart({ label = 'Visitors right now', next, every = 1200, points = 40, format = (n) => Math.round(n).toLocaleString('en'), color, theme = 'light', height = 220, className = '' }: Props) {
  const c = THEMES[theme]
  const ink = color ?? c.ink
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const [delta, setDelta] = useState(0)
  // kept in refs, so a new function each render doesn't restart the chart and lose its history
  const fmt = useRef(format); fmt.current = format
  const src = useRef(next); src.current = next

  useEffect(() => {
    const canvas = cv.current, box = wrap.current
    if (!canvas || !box) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const g = canvas.getContext('2d')!
    const made = stream()
    const source = () => (src.current ?? made)()
    const format = (n: number) => fmt.current(n)
    let W = 0
    const H = height
    const resize = () => {
      W = Math.max(120, Math.round(box.clientWidth))
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
    }
    resize()
    const ro = new ResizeObserver(() => { resize(); wake() })
    ro.observe(box)

    // the values, each with when it came in; start with a full screen of history
    const vals: { v: number; at: number }[] = []
    const now0 = Date.now()
    for (let i = points; i >= 0; i--) vals.push({ v: source(), at: now0 - i * every })
    let arrived = performance.now()
    // the scale and the big number ease to where they need to be
    const scale = { lo: 0, hi: 1, lv: 0, hv: 0 }
    const fit = () => {
      const vs = vals.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs), pad = (mx - mn) * 0.25 + 1
      return [Math.max(0, mn - pad), mx + pad]
    }
    ;[scale.lo, scale.hi] = fit()
    let shown = vals[vals.length - 1].v
    const hover = { x: -1, on: false, mx: 0, my: 0, vx: 0, vy: 0 }
    let raf = 0, last = performance.now(), visible = true

    const draw = (t: number) => {
      const dt = Math.min(48, t - last) / 1000
      last = t
      let busy = false
      // ease the scale
      const [lo, hi] = fit()
      for (const [k, v] of [['lo', lo], ['hi', hi]] as const) {
        const cur = scale[k], vel = k === 'lo' ? 'lv' : 'hv'
        scale[vel] += ((v - cur) * 40 - scale[vel] * 12) * dt
        scale[k] += scale[vel] * dt
        if (Math.abs(v - scale[k]) > 0.5) busy = true
      }
      // roll the number
      const target = vals[vals.length - 1].v
      shown += (target - shown) * Math.min(1, dt * 6)
      if (Math.abs(target - shown) > 0.5) busy = true
      if (num.current) num.current.textContent = format(shown)

      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      const top = 14, bottom = H - 22, right = W - 46 // the scale's numbers get their own margin on the right
      const y = (v: number) => bottom - ((v - scale.lo) / (scale.hi - scale.lo)) * (bottom - top)
      // the line slides left between arrivals, so it never jumps
      const slide = still ? 1 : clamp((t - arrived) / every, 0, 1)
      if (slide < 1) busy = true
      const step = right / (points - 1)
      // the newest point sits a step past the right edge and slides in; the rest are spaced back from it
      const xs = vals.map((_, i) => right - (vals.length - 1 - i) * step + (1 - slide) * step)
      // gridlines and their values, faint, on the right
      g.font = `400 11px ${FONT}`; g.textAlign = 'right'; g.textBaseline = 'bottom'
      for (let k = 0; k <= 3; k++) {
        const v = scale.lo + ((scale.hi - scale.lo) * k) / 3, yy = y(v)
        g.strokeStyle = c.grid; g.lineWidth = 1
        g.beginPath(); g.moveTo(0, Math.round(yy) + 0.5); g.lineTo(W, Math.round(yy) + 0.5); g.stroke()
        if (k > 0) { g.fillStyle = c.mute; g.fillText(format(v), W - 2, yy - 3) }
      }
      // the line: a smooth curve through the points (monotone, so it never overshoots a value)
      const P = vals.map((p, i) => [xs[i], y(p.v)] as [number, number])
      // tangents that never overshoot (Fritsch–Carlson), so peaks stay where the values are and the curve stays soft
      const n = P.length, d: number[] = [], m: number[] = []
      for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / Math.max(1e-6, P[i + 1][0] - P[i][0]))
      for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
      for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
        const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b
        if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
      }
      const path = new Path2D()
      path.moveTo(P[0][0], P[0][1])
      for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = P[i], [x1, y1] = P[i + 1], h = (x1 - x0) / 3
        path.bezierCurveTo(x0 + h, y0 + m[i] * h, x1 - h, y1 - m[i + 1] * h, x1, y1)
      }
      const area = new Path2D(path)
      area.lineTo(P[P.length - 1][0], bottom); area.lineTo(P[0][0], bottom); area.closePath()
      const fill = g.createLinearGradient(0, top, 0, bottom)
      fill.addColorStop(0, `rgba(${rgb(ink)},0.14)`); fill.addColorStop(1, `rgba(${rgb(ink)},0)`)
      g.save(); g.beginPath(); g.rect(0, 0, right, H); g.clip()
      g.fillStyle = fill; g.fill(area)
      g.strokeStyle = ink; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path)
      g.restore()
      // fade the oldest end into the card
      const fadeL = g.createLinearGradient(0, 0, 48, 0)
      fadeL.addColorStop(0, c.card); fadeL.addColorStop(1, `${c.card}00`)
      g.fillStyle = fadeL; g.fillRect(0, 0, 48, bottom + 1)

      // the newest point, pulsing
      // it sits where the line meets the right edge, as the next value slides in
      const [ax, ay] = P[P.length - 2], [bx, by] = P[P.length - 1]
      const lx = Math.min(right, bx), uu = clamp((lx - ax) / Math.max(1e-6, bx - ax), 0, 1), ly = ay + (by - ay) * uu * uu * (3 - 2 * uu)
      if (!still) {
        const k = ((t / 1000) % 1.6) / 1.6
        g.strokeStyle = ink; g.globalAlpha = (1 - k) * 0.5; g.lineWidth = 1.5
        g.beginPath(); g.arc(lx, ly, 4 + k * 12, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1
        busy = true
      }
      g.fillStyle = ink; g.beginPath(); g.arc(lx, ly, 4, 0, Math.PI * 2); g.fill()
      g.fillStyle = c.card; g.beginPath(); g.arc(lx, ly, 1.6, 0, Math.PI * 2); g.fill()

      // time along the bottom: now, and a minute or so back
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = c.mute
      const span = Math.round(((points - 1) * every) / 1000)
      g.fillText(span >= 60 ? `${Math.round(span / 60)} min ago` : `${span}s ago`, 2, H - 4)
      g.textAlign = 'right'; g.fillText('Now', right, H - 4)

      // pointing at the line: a hairline, and a marker that follows it like jelly
      if (hover.on && hover.x >= 0) {
        // the value under the pointer, on the curve
        let i = 0
        while (i < P.length - 2 && P[i + 1][0] < hover.x) i++
        const [x0, y0] = P[i], [x1, y1] = P[i + 1]
        const u = clamp((hover.x - x0) / Math.max(1, x1 - x0), 0, 1), s = u * u * (3 - 2 * u)
        const ty = y0 + (y1 - y0) * s, tv = vals[i].v + (vals[i + 1].v - vals[i].v) * s
        const at = vals[i].at + (vals[i + 1].at - vals[i].at) * u
        // the marker springs to it
        hover.vx += ((hover.x - hover.mx) * 300 - hover.vx * 22) * dt
        hover.vy += ((ty - hover.my) * 300 - hover.vy * 22) * dt
        hover.mx += hover.vx * dt; hover.my += hover.vy * dt
        if (Math.abs(hover.x - hover.mx) > 0.2 || Math.abs(ty - hover.my) > 0.2) busy = true
        g.strokeStyle = c.grid; g.lineWidth = 1
        g.beginPath(); g.moveTo(Math.round(hover.mx) + 0.5, top); g.lineTo(Math.round(hover.mx) + 0.5, bottom); g.stroke()
        const stretch = clamp(Math.abs(hover.vy) / 400, 0, 0.5)
        g.fillStyle = c.card; g.strokeStyle = ink; g.lineWidth = 2
        g.beginPath(); g.ellipse(hover.mx, hover.my, 5.5 * (1 - stretch * 0.4), 5.5 * (1 + stretch), 0, 0, Math.PI * 2); g.fill(); g.stroke()
        // the pill
        const when = new Date(at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        const a = format(tv), b = when
        g.font = `600 12px ${FONT}`; const w1 = g.measureText(a).width
        g.font = `400 12px ${FONT}`; const w2 = g.measureText(b).width
        const w = w1 + w2 + 28, px = clamp(hover.mx - w / 2, 2, W - w - 2), py = Math.max(2, hover.my - 40)
        g.fillStyle = c.label; g.beginPath(); g.roundRect(px, py, w, 26, 13); g.fill()
        g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = c.labelText
        g.font = `600 12px ${FONT}`; g.fillText(a, px + 10, py + 13.5)
        g.globalAlpha = 0.6; g.font = `400 12px ${FONT}`; g.fillText(b, px + 18 + w1, py + 13.5); g.globalAlpha = 1
      }
      return busy
    }

    const frame = (t: number) => {
      raf = 0
      const busy = draw(t)
      if (visible && busy) raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    // a new value comes in
    const tick = setInterval(() => {
      const prev = vals[vals.length - 1].v
      vals.push({ v: source(), at: Date.now() })
      if (vals.length > points + 1) vals.shift()
      arrived = performance.now()
      setDelta(prev ? (vals[vals.length - 1].v - prev) / prev : 0)
      wake()
    }, every)

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake() })
    io.observe(canvas)
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      if (!hover.on) { hover.mx = x; hover.my = H / 2 }
      hover.x = x; hover.on = true; wake()
    }
    const onLeave = () => { hover.on = false; wake() }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    wake()
    return () => {
      cancelAnimationFrame(raf); clearInterval(tick); io.disconnect(); ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [every, points, ink, theme, height, c])

  const up = delta >= 0
  return (
    <div className={`flex flex-col ${className}`} style={{ fontFamily: FONT, color: c.ink }}>
      {label ? <p className="text-[13px]" style={{ color: c.mute }}>{label}</p> : null}
      <div className="mb-2 mt-0.5 flex items-baseline gap-2">
        <span ref={num} className="text-[32px] font-semibold tabular-nums tracking-[-0.02em]" />
        <span className="text-[12px] font-medium tabular-nums" style={{ color: up ? '#6C8544' : '#901919' }}>{up ? '↑' : '↓'} {Math.abs(delta * 100).toFixed(1)}%</span>
      </div>
      <div ref={wrap} className="w-full">
        <canvas ref={cv} className="block touch-none" aria-label={`${label}, live chart`} role="img" />
      </div>
    </div>
  )
}
