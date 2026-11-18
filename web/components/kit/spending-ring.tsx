'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * Spending ring · StackD Kit 25
 * Where the money went, as a ring of thick ink pills, one per category, sized by amount. The small
 * ones roll up into round drops. It pours in from one drop at the top. Hover a pill and it swells
 * while the rest step back, and the middle counts to its amount. Tap it to leave it out: it pinches
 * off into a drop and falls, the others flow together to close the gap, and the total counts down.
 * Left-out categories wait under the ring; tap one to pour it back.
 *
 * The pills are SVG strokes with round ends, melted together by a blur-and-threshold filter, so
 * when they touch while moving they run into each other like liquid. React + Tailwind, no other
 * libraries. Works with the keyboard and screen readers, respects reduced motion.
 */

export type Spend = { name: string; amount: number; icon?: IconName | ReactNode; color?: string }
export type IconName = keyof typeof ICONS

type Props = {
  /** The categories. Default: a month of demo spending. */
  data?: Spend[]
  title?: string
  /** Above the total. Default "This month". */
  label?: string
  /** Under the total. Default "spent". */
  unit?: string
  /** Any currency code for Intl. Default "EUR". */
  currency?: string
  locale?: string
  theme?: 'light' | 'dark'
  /** Called with the names left out, after every tap. */
  onChange?: (hidden: string[]) => void
  className?: string
}

// ── Simple line icons, 24 box ──
const ICONS = {
  home: 'M4 11l8-7 8 7v9H4zM10 20v-5h4v5',
  travel: 'M3 12l18-8-7 17-3-7z',
  food: 'M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M16.5 21V3c-2.5 1.5-3 5-3 8h3',
  shopping: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  transport: 'M5 17V11l2-5h10l2 5v6zM5 11h14M7.5 20v-3M16.5 20v-3',
  bills: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  fun: 'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z',
  health: 'M12 20s-8-4.5-8-10a4 4 0 0 1 8-1.5A4 4 0 0 1 20 10c0 5.5-8 10-8 10z',
} as const

const DEMO: Spend[] = [
  { name: 'Home', amount: 840, icon: 'home' },
  { name: 'Travel', amount: 590, icon: 'travel' },
  { name: 'Food', amount: 412, icon: 'food' },
  { name: 'Shopping', amount: 248, icon: 'shopping' },
  { name: 'Transport', amount: 132, icon: 'transport' },
  { name: 'Bills', amount: 98, icon: 'bills' },
  { name: 'Fun', amount: 74, icon: 'fun' },
]
// StackD colours first, then their lighter tints
const COLORS = ['#141310', '#BE9344', '#6C8544', '#C9B8FF', '#901919', '#CFCBC2', '#E3C98F', '#A9BD7E']

// ── Geometry, in a 300 box ──
const S = 300, C = S / 2, R = 104, T = 42 // ring radius, pill thickness
const GAP = 16 / R // between pills, radians
const DOT = T / R // the angle a round drop takes
const TOP = -Math.PI / 2 + 0.35 // where the first pill starts
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const calm = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const at = (a: number, r = R) => [C + Math.cos(a) * r, C + Math.sin(a) * r] as const

/** Light text on dark pills, ink on light ones */
const inkOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#141310' : '#FFFFFF'
}
const mix = (a: string, b: string, t: number) => {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t)
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

/** Each shown category's slice of the ring: big ones by amount, small ones at least a drop */
function layout(amounts: number[], hot: number | null) {
  const n = amounts.length
  if (!n) return []
  const extra = hot === null ? 0 : 10 / R // room around the hovered pill
  const room = Math.PI * 2 - GAP * n - extra * 2
  const total = amounts.reduce((a, b) => a + b, 0) || 1
  const size = amounts.map((v) => (v / total) * room)
  // Drops can't be smaller than a drop: give them that, share what's left among the rest
  for (let pass = 0; pass < 3; pass++) {
    const small = size.map((v) => v <= DOT)
    const fixed = small.filter(Boolean).length * DOT
    const big = amounts.reduce((a, v, i) => a + (small[i] ? 0 : v), 0) || 1
    for (let i = 0; i < n; i++) size[i] = small[i] ? DOT : (amounts[i] / big) * (room - fixed)
  }
  const out: { a: number; b: number }[] = []
  let a = TOP
  for (let i = 0; i < n; i++) {
    if (i === hot) a += extra
    // The path runs between the centres of the round ends, so it's shorter by a drop
    const mid = a + size[i] / 2, half = Math.max(0, size[i] - DOT) / 2
    out.push({ a: mid - half, b: mid + half })
    a += size[i] + GAP + (i === hot ? extra : 0)
  }
  return out
}

/** A number that counts to its new value */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (calm()) { setShown(value); from.current = value; return }
    const a = from.current, start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 600), e = 1 - Math.pow(1 - t, 3)
      const v = a + (value - a) * e
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(Math.round(shown))}</>
}

export function SpendingRing({
  data = DEMO,
  title = 'Expenses',
  label = 'This month',
  unit = 'spent',
  currency = 'EUR',
  locale = 'en-US',
  theme = 'light',
  onChange,
  className = '',
}: Props) {
  const dark = theme === 'dark'
  const card = dark ? '#141310' : '#FFFFFF'
  const fg = dark ? '#FFFFFF' : '#141310'
  const goo = useId().replace(/:/g, '')
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }), [locale, currency])

  // Biggest first, each with its colour
  const cats = useMemo(
    () => [...data].sort((a, b) => b.amount - a.amount).map((d, i) => ({ ...d, color: d.color ?? (dark && i === 0 ? '#FFFFFF' : COLORS[i % COLORS.length]) })),
    [data, dark],
  )
  const [hidden, setHidden] = useState<string[]>([])
  const [hot, setHot] = useState<string | null>(null)
  const shown = cats.filter((c) => !hidden.includes(c.name))
  const total = shown.reduce((a, c) => a + c.amount, 0)
  const hotCat = shown.find((c) => c.name === hot) ?? null

  const toggle = (name: string) => {
    const next = hidden.includes(name) ? hidden.filter((h) => h !== name) : [...hidden, name]
    setHidden(next)
    setHot(null)
    onChange?.(next)
  }

  // ── Motion: every pill springs its two ends, its thickness and its dimming; a left-out one falls ──
  const paths = useRef<Record<string, SVGPathElement | null>>({})
  const labels = useRef<Record<string, HTMLDivElement | null>>({})
  const st = useRef<Record<string, { a: number; b: number; va: number; vb: number; w: number; vw: number; dim: number; fall: number; vfall: number; out: boolean }>>({})
  const target = useRef<Record<string, { a: number; b: number; w: number; dim: number; out: boolean }>>({})
  const wake = useRef(() => {})

  // Targets from the layout
  useEffect(() => {
    const L = layout(shown.map((c) => c.amount), hotCat ? shown.indexOf(hotCat) : null)
    shown.forEach((c, i) => { target.current[c.name] = { a: L[i].a, b: L[i].b, w: c === hotCat ? T + 10 : T, dim: hotCat && c !== hotCat ? 1 : 0, out: false } })
    for (const c of cats) if (hidden.includes(c.name)) {
      // Left out: shrink to a drop where it was, then fall
      const s = st.current[c.name], mid = s ? (s.a + s.b) / 2 : TOP
      target.current[c.name] = { a: mid, b: mid, w: T, dim: 0, out: true }
    }
    // First time: everything starts as one drop at the top
    for (const c of cats) if (!st.current[c.name]) {
      const t = target.current[c.name]
      st.current[c.name] = calm() ? { a: t.a, b: t.b, va: 0, vb: 0, w: t.w, vw: 0, dim: 0, fall: 0, vfall: 0, out: false } : { a: TOP, b: TOP, va: 0, vb: 0, w: 0, vw: 0, dim: 0, fall: 0, vfall: 0, out: false }
    }
    wake.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, hot, cats])

  useEffect(() => {
    let raf = 0, last = 0
    const spring = (x: number, v: number, to: number, k: number, c: number, dt: number) => { v += (k * (to - x) - c * v) * dt; return [x + v * dt, v] }
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60)
      last = now
      const still = calm()
      let moving = false
      cats.forEach((c, i) => {
        const s = st.current[c.name], t = target.current[c.name]
        if (!s || !t) return
        if (still) { s.a = t.a; s.b = t.b; s.w = t.out ? 0 : t.w; s.dim = t.dim; s.fall = t.out ? 1 : 0 }
        else {
          // Pour in one after another: later pills wait a little at the start
          const k = 120, d = 15
          ;[s.a, s.va] = spring(s.a, s.va, t.a, k, d, dt)
          ;[s.b, s.vb] = spring(s.b, s.vb, t.b, k - i * 6, d, dt)
          ;[s.w, s.vw] = spring(s.w, s.vw, t.w, 200, 16, dt)
          s.dim += (t.dim - s.dim) * Math.min(1, dt * 12)
          // Falling starts once it's a drop
          const ready = t.out && Math.abs(s.b - s.a) < 0.05
          ;[s.fall, s.vfall] = spring(s.fall, s.vfall, ready ? 1 : t.out ? s.fall : 0, 90, 12, dt)
          if (Math.abs(s.a - t.a) + Math.abs(s.b - t.b) + Math.abs(s.w - t.w) > 0.002 || Math.abs(s.va) + Math.abs(s.vb) > 0.002 || Math.abs(s.dim - t.dim) > 0.01 || (t.out && s.fall < 0.995) || (!t.out && s.fall > 0.005)) moving = true
        }
        // Draw: the arc between the two round ends; a falling drop drops and thins
        const p = paths.current[c.name]
        const f = clamp(s.fall, 0, 1.2)
        const w = Math.max(0, s.w * (1 - clamp(f, 0, 1) * 0.85))
        const dy = f * 90, mid = (s.a + s.b) / 2
        const [x1, y1] = at(s.a), [x2, y2] = at(s.b)
        const big = s.b - s.a > Math.PI ? 1 : 0
        const d = s.b - s.a < 0.002
          ? `M${(C + Math.cos(mid) * R).toFixed(2)} ${(C + Math.sin(mid) * R + dy).toFixed(2)}h0.01`
          : `M${x1.toFixed(2)} ${(y1 + dy).toFixed(2)}A${R} ${R} 0 ${big} 1 ${x2.toFixed(2)} ${(y2 + dy).toFixed(2)}`
        if (p) {
          p.setAttribute('d', d)
          p.setAttribute('stroke-width', w.toFixed(2))
          p.setAttribute('stroke', mix(c.color.startsWith('#') ? c.color : '#141310', card, s.dim * 0.62))
          p.style.opacity = f > 0.9 ? String(clamp((1.15 - f) * 4, 0, 1)) : '1'
        }
        // The amount at the start, the icon at the end; drops only show their icon
        const l = labels.current[c.name]
        if (l) {
          const long = s.b - s.a > 0.42
          const [ix, iy] = at(long ? s.b : mid)
          const [ax, ay] = at(s.a + 0.02)
          l.style.opacity = String(t.out || w < T * 0.6 ? 0 : 1)
          const icon = l.children[0] as HTMLElement, amount = l.children[1] as HTMLElement
          icon.style.transform = `translate(${ix - 10}px, ${iy - 10}px) scale(${s.w / T})`
          amount.style.transform = `translate(${ax}px, ${ay}px) translate(-50%, -50%)`
          amount.style.opacity = long ? '1' : '0'
        }
      })
      raf = moving ? requestAnimationFrame(frame) : 0
    }
    wake.current = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }
    wake.current()
    return () => cancelAnimationFrame(raf)
  }, [cats, card])

  const Icon = ({ icon, color }: { icon: Spend['icon']; color: string }) =>
    typeof icon === 'string' && icon in ICONS ? (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={ICONS[icon as IconName]} />
      </svg>
    ) : (
      <span className="flex h-5 w-5 items-center justify-center" style={{ color }}>{icon as ReactNode}</span>
    )

  return (
    <div className={`w-[348px] select-none rounded-[28px] p-6 ${className}`} style={{ background: card, color: fg, boxShadow: dark ? '0 24px 48px rgba(0,0,0,.3)' : '0 24px 48px rgba(20,19,16,.07), 0 0 0 1px rgba(20,19,16,.05)' }}>
      <p className="text-[17px] font-medium">{title}</p>

      <div className="relative -mx-1 mt-2 h-[300px] w-[300px]" onPointerLeave={() => setHot(null)}>
        <svg viewBox={`0 0 ${S} ${S}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <filter id={goo} x="-20%" y="-20%" width="140%" height="160%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
            </filter>
          </defs>
          <g filter={`url(#${goo})`} fill="none" strokeLinecap="round">
            {cats.map((c) => (
              <path
                key={c.name}
                ref={(e) => { paths.current[c.name] = e }}
                className="cursor-pointer"
                style={{ pointerEvents: hidden.includes(c.name) ? 'none' : 'stroke' }}
                onPointerEnter={() => setHot(c.name)}
                onClick={() => toggle(c.name)}
              />
            ))}
          </g>
        </svg>

        {/* Icons and amounts sit on top, sharp, outside the filter */}
        {cats.map((c) => (
          <div key={c.name} ref={(e) => { labels.current[c.name] = e }} className="pointer-events-none absolute left-0 top-0 h-full w-full" style={{ transition: 'opacity .2s' }}>
            <div className="absolute left-0 top-0 origin-center" style={{ width: 20, height: 20 }}>
              <Icon icon={c.icon} color={inkOn(c.color.startsWith('#') ? c.color : '#141310')} />
            </div>
            <div className="absolute left-0 top-0 whitespace-nowrap font-mono text-[12px] tabular-nums" style={{ color: inkOn(c.color.startsWith('#') ? c.color : '#141310') }}>
              {money.format(c.amount)}
            </div>
          </div>
        ))}

        {/* The middle: the total, or the pill you're on */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
          <p className="text-[13px]" style={{ opacity: 0.5 }}>{hotCat ? hotCat.name : label}</p>
          <p className="mt-0.5 text-[40px] font-medium leading-none tracking-[-0.03em] tabular-nums">
            <Count value={hotCat ? hotCat.amount : total} format={(n) => money.format(n)} />
          </p>
          <p className="mt-1 text-[13px] tabular-nums" style={{ opacity: 0.5 }}>
            {hotCat ? `${Math.round((hotCat.amount / (total || 1)) * 100)}% of ${unit}` : unit}
          </p>
        </div>
      </div>

      {/* Left out: tap one to pour it back */}
      <div className="mt-2 flex min-h-[32px] flex-wrap items-center justify-center gap-1.5">
        {hidden.length ? (
          cats.filter((c) => hidden.includes(c.name)).map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => toggle(c.name)}
              className="flex h-8 items-center gap-1.5 rounded-full pl-1 pr-3 text-[12px] font-medium"
              style={{ background: dark ? 'rgba(255,255,255,.08)' : 'rgba(20,19,16,.05)' }}
              aria-label={`Add ${c.name} back`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: c.color }}>
                <span className="scale-[.7]"><Icon icon={c.icon} color={inkOn(c.color.startsWith('#') ? c.color : '#141310')} /></span>
              </span>
              {c.name}
            </button>
          ))
        ) : (
          <p className="text-[12px]" style={{ opacity: 0.4 }}>Tap a category to leave it out</p>
        )}
      </div>

      {/* For the keyboard and screen readers: every category as a button */}
      <ul className="sr-only">
        {cats.map((c) => (
          <li key={c.name}>
            <button type="button" onFocus={() => setHot(c.name)} onBlur={() => setHot(null)} onClick={() => toggle(c.name)}>
              {c.name}, {money.format(c.amount)}{hidden.includes(c.name) ? ', left out. Press to add back' : '. Press to leave out'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
