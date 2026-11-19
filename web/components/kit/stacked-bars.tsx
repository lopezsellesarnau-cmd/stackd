'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Stacked bars · StackD Kit 26
 * A traffic card: one stacked bar per day (or week), a capsule per source, and under the baseline
 * the part that bounced. Run along it and the column under you opens up: its capsules spread apart
 * and widen so each one reads, while the rest step back. No tooltip: the card reads itself. The big
 * number counts to that day, the date shows under it, and the key turns into the breakdown.
 * Day / Week swaps the data and the bars regrow in a wave. React + Tailwind, no other libraries.
 * Respects reduced motion.
 */

export type BarDatum = { label: string; values: number[]; below?: number }
export type Series = { name: string; color?: string }

type Props = {
  /** One entry per day, oldest first. Default: demo days. */
  data?: BarDatum[]
  /** The same by week: with it, a Day / Week switch shows. Default: demo weeks (only with demo days). */
  weekly?: BarDatum[]
  /** The blocks in each bar, bottom first. Default: Direct, Search, Social, Email. */
  series?: Series[]
  /** What the part under the baseline is. Default "Bounced". Leave `below` out of the data to hide it. */
  belowLabel?: string
  title?: string
  /** What the total counts. Default "visits". */
  unit?: string
  theme?: 'light' | 'dark'
  className?: string
}

const COLORS = ['#141310', '#BE9344', '#6C8544', '#C9B8FF']
const WINE = '#901919'
const W = 312, CH = 132, BH = 26, GAP = 2, OPEN = 6, LIFT = 3
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DISPLAY = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const calm = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const SPRING = 'cubic-bezier(.3,1.3,.5,1)'

/** Demo traffic: quieter weekends, a few busy days, ending 18 Nov 2026 */
function demo(week: boolean): BarDatum[] {
  let seed = week ? 41 : 17
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const end = Date.UTC(2026, 10, 18), DAY = 86400000
  const base = [420, 300, 180, 140]
  const fmt = (t: number) => { const d = new Date(t); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` }
  return Array.from({ length: 20 }, (_, i) => {
    const back = 19 - i
    if (!week) {
      const t = end - back * DAY, wd = new Date(t).getUTCDay()
      const quiet = wd === 0 || wd === 6 ? 0.55 : 1, busy = r() < 0.12 ? 1.45 : 1
      return { label: fmt(t), values: base.map((b) => Math.round(b * quiet * busy * (0.65 + r() * 0.7))), below: Math.round(20 + r() * 50 * quiet * busy) }
    }
    const t = end - back * 7 * DAY, s = t - 6 * DAY
    return { label: `${fmt(s)} – ${new Date(t).getUTCDate()}`, values: base.map((b) => Math.round(b * 5.6 * (0.75 + r() * 0.5))), below: Math.round(180 + r() * 260) }
  })
}

function Count({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (calm()) { setShown(value); from.current = value; return }
    const a = from.current, start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700), v = a + (value - a) * (1 - Math.pow(1 - t, 3))
      from.current = v; setShown(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{Math.round(shown).toLocaleString('en-US')}</>
}

export function StackedBars({
  data,
  weekly,
  series = [{ name: 'Direct' }, { name: 'Search' }, { name: 'Social' }, { name: 'Email' }],
  belowLabel = 'Bounced',
  title = 'Traffic',
  unit = 'visits',
  theme = 'light',
  className = '',
}: Props) {
  const dark = theme === 'dark'
  const card = dark ? '#141310' : '#FFFFFF'
  const fg = dark ? '#FFFFFF' : '#141310'
  const colors = series.map((s, i) => s.color ?? (dark && i === 0 ? '#FFFFFF' : COLORS[i % COLORS.length]))
  const days = useMemo(() => data ?? demo(false), [data])
  const weeks = useMemo(() => weekly ?? (data ? undefined : demo(true)), [weekly, data])
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const bars = mode === 'week' && weeks ? weeks : days
  const n = bars.length

  const [at, setAt] = useState<number | null>(null)
  const [seen, setSeen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const plot = useRef<HTMLDivElement>(null)

  // Grow out of the baseline the first time it's on screen
  useEffect(() => {
    const el = root.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  // Geometry
  const gap = Math.max(1, Math.min(6, (W - 3 * n) / (n - 1)))
  const bw = (W - gap * (n - 1)) / n
  const totals = bars.map((b) => b.values.reduce((a, v) => a + v, 0))
  const maxT = Math.max(1, ...totals)
  const maxB = Math.max(1, ...bars.map((b) => b.below ?? 0))
  const hasBelow = bars.some((b) => b.below !== undefined)
  // The tallest bar leaves room above it to open up
  const scale = (CH - LIFT - 4 - OPEN * (series.length - 1)) / maxT
  const cols = bars.map((b, i) => {
    const g = i === at ? OPEN : GAP // the open column spreads its capsules apart
    let y = 0
    const segs = b.values.map((v) => { const h = Math.max(2, v * scale); const s = { y, h }; y += h + g; return s })
    return { segs, below: b.below ? Math.max(3, (b.below / maxB) * (BH - LIFT - 2)) : 0 }
  })
  const total = totals.reduce((a, b) => a + b, 0)

  const pick = (x: number) => {
    const b = plot.current?.getBoundingClientRect()
    if (!b || !b.width) return
    setAt(Math.max(0, Math.min(n - 1, Math.floor(((x - b.left) / b.width) * n))))
  }
  const cur = at !== null && at < n ? bars[at] : null
  const still = calm()
  const pill = (w: number, h: number) => Math.min(w, h) / 2

  return (
    <div ref={root} className={`w-[360px] select-none rounded-[28px] p-6 ${className}`} style={{ background: card, color: fg, boxShadow: dark ? '0 24px 48px rgba(0,0,0,.3)' : '0 24px 48px rgba(20,19,16,.07), 0 0 0 1px rgba(20,19,16,.05)' }}>
      {/* Header: title and the Day / Week switch */}
      <div className="flex items-start justify-between">
        <p className="text-[17px] font-medium">{title}</p>
        {weeks ? (
          <div className="relative flex rounded-full p-1" style={{ background: dark ? 'rgba(255,255,255,.08)' : 'rgba(20,19,16,.05)' }} role="group" aria-label="Range">
            <span className="absolute bottom-1 top-1 w-[52px] rounded-full" style={{ background: fg, transform: `translateX(${mode === 'week' ? 52 : 0}px)`, transition: still ? 'none' : `transform .4s ${SPRING}` }} />
            {(['day', 'week'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setAt(null) }} className="relative h-7 w-[52px] rounded-full text-[12px] font-medium capitalize" style={{ color: mode === m ? card : fg, transition: 'color .25s' }}>
                {m}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* The number: the whole range, or the column you're on */}
      <div className="mt-3" aria-live="polite">
        <p className="text-[36px] font-semibold leading-none tracking-[-0.02em] tabular-nums" style={{ fontFamily: DISPLAY }}>
          <Count value={!seen ? 0 : cur ? totals[at!] : total} />
          <span className="ml-2 text-[14px] font-normal tracking-normal" style={{ opacity: 0.5 }}>{unit}</span>
        </p>
        <p className="mt-1.5 h-4 text-[12px] tabular-nums" style={{ opacity: 0.5 }}>
          {cur ? cur.label : `Last ${n} ${mode === 'week' ? 'weeks' : 'days'}`}
        </p>
      </div>

      {/* The plot */}
      <div
        ref={plot}
        className="relative mt-4"
        style={{ height: CH + 1 + (hasBelow ? BH : 0), touchAction: 'pan-y' }}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX) }}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerUp={(e) => { if (e.pointerType !== 'mouse') setAt(null) }}
        onPointerCancel={() => setAt(null)}
        onPointerLeave={() => setAt(null)}
      >
        <span className="absolute inset-x-0 h-px" style={{ top: CH, background: fg, opacity: 0.12 }} />
        {bars.map((_, i) => {
          const open = at === i
          const grow = open ? 4 : 0 // the open column widens a little, both sides
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{ left: i * (bw + gap) - grow / 2, width: bw + grow, opacity: at === null || open ? 1 : 0.3, transition: still ? 'opacity .2s' : `opacity .2s, left .35s ${SPRING}, width .35s ${SPRING}` }}
            >
              {cols[i].segs.map((s, k) => (
                <span
                  key={k}
                  className="absolute inset-x-0"
                  style={{
                    bottom: (hasBelow ? BH : 0) + 1 + LIFT + (seen ? s.y : 0),
                    height: seen ? s.h : 0,
                    background: colors[k],
                    borderRadius: pill(bw + grow, s.h),
                    // First: a wave, column by column. Then opening and closing springs at once
                    transition: still ? 'none' : `height .7s ${SPRING} ${at === null ? i * 22 + k * 30 : 0}ms, bottom ${at === null ? '.7s' : '.35s'} ${SPRING} ${at === null ? i * 22 + k * 30 : 0}ms, border-radius .35s`,
                  }}
                />
              ))}
              {hasBelow ? (
                <span className="absolute inset-x-0" style={{ top: CH + 1 + LIFT + (open ? OPEN - GAP : 0), height: seen ? cols[i].below : 0, background: WINE, borderRadius: pill(bw + grow, cols[i].below), transition: still ? 'none' : `height .6s ${SPRING} ${at === null ? i * 22 + 120 : 0}ms, top .35s ${SPRING}` }} />
              ) : null}
            </div>
          )
        })}
      </div>

      {/* First and last date */}
      <div className="mt-2 flex justify-between text-[11px] tabular-nums" style={{ opacity: 0.45 }}>
        <span>{bars[0]?.label.split(' – ')[0]}</span>
        <span>{bars[n - 1]?.label.split(' – ')[0]}</span>
      </div>

      {/* The key: names at rest, the breakdown of the open column */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        {series.map((s, k) => (
          <span key={s.name} className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: colors[k] }} />
            <span className="flex-1" style={{ opacity: 0.6 }}>{s.name}</span>
            <span className="font-medium tabular-nums" style={{ fontFamily: DISPLAY, opacity: cur ? 1 : 0, transition: 'opacity .2s' }}>{cur ? cur.values[k].toLocaleString('en-US') : ''}</span>
          </span>
        ))}
        {hasBelow ? (
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: WINE }} />
            <span className="flex-1" style={{ opacity: 0.6 }}>{belowLabel}</span>
            <span className="font-medium tabular-nums" style={{ fontFamily: DISPLAY, opacity: cur ? 1 : 0, transition: 'opacity .2s' }}>{cur?.below !== undefined ? cur.below.toLocaleString('en-US') : ''}</span>
          </span>
        ) : null}
      </div>

      {/* For screen readers: the numbers as a list */}
      <ul className="sr-only">
        {bars.map((b, i) => <li key={i}>{b.label}: {totals[i]} {unit}{b.below !== undefined ? `, ${b.below} ${belowLabel.toLowerCase()}` : ''}</li>)}
      </ul>
    </div>
  )
}
