'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Hex performance · StackD Kit
 * A dashboard card with a honeycomb heatmap: every hexagon is one slice of your data, and the hotter it is,
 * the warmer its colour. It pops in from the centre outward. Point at a hexagon and it lifts, with its
 * neighbours leaning in, and tells you its value. Point at a stat in the legend and only its hexagons stay lit.
 * Switch the range and the honeycomb squishes and recolours in a ripple from the middle. More analysis opens
 * the rows below, and each row opens for detail. Everything moves like a sponge: squash, bounce, settle.
 *
 * React + Tailwind, no other dependencies. Mouse, touch and keyboard. Respects reduced motion.
 */

export type HexStat = { label: string; value: string }
export type HexRow = { label: string; value: string; delta: number; detail?: string }
export type HexRange = {
  label: string
  /** One number per hexagon, 0 to 1, row by row; null leaves a gap. */
  cells: (number | null)[]
  /** Hexagons across each row. */
  columns: number
  /** The three stats in the legend: the warmest first. */
  stats: [HexStat, HexStat, HexStat]
  rows?: HexRow[]
}

type Props = {
  title?: string
  subtitle?: string
  ranges: HexRange[]
  /** What a hexagon's value reads as, e.g. (v) => `${Math.round(v * 100)}% opened`. */
  format?: (value: number) => string
  /** The top-right button. Without href or onClick it opens the rows below (and says `lessLabel`). */
  link?: { label: string; lessLabel?: string; href?: string; onClick?: () => void }
  theme?: 'light' | 'dark'
  width?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const THEMES = {
  light: { card: '#FFFFFF', ink: '#141310', dim: 'rgba(20,19,16,0.5)', line: 'rgba(20,19,16,0.08)', soft: 'rgba(20,19,16,0.04)', cold: 'rgba(20,19,16,0.07)' },
  dark: { card: '#1E1D1A', ink: '#F2F0EC', dim: 'rgba(242,240,236,0.5)', line: 'rgba(242,240,236,0.1)', soft: 'rgba(242,240,236,0.05)', cold: 'rgba(242,240,236,0.08)' },
}
// From cold to hot: the legend's three stats are the warmest tiers (Ochre, light Ochre, Lilac)
const TIERS = [0.2, 0.42, 0.64, 0.82]
const HOT = ['#C9B8FF', '#DCC08C', '#BE9344'] // tier 1 (Lilac), light Ochre, tier 3 (Ochre)
const tierOf = (v: number) => (v >= TIERS[3] ? 3 : v >= TIERS[2] ? 2 : v >= TIERS[1] ? 1 : v >= TIERS[0] ? 0 : -1)

export function HexPerformance({
  title = 'Performance',
  subtitle = 'Email',
  ranges,
  format = (v) => `${Math.round(v * 100)}%`,
  link = { label: 'More analysis' },
  theme = 'light',
  width = 400,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const [r, setR] = useState(0)
  const [at, setAt] = useState(-1) // the hexagon pointed at
  const [hover, setHover] = useState(-1) // the legend stat pointed at (0 = warmest)
  const [locked, setLocked] = useState(-1) // the legend stat pressed
  const [more, setMore] = useState(false) // the rows, behind "More analysis"
  const [open, setOpen] = useState(-1)
  const [switched, setSwitched] = useState(false) // after the first range change, hexagons squish instead of popping in
  const range = ranges[r]

  // The honeycomb: pointy-top hexagons, odd rows shifted half a hexagon
  const pad = 20
  const inner = width - pad * 2
  const cols = range.columns
  const rowsN = Math.ceil(range.cells.length / cols)
  const hw = inner / (cols + 0.5) // a hexagon's width
  const rad = hw / Math.sqrt(3)
  const H = rad * 1.5 * (rowsN - 1) + rad * 2
  const cells = useMemo(() => {
    const cx0 = (cols - 1 + 0.5) / 2, cy0 = (rowsN - 1) / 2
    return range.cells.map((v, i) => {
      const row = Math.floor(i / cols), col = i % cols
      const x = hw / 2 + col * hw + (row & 1 ? hw / 2 : 0)
      const y = rad + row * rad * 1.5
      const d = Math.hypot(col + (row & 1 ? 0.5 : 0) - cx0, (row - cy0) * 0.87)
      return { v, x, y, d, row, col }
    })
  }, [range.cells, cols, rowsN, hw, rad])
  const maxD = Math.max(1, ...cells.map((q) => q.d))

  // A hexagon with soft corners, like the Bot's: each corner is a curve, not a point
  const hexPath = (s = 1) => {
    const k = rad * s - 1.4
    const p = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2
      return [k * Math.cos(a), k * Math.sin(a)]
    })
    const cut = 0.3 // how far along each side the curve starts
    const at = (a: number[], b: number[], t: number) => `${(a[0] + (b[0] - a[0]) * t).toFixed(2)} ${(a[1] + (b[1] - a[1]) * t).toFixed(2)}`
    let d = ''
    p.forEach((q, i) => {
      const prev = p[(i + 5) % 6], next = p[(i + 1) % 6]
      d += `${i ? 'L' : 'M'}${at(q, prev, cut)}Q${q[0].toFixed(2)} ${q[1].toFixed(2)} ${at(q, next, cut)}`
    })
    return d + 'Z'
  }
  const shape = useMemo(() => hexPath(), [rad]) // eslint-disable-line react-hooks/exhaustive-deps
  const fillOf = (v: number | null) => {
    if (v == null) return 'transparent'
    const t = tierOf(v)
    return t < 0 ? c.cold : t === 0 ? (theme === 'dark' ? 'rgba(201,184,255,0.28)' : 'rgba(201,184,255,0.4)') : HOT[t - 1]
  }

  const lit = locked >= 0 ? locked : hover // the stat whose hexagons stay lit
  const near = at >= 0 ? cells[at] : null
  const lean = (q: (typeof cells)[number], i: number) => {
    if (!near || i === at) return 1
    const d = Math.hypot(q.x - near.x, q.y - near.y) / hw
    return d < 1.2 ? 0.86 : d < 2.2 ? 0.96 : 1 // the neighbours give way, like a sponge pressed
  }

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - box.left, y = e.clientY - box.top
    let best = -1, bd = rad * rad
    cells.forEach((q, i) => {
      if (q.v == null) return
      const dd = (q.x - x) ** 2 + (q.y - y) ** 2
      if (dd < bd) { bd = dd; best = i }
    })
    setAt(best)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const step = (dc: number, dr: number) => {
      e.preventDefault()
      const from = at < 0 ? cells.findIndex((q) => q.v != null && q.d < 1.5) : at
      const q = cells[from]
      for (let k = 1; k < 4; k++) {
        const row = q.row + dr * k, col = q.col + dc * k
        const i = row * cols + col
        if (row >= 0 && row < rowsN && col >= 0 && col < cols && cells[i]?.v != null) { setAt(i); return }
      }
      setAt(from)
    }
    if (e.key === 'ArrowRight') step(1, 0)
    else if (e.key === 'ArrowLeft') step(-1, 0)
    else if (e.key === 'ArrowDown') step(0, 1)
    else if (e.key === 'ArrowUp') step(0, -1)
    else if (e.key === 'Escape') setAt(-1)
  }

  // The legend's jelly: the edge moving toward the new stat leaves first, the other catches up
  const prevLit = useRef(lit)
  const goingRight = lit > prevLit.current
  useEffect(() => { if (lit >= 0) prevLit.current = lit }, [lit])
  const third = 100 / 3
  const blobAt = lit >= 0 ? lit : prevLit.current >= 0 ? prevLit.current : 0

  const tip = near && near.v != null ? format(near.v) : null
  const ownLink = !link.href && !link.onClick
  const rows = range.rows ?? []

  return (
    <div className={`rounded-[26px] p-5 ${className}`} style={{ width, background: c.card, color: c.ink, fontFamily: FONT, boxShadow: `0 0 0 1px ${c.line}, 0 10px 30px rgba(20,19,16,0.06)` }}>
      <style>{SPONGE}</style>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[19px] font-semibold tracking-[-0.02em]">{title}</p>
          <p className="mt-1 flex items-center gap-2 text-[13px]">
            <span style={{ color: c.dim }}>{subtitle}</span>
            <span className="h-3 w-px" style={{ background: c.line }} />
            {/* The range: a small segmented switch */}
            <span className="flex gap-0.5 rounded-full p-0.5" style={{ background: c.soft }} role="tablist" aria-label="Range">
              {ranges.map((x, i) => (
                <button key={x.label} role="tab" aria-selected={i === r} onClick={() => { if (i !== r) setSwitched(true); setR(i); setAt(-1); setOpen(-1) }}
                  className="hx-press rounded-full px-2 py-0.5 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#BE9344]"
                  style={{ background: i === r ? c.card : 'transparent', color: i === r ? c.ink : c.dim, boxShadow: i === r ? `0 0 0 1px ${c.line}` : undefined }}>
                  {x.label}
                </button>
              ))}
            </span>
          </p>
        </div>
        <a
          href={link.href ?? '#'}
          aria-expanded={ownLink ? more : undefined}
          onClick={(e) => {
            if (link.onClick) { e.preventDefault(); link.onClick() }
            else if (ownLink) { e.preventDefault(); setMore((m) => !m); setOpen(-1) }
          }}
          className="hx-press mt-0.5 flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[14px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#BE9344]"
          style={{ background: more ? c.ink : c.soft, color: more ? c.card : c.ink }}
        >
          {more ? link.lessLabel ?? 'Less' : link.label}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.8,.5,1)]" style={{ transform: more ? 'rotate(90deg)' : undefined }}>
            <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* The honeycomb */}
      <div className="relative mx-auto mt-4" style={{ width: inner, height: H }}>
        <svg
          width={inner} height={H} className="block touch-none overflow-visible outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-[#BE9344]"
          role="img" tabIndex={0}
          aria-label={`${title}, ${range.label}: ${range.stats.map((s) => `${s.value} ${s.label}`).join(', ')}`}
          onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setAt(-1)} onKeyDown={onKey} onBlur={() => setAt(-1)}
        >
          {cells.map((q, i) => {
            if (q.v == null) return null
            const t = tierOf(q.v)
            const dim = lit >= 0 && t !== 3 - lit
            const wave = (q.d / maxD) * 460
            return (
              // the group leans when a neighbour is pointed at; the shape inside does the squash and bounce
              <g key={i} style={{ transform: `translate(${q.x}px, ${q.y}px) scale(${lean(q, i)})`, transition: 'transform 520ms cubic-bezier(.34,1.8,.5,1)' }}>
                <path
                  d={shape}
                  className={`hx-cell ${switched ? (r % 2 ? 'hx-b' : 'hx-c') : ''}`}
                  fill={fillOf(q.v)}
                  style={{
                    opacity: dim ? 0.16 : 1,
                    transition: `fill 380ms ease ${wave}ms, opacity 260ms ease`,
                    animationDelay: `${wave}ms`,
                  }}
                />
              </g>
            )
          })}
          {/* the one pointed at, lifted on top with a wobble */}
          {near && near.v != null ? (
            <g key={at} style={{ transform: `translate(${near.x}px, ${near.y}px)` }} pointerEvents="none">
              <path d={shape} className="hx-lift" fill={fillOf(near.v)} stroke={c.card} strokeWidth={2.5} />
            </g>
          ) : null}
        </svg>
        {tip && near ? (
          <span key={at} className="hx-tip pointer-events-none absolute z-10 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium"
            style={{ left: clamp(near.x, 44, inner - 44), top: near.y - rad * 1.55, background: c.ink, color: c.card }}>
            {tip}
          </span>
        ) : null}
        <span className="sr-only" aria-live="polite">{tip ?? ''}</span>
      </div>

      {/* The legend: a jelly blob in the stat's colour. Point to preview, press to keep its hexagons lit. */}
      <div className="relative mt-5 grid grid-cols-3 rounded-[18px] p-1" style={{ background: c.soft }} role="group" aria-label="Show one stat">
        <span
          aria-hidden
          className="absolute bottom-1 top-1 rounded-[14px]"
          style={{
            left: `calc(${blobAt * third}% + 4px)`,
            right: `calc(${(2 - blobAt) * third}% + 4px)`,
            background: HOT[2 - blobAt],
            opacity: lit >= 0 ? 1 : 0,
            transform: lit >= 0 ? 'scale(1)' : 'scale(0.6, 0.4)',
            transition: [
              `left ${goingRight ? 520 : 300}ms cubic-bezier(.34,1.6,.5,1)`,
              `right ${goingRight ? 300 : 520}ms cubic-bezier(.34,1.6,.5,1)`,
              'background-color 300ms ease',
              'opacity 200ms ease',
              'transform 460ms cubic-bezier(.34,1.8,.5,1)',
            ].join(', '),
          }}
        />
        {range.stats.map((s, i) => {
          const on = lit === i
          return (
            <button
              key={s.label}
              type="button"
              aria-pressed={locked === i}
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(-1)}
              onFocus={() => setHover(i)} onBlur={() => setHover(-1)}
              onClick={() => setLocked(locked === i ? -1 : i)}
              className="hx-press relative flex flex-col items-start rounded-[14px] px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344]"
              style={{ color: on ? '#141310' : c.ink }}
            >
              <span className="flex items-center gap-1.5 text-[12px]" style={{ color: on ? 'rgba(20,19,16,0.6)' : c.dim }}>
                <span className="h-2 w-2 rounded-full transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.8,.5,1)]" style={{ background: on ? '#141310' : HOT[2 - i], transform: on ? 'scale(1.3)' : undefined }} />
                {s.label}
              </span>
              <span className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-[-0.02em]">{s.value}</span>
            </button>
          )
        })}
      </div>

      {/* The rows, behind "More analysis" */}
      {more && rows.length ? (
        <ul className="mt-3">
          {rows.map((row, i) => (
            <li key={`${r}-${row.label}`} className="hx-row" style={{ animationDelay: `${i * 55}ms` }}>
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#BE9344]"
                style={{ background: open === i ? c.soft : 'transparent' }}>
                <span className="font-semibold tabular-nums">{row.value}</span>
                <span style={{ color: c.dim }}>{row.label}</span>
                <span className="ml-auto flex items-center gap-1.5 tabular-nums" style={{ color: c.dim }}>
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: row.delta >= 0 ? 'rgba(108,133,68,0.16)' : 'rgba(144,25,25,0.14)', color: row.delta >= 0 ? '#6C8544' : '#901919' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ transform: row.delta >= 0 ? undefined : 'rotate(180deg)' }}><path d="M5 8.2V2M2.4 4.4 5 1.8l2.6 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  {row.delta >= 0 ? '+' : ''}{row.delta}%
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.8,.5,1)]" style={{ transform: open === i ? 'rotate(180deg)' : undefined, color: c.dim }}><path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {open === i ? (
                <p className="hx-row px-2.5 pb-2.5 pt-0.5 text-[13px]" style={{ color: c.dim }}>
                  {row.detail ?? `${row.label}: ${row.value} of the emails, ${row.delta >= 0 ? 'up' : 'down'} ${Math.abs(row.delta)}% on the previous ${range.label.toLowerCase()}.`}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/* The sponge: hexagons squash and bounce in, squish when they recolour, the pointed one wobbles up;
   buttons give a little when pressed; rows drop in with a bounce */
const SPONGE = `
.hx-cell{transform-box:fill-box;transform-origin:center;animation:hx-pop 760ms cubic-bezier(.3,1.5,.5,1) both}
.hx-cell.hx-b{animation-name:hx-pop-b}.hx-cell.hx-c{animation-name:hx-pop-c}
@keyframes hx-pop{0%{transform:scale(0)}55%{transform:scale(1.16,.86)}75%{transform:scale(.93,1.07)}100%{transform:scale(1)}}
@keyframes hx-pop-b{0%{transform:scale(1)}30%{transform:scale(.72,.8)}60%{transform:scale(1.12,.92)}80%{transform:scale(.97,1.03)}100%{transform:scale(1)}}
.hx-lift{transform-box:fill-box;transform-origin:center;animation:hx-lift 560ms cubic-bezier(.3,1.5,.5,1) both}
@keyframes hx-pop-c{0%{transform:scale(1)}30%{transform:scale(.72,.8)}60%{transform:scale(1.12,.92)}80%{transform:scale(.97,1.03)}100%{transform:scale(1)}}
@keyframes hx-lift{0%{transform:scale(1)}40%{transform:scale(1.46,1.2)}65%{transform:scale(1.24,1.4)}85%{transform:scale(1.34,1.28)}100%{transform:scale(1.3)}}
.hx-tip{transform:translate(-50%,-100%);animation:hx-tip 420ms cubic-bezier(.34,1.8,.5,1) both}
@keyframes hx-tip{0%{opacity:0;transform:translate(-50%,-80%) scale(.6)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}
.hx-press{transition:transform 420ms cubic-bezier(.34,1.8,.5,1),background-color 200ms,color 200ms}
.hx-press:active{transform:scale(.92,.88);transition-duration:90ms}
.hx-row{animation:hx-row 560ms cubic-bezier(.3,1.6,.5,1) both}
@keyframes hx-row{0%{opacity:0;transform:translateY(-8px) scale(.94,.8)}60%{opacity:1;transform:translateY(1px) scale(1.02,1.04)}100%{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.hx-cell,.hx-lift,.hx-tip,.hx-row{animation:none!important}.hx-lift{transform:scale(1.3)}.hx-tip{transform:translate(-50%,-100%)}}
`

/** A made-up honeycomb for demos: a warm core with a ragged edge, the same every time for a seed. */
export function demoCells(columns: number, rows: number, seed = 1): (number | null)[] {
  let t = seed >>> 0
  const rand = () => { t = (t + 0x6d2b79f5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
  const cx = (columns - 0.5) / 2, cy = (rows - 1) / 2
  const hot = { x: cx + (rand() - 0.5) * 2, y: cy + (rand() - 0.5) * 2 }
  const out: (number | null)[] = []
  for (let r = 0; r < rows; r++) for (let q = 0; q < columns; q++) {
    const x = q + (r & 1 ? 0.5 : 0)
    const edge = Math.hypot((x - cx) / (columns / 2), (r - cy) / (rows / 2))
    const wobble = 0.12 * Math.sin(x * 1.3 + seed) + 0.1 * Math.cos(r * 1.7 - seed) + (rand() - 0.5) * 0.22
    if (edge + wobble > 0.98) { out.push(null); continue }
    const d = Math.hypot((x - hot.x) / (columns / 2.4), (r - hot.y) / (rows / 2.4))
    out.push(clamp(Math.exp(-d * d * 1.6) * 0.95 + (rand() - 0.5) * 0.28 + 0.08, 0, 1))
  }
  return out
}
