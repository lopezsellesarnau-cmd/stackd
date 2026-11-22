'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Image accordion · StackD Kit
 * Pictures cut into a set of windows that share one fixed frame. Point at one
 * and it opens; the others give up exactly the room it takes, because the frame
 * never changes size. The neighbours open a little too, so the whole set leans
 * toward the pointer, on a jelly spring that overshoots a touch.
 *
 * Three layouts:
 * - `columns`: tall slivers side by side
 * - `rows`: wide bands stacked, opening downward
 * - `grid`: square tiles; the one you point at opens its column and its row,
 *   like a lens moving over a contact sheet
 *
 * The pictures are cropped, never stretched, so opening one shows more of it
 * without anything in it moving. Nothing is laid over the photo; the open
 * picture's title sits under the frame.
 *
 * Mouse, touch (slide to scrub) and keyboard (arrows, Home, End, Escape).
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type AccordionImage = { src: string; alt: string; title?: string }
export type AccordionLayout = 'columns' | 'rows' | 'grid'

type Props = {
  images: AccordionImage[]
  layout?: AccordionLayout
  /** Grid only: tiles across. Defaults to a square-ish grid. */
  columns?: number
  /** How much the open picture takes, 0 to 100. */
  open?: number
  /** How far the swell carries into its neighbours, 0 to 100. */
  reach?: number
  /** How much it overshoots, 0 (none) to 100. */
  bounce?: number
  /** Space between pictures, px. The corners follow it. */
  gap?: number
  width?: number
  height?: number
  theme?: 'light' | 'dark'
  /** Show the open picture's title under the frame. */
  captions?: boolean
  /** Called with the open picture's index, or -1 when it closes. */
  onOpen?: (index: number) => void
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/* How much more room the open line gets than a closed one: at 50 about three
   times; at 0 the set only leans; at 100 the rest are edges. A grid opens on
   two axes at once, so each axis takes a bit less. */
const weight = (open: number, grid: boolean) => (0.4 + (clamp(open, 0, 100) / 100) * 2.8) * (grid ? 0.75 : 1)
/* A bell over distance in lines: how much of the swell a neighbour gets */
const swellAt = (d: number, reach: number) => {
  const w = 0.35 + (clamp(reach, 0, 100) / 100) * 0.9
  return Math.exp(-((d / w) ** 2))
}

type Spring = { x: number; v: number }

export function ImageAccordion({
  images,
  layout = 'columns',
  columns,
  open = 50,
  reach = 35,
  bounce = 30,
  gap = 8,
  width = 340,
  height,
  theme = 'light',
  captions = true,
  onOpen,
  className = '',
}: Props) {
  const n = images.length
  const grid = layout === 'grid'
  // the grid's shape: tiles across and down
  const cols = layout === 'rows' ? 1 : layout === 'columns' ? n : clamp(columns ?? Math.ceil(Math.sqrt(n)), 1, n)
  const rows = Math.ceil(n / cols)
  const h = height ?? (grid ? Math.round((width / cols) * rows) : 300)

  const [at, setAt] = useState(-1)
  const [focused, setFocused] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const cells = useRef<(HTMLDivElement | null)[]>([])
  // one spring per column and per row, 0 (closed) to 1 (fully swelled)
  const colS = useRef<Spring[]>([])
  const rowS = useRef<Spring[]>([])
  const raf = useRef(0)
  const still = useRef(false)
  const live = useRef({ at, open, reach, bounce, cols, grid })
  live.current = { at, open, reach, bounce, cols, grid }
  const told = useRef(onOpen)
  told.current = onOpen

  const g = clamp(gap, 0, 24)
  const radius = Math.min(12, g)
  const ink = theme === 'dark' ? '#F2F0EC' : '#141310'
  const muted = theme === 'dark' ? 'rgba(242,240,236,0.5)' : 'rgba(20,19,16,0.45)'

  const paint = () => {
    const el = frame.current
    if (!el) return
    const k = weight(live.current.open, live.current.grid)
    const track = (s: Spring[]) => s.map((q) => `minmax(0, ${Math.max(0.05, 1 + k * q.x).toFixed(4)}fr)`).join(' ')
    el.style.gridTemplateColumns = track(colS.current)
    el.style.gridTemplateRows = track(rowS.current)
  }

  const run = () => {
    if (raf.current) return
    let prev = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.033, (t - prev) / 1000)
      prev = t
      const { at: a, reach: r, bounce: b, cols: c } = live.current
      // stiffer and less damped as bounce goes up: from no overshoot to a visible wobble
      const k = 170 + (clamp(b, 0, 100) / 100) * 110
      const damp = 2 * Math.sqrt(k) * (1 - (clamp(b, 0, 100) / 100) * 0.7)
      let moving = false
      const step = (list: Spring[], target: (i: number) => number) => list.forEach((s, i) => {
        const to = target(i)
        if (still.current) { s.x = to; s.v = 0; return }
        for (let q = 0; q < 4; q++) {
          s.v += (-k * (s.x - to) - damp * s.v) * (dt / 4)
          s.x += s.v * (dt / 4)
        }
        if (Math.abs(s.x - to) > 0.0005 || Math.abs(s.v) > 0.001) moving = true
        else { s.x = to; s.v = 0 }
      })
      const ac = a % c, ar = Math.floor(a / c)
      // a single column or row doesn't swell: there's nothing to share with
      step(colS.current, (i) => (a < 0 || colS.current.length < 2 ? 0 : swellAt(Math.abs(i - ac), r)))
      step(rowS.current, (i) => (a < 0 || rowS.current.length < 2 ? 0 : swellAt(Math.abs(i - ar), r)))
      paint()
      raf.current = moving ? requestAnimationFrame(tick) : 0
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => { cancelAnimationFrame(raf.current); raf.current = 0 }
  }, [])

  // one spring per line as the shape changes
  useEffect(() => {
    colS.current = Array.from({ length: cols }, (_, i) => colS.current[i] ?? { x: 0, v: 0 })
    rowS.current = Array.from({ length: rows }, (_, i) => rowS.current[i] ?? { x: 0, v: 0 })
    paint()
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows])

  useEffect(() => { run(); told.current?.(at) }, [at]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run() }, [open, reach]) // eslint-disable-line react-hooks/exhaustive-deps

  // Which picture is under a point. The open one grows away from the pointer, so this can't flicker.
  const under = (x: number, y: number) => {
    for (let i = 0; i < n; i++) {
      const r = cells.current[i]?.getBoundingClientRect()
      if (r && x >= r.left - g / 2 && x <= r.right + g / 2 && y >= r.top - g / 2 && y <= r.bottom + g / 2) return i
    }
    return -1
  }

  const onKey = (e: React.KeyboardEvent) => {
    const go = (i: number) => { e.preventDefault(); setAt(clamp(i, 0, n - 1)) }
    const from = at < 0 ? 0 : at
    // across moves by one; up and down move by a row (in columns, everything is one row)
    if (e.key === 'ArrowRight') go(at < 0 ? 0 : from + (cols > 1 ? 1 : 1))
    else if (e.key === 'ArrowLeft') go(at < 0 ? n - 1 : from - 1)
    else if (e.key === 'ArrowDown') go(at < 0 ? 0 : from + (cols > 1 && rows > 1 ? cols : 1))
    else if (e.key === 'ArrowUp') go(at < 0 ? n - 1 : from - (cols > 1 && rows > 1 ? cols : 1))
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(n - 1)
    else if (e.key === 'Escape') { e.preventDefault(); setAt(-1) }
  }

  const current = at >= 0 ? images[at] : null

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`} style={{ width, fontFamily: FONT }}>
      <div
        ref={frame}
        role="listbox"
        aria-label="Pictures"
        aria-activedescendant={at >= 0 ? `acc-${at}` : undefined}
        tabIndex={0}
        className={`grid ${layout === 'rows' ? 'touch-pan-x' : 'touch-pan-y'} select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344] focus-visible:ring-offset-2`}
        style={{
          width, height: h, gap: g, borderRadius: radius,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
        onPointerMove={(e) => {
          // a mouse opens by pointing; a finger by pressing and sliding
          if (e.pointerType !== 'mouse' && e.buttons === 0) return
          const i = under(e.clientX, e.clientY)
          if (i >= 0 && i !== at) setAt(i)
        }}
        onPointerDown={(e) => { const i = under(e.clientX, e.clientY); if (i >= 0) setAt(i) }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse' && !focused) setAt(-1) }}
        onPointerCancel={() => setAt(-1)}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setAt(-1) }}
      >
        {images.map((img, i) => (
          <div
            key={img.src + i}
            id={`acc-${i}`}
            role="option"
            aria-selected={at === i}
            aria-label={img.title ?? img.alt}
            ref={(el) => { cells.current[i] = el }}
            className="relative min-h-0 min-w-0 overflow-hidden"
            style={{ borderRadius: radius }}
          >
            <img src={img.src} alt={img.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {captions ? (
        <div className="relative h-5 w-full text-center text-[14px] font-medium" aria-live="polite">
          <span key={at} className="stackd-acc-cap absolute inset-x-0" style={{ color: current ? ink : muted }}>
            {current ? current.title ?? current.alt : `${n} pictures`}
          </span>
          <style>{'.stackd-acc-cap{animation:stackd-acc-in 320ms cubic-bezier(.34,1.45,.5,1)}@keyframes stackd-acc-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.stackd-acc-cap{animation:none}}'}</style>
        </div>
      ) : null}
    </div>
  )
}
