'use client'

import { useEffect, useRef } from 'react'

/**
 * Thread word · StackD Kit
 * A word embroidered on fabric, the way a machine sews lettering on a cap or a patch. Each stroke of a letter is
 * covered in satin stitch: long threads running across it from edge to edge, raised off the cloth, catching the
 * light differently as they turn, so the curves shimmer. Underneath, a fill stitch (the underlay) holds the shape.
 * Change the word and the needle sews it in the way a machine does: one column at a time, zigzagging from edge to
 * edge, letter after letter.
 * Each thread is held in the fabric at both ends: your cursor tugs it in the middle and it springs back when you
 * move on. A click plucks the threads around it.
 *
 * One canvas, drawn only while something moves and only on screen.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

type Props = {
  /** The word. Short words work best. */
  text?: string
  /** The thread's colour. Default: ink on the light fabric, cream on the dark one. */
  thread?: string
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Space between threads, px. Smaller is denser. */
  spacing?: number
  /** How long the needle takes to sew the word, ms. */
  duration?: number
  /** How far the cursor tugs, 0 to 100. */
  reach?: number
  /** Sew the word in with the needle when it appears or changes. */
  sewIn?: boolean
  /** Hold the cursor here (0 to 1 across and down), for covers and mock-ups. */
  tug?: { x: number; y: number }
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const THEMES = { light: { fabric: '#ECE8DF', thread: '#141310' }, dark: { fabric: '#191816', thread: '#F2F0EC' } }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const rgb = (hex: string) => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (hex: string, to: number, k: number) => `rgb(${rgb(hex).map((c) => Math.round(c + (to - c) * k)).join(',')})`

type Thread = { ax: number; ay: number; bx: number; by: number; mx: number; my: number; len: number; px: number; py: number; sheen: number; birth: number; ox: number; oy: number; vx: number; vy: number }

const LIGHT = { x: -0.55, y: -0.83 } // from the top left
const SHEENS = 6

export function ThreadWord({ text = 'HELLO', thread, theme = 'light', width = 560, height = 320, spacing = 1.3, duration = 2600, reach = 50, sewIn = true, tug, className = '' }: Props) {
  const c = THEMES[theme]
  const color = thread ?? c.thread
  const cv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    const g = canvas.getContext('2d')!
    const dark = theme === 'dark'
    const W = width, H = height

    // ── the word, as a mask, and a softened copy whose slope points into the letter ──
    const mk = () => { const e = document.createElement('canvas'); e.width = W; e.height = H; return e }
    const m = mk(), mg = m.getContext('2d', { willReadFrequently: true })!
    let size = H * 0.6
    mg.font = `800 ${size}px ${FONT}`
    const tw = mg.measureText(text).width
    if (tw > W * 0.86) { size *= (W * 0.86) / tw; mg.font = `800 ${size}px ${FONT}` }
    mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.fillStyle = '#000'
    mg.fillText(text, W / 2, H / 2 + size * 0.04)
    const px = mg.getImageData(0, 0, W, H).data
    const soft = mk(), so = soft.getContext('2d', { willReadFrequently: true })!
    so.filter = 'blur(2px)'; so.drawImage(m, 0, 0)
    const sp = so.getImageData(0, 0, W, H).data
    const at = (d: Uint8ClampedArray, x: number, y: number) => { const xi = x | 0, yi = y | 0; return xi < 0 || yi < 0 || xi >= W || yi >= H ? 0 : d[(yi * W + xi) * 4 + 3] }
    const inside = (x: number, y: number) => at(px, x, y) > 127

    // ── the fabric: a fine weave and a little grain ──
    const layer = () => { const e = document.createElement('canvas'); e.width = W * dpr; e.height = H * dpr; const x = e.getContext('2d')!; x.scale(dpr, dpr); return [e, x] as const }
    const [fabric, fg] = layer()
    fg.fillStyle = c.fabric; fg.fillRect(0, 0, W, H)
    const tone = dark ? '255,255,255' : '0,0,0'
    for (let y = 0; y < H; y += 3) { fg.fillStyle = `rgba(${tone},${y % 6 ? 0.025 : 0.045})`; fg.fillRect(0, y, W, 1.2) }
    for (let x = 0; x < W; x += 3) { fg.fillStyle = `rgba(${tone},${x % 6 ? 0.02 : 0.035})`; fg.fillRect(x, 0, 1.2, H) }
    for (let i = 0; i < (W * H) / 14; i++) {
      fg.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${dark ? 0.12 : 0.05})` : `rgba(255,255,255,${dark ? 0.03 : 0.12})`
      fg.fillRect(Math.random() * W, Math.random() * H, 1, 1)
    }

    // ── under the satin: the word's shadow on the cloth, and the underlay (a fill stitch in a darker shade) ──
    const [under, ug] = layer()
    {
      const th = -0.5, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux, D = Math.hypot(W, H)
      const path = new Path2D()
      for (let r = -D / 2, row = 0; r <= D / 2; r += spacing * 1.6, row++) {
        const cx = W / 2 + nx * r, cy = H / 2 + ny * r, off = (row % 2) * 4
        let s = NaN
        for (let t = -D / 2; t <= D / 2 + 1; t++) {
          const ins = t <= D / 2 && inside(cx + ux * t, cy + uy * t)
          if (ins && isNaN(s)) s = t
          if (!ins && !isNaN(s)) {
            for (let a = s; a < t - 2; a += 8) { const b = Math.min(t - 1, a + 8 - (a === s ? off : 0)); path.moveTo(cx + ux * a, cy + uy * a); path.lineTo(cx + ux * b, cy + uy * b) }
            s = NaN
          }
        }
      }
      ug.save(); ug.lineCap = 'round'; ug.lineWidth = spacing * 1.4; ug.strokeStyle = mix(color, 0, 0.3); ug.stroke(path)
      // the underlay stays inside the letters
      ug.globalCompositeOperation = 'destination-in'; ug.setTransform(1, 0, 0, 1, 0, 0); ug.drawImage(m, 0, 0, W * dpr, H * dpr); ug.restore()
      ug.save(); ug.globalCompositeOperation = 'destination-over'; ug.globalAlpha = dark ? 0.55 : 0.18; ug.filter = 'blur(3px)'; ug.drawImage(m, 1.5, 3); ug.restore()
    }

    // ── the satin: from points along each letter's edge, a straight thread into the letter until it comes out the other side ──
    const edge: { x: number; y: number; nx: number; ny: number; main: boolean }[] = []
    const cell = Math.max(1, spacing)
    const grid = new Map<number, { x: number; y: number }[]>()
    const key = (x: number, y: number) => ((x / cell) | 0) * 100000 + ((y / cell) | 0)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!inside(x, y) || (inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))) continue
      // the slope of the softened word points into the letter
      let gx = at(sp, x + 1, y) - at(sp, x - 1, y), gy = at(sp, x, y + 1) - at(sp, x, y - 1)
      const gl = Math.hypot(gx, gy)
      if (gl < 1) continue
      gx /= gl; gy /= gl
      // no thread starts at a corner: the edge has to run on the same way a few px either side
      let bent = false
      for (const sgn of [-1, 1]) {
        const qx = x - gy * 3 * sgn, qy = y + gx * 3 * sgn
        let hx = at(sp, qx + 1, qy) - at(sp, qx - 1, qy), hy = at(sp, qx, qy + 1) - at(sp, qx, qy - 1)
        const hl = Math.hypot(hx, hy)
        if (hl < 1) { bent = true; break }
        hx /= hl; hy /= hl
        if (hx * gx + hy * gy < 0.9) { bent = true; break }
      }
      if (bent) continue
      // one side of each stroke is enough, the thread crosses to the other; the other side only fills the joins
      const main = gx * 0.6 + gy * 0.8 > 0.02
      // evenly spaced: no other thread starts closer than the spacing
      const k = key(x, y)
      let near = false
      for (let i = -1; i <= 1 && !near; i++) for (let j = -1; j <= 1 && !near; j++) for (const q of grid.get(k + i * 100000 + j) ?? []) if ((q.x - x) ** 2 + (q.y - y) ** 2 < spacing * spacing * 0.92) { near = true; break }
      if (near) continue
      const list = grid.get(k) ?? []; list.push({ x, y }); grid.set(k, list)
      edge.push({ x, y, nx: gx, ny: gy, main })
    }
    const runs = edge.map((e) => { let l = 0.5; while (l < size && inside(e.x + e.nx * l, e.y + e.ny * l)) l += 0.5; return l })
    const sorted = runs.filter((_, i) => edge[i].main).sort((a, b) => a - b)
    const stroke = sorted[Math.floor(sorted.length * 0.5)] || size * 0.2
    let threads: Thread[] = []
    // where threads already lie, so the joins only get threads where nothing covers them yet
    const cover = new Uint8Array(W * H)
    const mark = (ax: number, ay: number, bx: number, by: number) => {
      const L = Math.hypot(bx - ax, by - ay), r = Math.ceil(spacing * 0.6)
      for (let d = 0; d <= L; d += 0.7) {
        const x = (ax + ((bx - ax) * d) / L) | 0, y = (ay + ((by - ay) * d) / L) | 0
        for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const xi = x + i, yi = y + j; if (xi >= 0 && yi >= 0 && xi < W && yi < H) cover[yi * W + xi] = 1 }
      }
    }
    const free = (ax: number, ay: number, bx: number, by: number) => {
      let n = 0
      for (let u = 0.1; u < 0.95; u += 0.1) { const x = (ax + (bx - ax) * u) | 0, y = (ay + (by - ay) * u) | 0; if (!cover[y * W + x]) n++ }
      return n / 9
    }
    const add = (e: (typeof edge)[number], L: number) => {
      const ax = e.x, ay = e.y, bx = e.x + e.nx * L, by = e.y + e.ny * L
      // a thread facing the light shines more: satin changes with the angle of its threads
      const face = Math.abs(e.nx * LIGHT.y - e.ny * LIGHT.x)
      let ppx = -e.ny, ppy = e.nx
      if (ppx * LIGHT.x + ppy * LIGHT.y < 0) { ppx = -ppx; ppy = -ppy }
      threads.push({ ax, ay, bx, by, mx: (ax + bx) / 2, my: (ay + by) / 2, len: L, px: ppx, py: ppy, sheen: Math.min(SHEENS - 1, (face * SHEENS) | 0), birth: 0, ox: 0, oy: 0, vx: 0, vy: 0 })
      mark(ax, ay, bx, by)
    }
    // the columns: a thread straight across the stroke, coming out on the opposite edge
    edge.forEach((e, i) => {
      const L = runs[i]
      if (!e.main || L < 2 || L > stroke * 1.25) return
      add(e, L)
    })
    // the joins: from any edge whose thread would run on along another stroke, a short column one stroke wide
    edge.forEach((e, i) => {
      if (runs[i] <= stroke * 1.25) return
      const L = stroke * 0.98
      if (free(e.x, e.y, e.x + e.nx * L, e.y + e.ny * L) > 0.6) add(e, L)
    })

    // ── the machine's order: letter by letter, and inside a letter always the nearest thread next, starting from where
    // the last one ended, so it zigzags up each column ──
    {
      const left = threads.slice().sort((a, b) => Math.min(a.ax, a.bx) - Math.min(b.ax, b.bx))
      const done = new Uint8Array(left.length)
      const out: Thread[] = []
      let cx = left.length ? Math.min(left[0].ax, left[0].bx) : 0, cy = left.length ? left[0].ay : 0
      for (let n = 0; n < left.length; n++) {
        let best = -1, bd = Infinity, flip = false
        for (let i = 0; i < left.length; i++) {
          if (done[i]) continue
          const t = left[i]
          const da = (t.ax - cx) ** 2 + (t.ay - cy) ** 2, db = (t.bx - cx) ** 2 + (t.by - cy) ** 2
          // a little pull to the left keeps it from wandering ahead into the next letter
          const d = Math.min(da, db) + Math.max(0, Math.min(t.ax, t.bx) - cx) * 6
          if (d < bd) { bd = d; best = i; flip = db < da }
        }
        const t = left[best]; done[best] = 1
        if (flip) { [t.ax, t.bx] = [t.bx, t.ax]; [t.ay, t.by] = [t.by, t.ay] }
        cx = t.bx; cy = t.by
        out.push(t)
      }
      threads = out
      threads.forEach((t, i) => { t.birth = (i / Math.max(1, threads.length)) * duration })
    }

    const sheens = Array.from({ length: SHEENS }, (_, i) => mix(color, 255, 0.02 + i * 0.035))
    const ends = mix(color, 0, 0.18)
    const core = dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.22)'
    const shadow = dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.26)'
    const shine = dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.42)'
    const GROW = 55
    const R = 40 + reach * 1.4

    // ── state ──
    const p = { x: 0, y: 0, vx: 0, vy: 0, on: false }
    if (tug) { p.x = tug.x * W; p.y = tug.y * H; p.on = true }
    const sewing = sewIn && !still && !tug
    // the needle starts when the word first comes on screen; without it, the word is there from the start
    let t0 = sewing ? Infinity : -1e9
    let raf = 0, last = performance.now(), visible = true

    // a point on the thread, which bows towards (ox, oy) in the middle
    const pt = (t: Thread, f: number, u: number) => {
      const bx = t.ax + (t.bx - t.ax) * f, by = t.ay + (t.by - t.ay) * f
      const qx = (t.ax + bx) / 2 + t.ox * f, qy = (t.ay + by) / 2 + t.oy * f
      const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u
      return [a * t.ax + b * qx + d * bx, a * t.ay + b * qy + d * by]
    }
    const curve = (path: Path2D, t: Thread, f: number, u0: number, u1: number, dx = 0, dy = 0) => {
      const steps = u1 - u0 > 0.5 ? 4 : 2
      for (let s = 0; s <= steps; s++) {
        const [x, y] = pt(t, f, u0 + ((u1 - u0) * s) / steps)
        if (s === 0) path.moveTo(x + dx, y + dy); else path.lineTo(x + dx, y + dy)
      }
    }

    const draw = (now: number) => {
      const t = now - t0
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.drawImage(fabric, 0, 0, W, H)
      // the underlay is there as far as the needle has got
      let front = -1
      if (t >= duration + GROW) front = W
      else for (const s of threads) if (t > s.birth && Math.max(s.ax, s.bx) > front) front = Math.max(s.ax, s.bx)
      if (front > 0) { g.save(); g.beginPath(); g.rect(0, 0, front + 3, H); g.clip(); g.drawImage(under, 0, 0, W, H); g.restore() }

      const pShadow = new Path2D(), pEnds = new Path2D(), pCore = new Path2D(), pShine = new Path2D()
      const pSheen = sheens.map(() => new Path2D())
      let tip: Thread | null = null, tipF = 0
      const w = spacing * 1.12
      for (const s of threads) {
        const f = clamp((t - s.birth) / GROW, 0, 1)
        if (f <= 0) continue
        if (f < 1 && (!tip || s.birth > tip.birth)) { tip = s; tipF = f }
        curve(pShadow, s, f, 0, 1, 0.7, 1.3)
        curve(pSheen[s.sheen], s, f, 0, 1)
        // where the thread dives into the cloth it's in shadow
        if (f === 1) { curve(pEnds, s, f, 0, 0.07); curve(pEnds, s, f, 0.93, 1) }
        // round like a thread: a shaded side and a shine on the side facing the light
        curve(pCore, s, f, 0.08, 0.92, -s.px * w * 0.32, -s.py * w * 0.32)
        if (f === 1) curve(pShine, s, f, 0.22, 0.78, s.px * w * 0.22, s.py * w * 0.22)
      }
      g.lineCap = 'round'
      g.lineWidth = w * 1.15; g.strokeStyle = shadow; g.stroke(pShadow)
      g.lineWidth = w
      pSheen.forEach((path, i) => { g.strokeStyle = sheens[i]; g.stroke(path) })
      g.strokeStyle = ends; g.stroke(pEnds)
      g.lineWidth = w * 0.4; g.strokeStyle = core; g.stroke(pCore)
      g.lineWidth = Math.max(0.5, w * 0.24); g.strokeStyle = shine; g.stroke(pShine)

      // the needle, at the thread being sewn, with its thread running off the top
      const fade = clamp(1 - (t - duration - GROW) / 300, 0, 1)
      if (sewing && isFinite(t0) && fade > 0) {
        const [x, y] = tip ? pt(tip, tipF, 1) : [W * 0.9, H * 0.3]
        const bob = tip ? Math.sin(tipF * Math.PI) * 3 : 0 // up and down as it goes through
        g.globalAlpha = fade
        const ex = x + 12, ey = y - 26 - bob
        g.lineWidth = 1.3; g.strokeStyle = color
        g.beginPath(); g.moveTo(ex, ey); g.quadraticCurveTo(ex + 34, ey - 46, ex + 96, ey - 150); g.stroke()
        g.lineWidth = 2.1; g.strokeStyle = dark ? '#8E8C87' : '#9A9893'
        g.beginPath(); g.moveTo(x, y - bob); g.lineTo(ex + 1.5, ey - 3); g.stroke()
        g.lineWidth = 0.7; g.strokeStyle = dark ? '#D8D6D0' : '#F4F2EE'
        g.beginPath(); g.moveTo(x + 0.2, y - bob - 1.2); g.lineTo(ex, ey - 1); g.stroke()
        g.globalAlpha = 1
      }
      return sewing && isFinite(t0) && t < duration + GROW + 300
    }

    const step = (dt: number) => {
      let busy = false
      const k = 240, damp = 14
      for (const s of threads) {
        let tx = 0, ty = 0
        if (p.on) {
          const dx = p.x - s.mx, dy = p.y - s.my, d = Math.hypot(dx, dy)
          if (d < R && d > 0.01) {
            const fall = (1 - d / R) ** 2, bow = Math.min(8, s.len * 0.22)
            // pulled towards the cursor, and a little along the way it moves
            tx = (dx / d) * bow * fall + p.vx * 0.005 * fall
            ty = (dy / d) * bow * fall + p.vy * 0.005 * fall
            const n = Math.hypot(tx, ty), cap = bow * 1.4
            if (n > cap) { tx *= cap / n; ty *= cap / n }
          }
        }
        if (tx === 0 && ty === 0 && s.ox === 0 && s.oy === 0 && s.vx === 0 && s.vy === 0) continue
        s.vx += (k * (tx - s.ox) - damp * s.vx) * dt
        s.vy += (k * (ty - s.oy) - damp * s.vy) * dt
        s.ox += s.vx * dt; s.oy += s.vy * dt
        if (Math.abs(s.ox - tx) < 0.02 && Math.abs(s.oy - ty) < 0.02 && Math.abs(s.vx) < 0.05 && Math.abs(s.vy) < 0.05) {
          s.ox = tx; s.oy = ty; s.vx = 0; s.vy = 0
        } else busy = true
      }
      p.vx *= 0.85; p.vy *= 0.85
      return busy
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(32, now - last) / 1000
      last = now
      let busy = false
      if (!still) { busy = step(dt / 2) || busy; busy = step(dt / 2) || busy }
      busy = draw(now) || busy
      if (busy && visible) raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) { if (sewing && !isFinite(t0)) t0 = performance.now(); wake() }
    })
    io.observe(canvas)

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    let lastMove = 0
    const onMove = (e: PointerEvent) => {
      if (tug || still) return
      const q = pos(e), now = performance.now(), dt = Math.max(8, now - lastMove) / 1000
      if (p.on && lastMove) { p.vx = (q.x - p.x) / dt; p.vy = (q.y - p.y) / dt }
      p.x = q.x; p.y = q.y; p.on = true; lastMove = now
      wake()
    }
    const onLeave = () => { if (tug) return; p.on = false; lastMove = 0; wake() }
    const onDown = (e: PointerEvent) => {
      if (still) return
      const q = pos(e)
      // pluck: the threads around the click jump away from it, then settle
      for (const s of threads) {
        const dx = s.mx - q.x, dy = s.my - q.y, d = Math.hypot(dx, dy)
        if (d < 150 && d > 0.01) { const f = (1 - d / 150) * 300; s.vx += (dx / d) * f; s.vy += (dy / d) * f }
      }
      wake()
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)
    if (tug) { for (let i = 0; i < 240; i++) step(1 / 60) }
    wake()

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
    }
  }, [text, color, theme, width, height, spacing, duration, reach, sewIn, tug?.x, tug?.y, c.fabric])

  return (
    <canvas
      ref={cv}
      role="img"
      aria-label={`${text}, embroidered in thread`}
      className={`block touch-none rounded-[22px] ${className}`}
      style={{ width, height }}
    />
  )
}
