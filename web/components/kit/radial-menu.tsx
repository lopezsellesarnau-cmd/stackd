'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Bot } from './bot'

/**
 * Radial menu · StackD Kit
 * A round menu that is always there, cut like a citrus: thick segments with
 * soft corners around a hollow middle where the Bot sits. Each segment is a
 * rind with a small pill of flesh inside. Point at a segment (or press it) and
 * the pill swells until it fills the whole segment, on a loose spring, like
 * jelly; move away and it shrinks back. A press lands with a squash and a
 * wobble and nudges the neighbours; nothing stays filled.
 *
 * A segment with more inside expands and the ring turns into that section:
 * the others sink, the new segments pop out of the Bot one after another.
 * Press the Bot to go back. Press and slide around the ring to scrub; let go
 * to choose. Keyboard: the arrows go round, Enter chooses, Escape goes back.
 * React + Tailwind, no other dependencies.
 */

export type RadialItem = {
  id: string
  label: string
  /** A number shown big in the segment (unread, items…). */
  count?: number
  /** Shown when there is no count, in a 24-unit box: a path drawn as a line, or filled shapes with lines cut out of them. */
  icon?: string | RadialIcon
  children?: RadialItem[]
}

/** A filled icon: `fill` is filled, `cut` is cut out of it as lines, `line` is drawn as a line on top. */
export type RadialIcon = { fill?: string; cut?: string; line?: string }

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'

type Props = {
  items: RadialItem[]
  /** Called with the item chosen and the path to it. */
  onSelect?: (item: RadialItem, path: RadialItem[]) => void
  theme?: 'dark' | 'light'
  /** Diameter, px. */
  size?: number
  bot?: boolean
  className?: string
}

const TAU = Math.PI * 2
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mid = (i: number, n: number) => -Math.PI / 2 + (i * TAU) / n
const sliceAt = (dx: number, dy: number, n: number) => {
  const a = Math.atan2(dy, dx) + Math.PI / 2 + Math.PI / n
  return Math.floor((((a % TAU) + TAU) % TAU) / (TAU / n)) % n
}

/* How full the flesh is, 0 (none) to 1 (up to the rim) */
const FLESH = { rest: 0.4, full: 1 }
/* On touch there is no hover: after a tap the segment stays full this long, then empties */
const HOLD_MS = 550

const THEMES = {
  dark: { rind: '#3B3A36', flesh: '#E7E2DB', text: '#B8B3AB', textOn: '#141310', ink: '#F2F0EC', eye: '#141310' },
  light: { rind: '#EEECE8', flesh: '#D9D4CC', text: '#8C877F', textOn: '#141310', ink: '#141310', eye: '#FFFFFF' },
}

/* A thick segment with soft corners: from r0 to r1, between angles a0 and a1,
   with straight, parallel gaps between neighbours */
function segment(r0: number, r1: number, a0: number, a1: number, gap: number, cr: number, ci: number) {
  const h = gap / 2
  const d = (r: number) => Math.asin(clamp(h / r, 0, 0.99))
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
  const s = (r: number) => a0 + d(r) // on the start edge
  const e = (r: number) => a1 - d(r) // on the end edge
  const span1 = a1 - a0 - 2 * d(r1), span0 = a1 - a0 - 2 * d(r0)
  const co = Math.max(0.5, Math.min(cr, (r1 - r0) * 0.42, r1 * span1 * 0.42))
  const cin = Math.max(0.5, Math.min(ci, (r1 - r0) * 0.3, r0 * span0 * 0.42))
  const big1 = span1 - (2 * co) / r1 > Math.PI ? 1 : 0
  return [
    `M${p(r0 + cin, s(r0 + cin))}`,
    `L${p(r1 - co, s(r1 - co))}`,
    `Q${p(r1, s(r1))} ${p(r1, s(r1) + co / r1)}`,
    `A${r1} ${r1} 0 ${big1} 1 ${p(r1, e(r1) - co / r1)}`,
    `Q${p(r1, e(r1))} ${p(r1 - co, e(r1 - co))}`,
    `L${p(r0 + cin, e(r0 + cin))}`,
    `Q${p(r0, e(r0))} ${p(r0, e(r0) - cin / r0)}`,
    `A${r0} ${r0} 0 0 0 ${p(r0, s(r0) + cin / r0)}`,
    `Q${p(r0, s(r0))} ${p(r0 + cin, s(r0 + cin))}`,
    'Z',
  ].join('')
}

/* One spring: x chases `to`. Loose, like the Hilo toast: it overshoots and wobbles. */
type Spring = { x: number; v: number; to: number }
const spring = (x: number): Spring => ({ x, v: 0, to: x })
function stepSpring(s: Spring, dt: number, k: number, c: number) {
  s.v += (-k * (s.x - s.to) - c * s.v) * dt
  s.x += s.v * dt
}
const settled = (s: Spring) => Math.abs(s.x - s.to) < 0.0005 && Math.abs(s.v) < 0.001

type Seg = {
  item: RadialItem
  grow: Spring // appearing, 0 to 1
  flesh: Spring
  bulge: Spring // px out from the middle
  squash: Spring // 1 = round; under 1 squashed along the radius and wider across
  sway: Spring // radians, a nudge round the ring
  wait: number // s before it starts to appear
}

export function RadialMenu({
  items,
  onSelect,
  theme = 'dark',
  size = 320,
  bot = true,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const R = size / 2 - 10 // room for the bulge
  const R0 = Math.round(R * 0.25) // the hollow middle
  const GAP = Math.max(4, size / 64)
  const LABEL_R = R0 + (R - R0) * 0.68

  const [stack, setStack] = useState<RadialItem[][]>([items])
  const [path, setPath] = useState<RadialItem[]>([])
  const [held, setHeld] = useState(-1) // just pressed: stays full a moment
  const [hover, setHover] = useState(-1)
  const [focus, setFocus] = useState(-1)
  const [glad, setGlad] = useState(false)
  const level = stack[stack.length - 1]
  const uid = useId().replace(/:/g, '')

  const svg = useRef<SVGSVGElement>(null)
  const groups = useRef<(SVGGElement | null)[]>([])
  const fleshes = useRef<(SVGPathElement | null)[]>([])
  const labels = useRef<(SVGGElement | null)[]>([])
  const segs = useRef<Seg[]>([])
  const raf = useRef(0)
  const press = useRef({ i: -1, id: -1, leaving: false })
  const live = useRef({ hover, held, focus })
  live.current = { hover, held, focus }
  const reduce = useRef(false)

  const draw = useCallback(() => {
    const n = segs.current.length
    segs.current.forEach((s, i) => {
      const g = groups.current[i], f = fleshes.current[i], l = labels.current[i]
      if (!g || !f) return
      const a = mid(i, n) + s.sway.x
      const deg = (a * 180) / Math.PI
      const k = Math.max(0, s.grow.x)
      const cx = Math.cos(a) * LABEL_R * 0.8, cy = Math.sin(a) * LABEL_R * 0.8
      const sq = s.squash.x
      // grow out of the middle, bulge along the radius, squash about the segment's own middle keeping its volume
      g.setAttribute('transform',
        `rotate(${(s.sway.x * 180) / Math.PI}) scale(${k}) translate(${Math.cos(a) * s.bulge.x} ${Math.sin(a) * s.bulge.x}) ` +
        `translate(${cx} ${cy}) rotate(${deg}) scale(${sq} ${2 - sq}) rotate(${-deg}) translate(${-cx} ${-cy})`)
      g.style.opacity = String(clamp(k * 1.6, 0, 1))
      const a0 = mid(i, n) - Math.PI / n, a1 = mid(i, n) + Math.PI / n
      const rf = R0 + (R - R0) * clamp(s.flesh.x, 0.08, 1)
      f.setAttribute('d', segment(R0, rf, a0, a1, GAP, 15, 7))
      // the label reads on the rind until the flesh rises past it
      if (l) l.style.color = rf > LABEL_R + 12 ? c.textOn : c.text
    })
  }, [R, R0, GAP, LABEL_R, c])

  const run = useCallback(() => {
    if (raf.current) return
    let prev = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.033, (t - prev) / 1000)
      prev = t
      const { hover: h, held: hd, focus: fo } = live.current
      let busy = false
      segs.current.forEach((s, i) => {
        const pressed = press.current.i === i
        if (!press.current.leaving) {
          s.flesh.to = pressed || h === i || fo === i || hd === i ? FLESH.full : FLESH.rest
          s.bulge.to = pressed ? 0 : h === i || fo === i ? 2 : 0
          s.squash.to = pressed ? 0.9 : 1
        }
        if (s.wait > 0) { s.wait -= dt; busy = true; return }
        // small steps, so the loose spring stays steady
        for (let k = 0; k < 4; k++) {
          const q = dt / 4
          stepSpring(s.grow, q, 230, 15)
          stepSpring(s.flesh, q, 260, 11)
          stepSpring(s.bulge, q, 260, 10)
          stepSpring(s.squash, q, 260, 8) // the Hilo toast's squash spring
          stepSpring(s.sway, q, 200, 9)
        }
        if (![s.grow, s.flesh, s.bulge, s.squash, s.sway].every(settled)) busy = true
      })
      draw()
      raf.current = busy ? requestAnimationFrame(tick) : 0
    }
    raf.current = requestAnimationFrame(tick)
  }, [draw])

  // A new ring: its segments start hidden and pop out of the middle one after another
  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    segs.current = level.map((item, i) => ({
      item,
      grow: { x: reduce.current ? 1 : 0, v: 0, to: 1 },
      flesh: spring(FLESH.rest),
      bulge: spring(0),
      squash: spring(1),
      sway: spring(0),
      wait: reduce.current ? 0 : i * 0.035,
    }))
    press.current.leaving = false
    draw()
    run()
  }, [level, draw, run])

  useEffect(() => { run() }, [hover, held, focus, run])
  // reset the handle too: React's dev double mount would otherwise leave the loop thinking it still runs
  useEffect(() => () => { cancelAnimationFrame(raf.current); raf.current = 0 }, [])

  // Which segment is under a point: -2 for the middle, -1 for nothing
  const hit = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect()
    const k = size / r.width
    const dx = (e.clientX - r.left - r.width / 2) * k, dy = (e.clientY - r.top - r.height / 2) * k
    const d = Math.hypot(dx, dy)
    if (d < R0) return -2
    if (d > R + 12) return -1
    return sliceAt(dx, dy, level.length)
  }

  // Leave this ring: the chosen one swells, the others sink, then the next ring pops out
  const change = (next: RadialItem[][], nextPath: RadialItem[], keep: number) => {
    press.current.leaving = true
    segs.current.forEach((s, i) => {
      s.wait = 0
      if (i === keep) { s.flesh.to = 1; s.bulge.to = 10; s.squash.v -= 2.5 }
      else s.grow.to = 0
    })
    run()
    window.setTimeout(() => { segs.current.forEach((s) => { s.grow.to = 0 }); run() }, reduce.current ? 0 : 170)
    window.setTimeout(() => { setHover(-1); setFocus(-1); setPath(nextPath); setStack(next) }, reduce.current ? 0 : 300)
  }

  const choose = (i: number) => {
    const item = level[i]
    if (!item || press.current.leaving) return
    if (item.children?.length) return change([...stack, item.children], [...path, item], i)
    setHeld(i)
    window.setTimeout(() => setHeld((h) => (h === i ? -1 : h)), HOLD_MS)
    const s = segs.current[i], n = segs.current.length
    // land like jelly: squashed flat, then wobbling back; the neighbours get nudged aside
    s.squash.x = 0.8; s.squash.v = 0
    if (n > 1) {
      segs.current[(i + 1) % n].sway.v += 0.9
      segs.current[(i - 1 + n) % n].sway.v -= 0.9
    }
    setGlad(true)
    window.setTimeout(() => setGlad(false), 900)
    onSelect?.(item, [...path, item])
    run()
  }

  const back = () => {
    if (stack.length < 2 || press.current.leaving) return
    change(stack.slice(0, -1), path.slice(0, -1), -1)
  }

  const onDown = (e: React.PointerEvent) => {
    const i = hit(e)
    if (i === -1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current.i = i
    press.current.id = e.pointerId
    if (i >= 0) segs.current[i].squash.v -= 1.5
    run()
  }
  const onMove = (e: React.PointerEvent) => {
    const i = hit(e)
    if (press.current.id === e.pointerId && press.current.i !== -1) {
      // pressing and sliding round the ring scrubs from segment to segment
      if (i >= 0 && i !== press.current.i) { press.current.i = i; segs.current[i].squash.v -= 1.5; run() }
      return
    }
    if (e.pointerType === 'mouse') setHover(i >= 0 ? i : -1)
  }
  const onUp = (e: React.PointerEvent) => {
    if (press.current.id !== e.pointerId) return
    const was = press.current.i
    press.current.i = -1
    press.current.id = -1
    const i = hit(e)
    if (was === -2 && i === -2) back()
    else if (i >= 0) choose(i)
    run()
  }

  const onKey = (e: React.KeyboardEvent) => {
    const n = level.length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => (f + 1 + n) % n) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => (f < 0 ? n - 1 : (f - 1 + n) % n)) }
    else if ((e.key === 'Enter' || e.key === ' ') && focus >= 0) { e.preventDefault(); choose(focus) }
    else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); back() }
  }

  // The Bot looks at the segment you point at, else the chosen one
  const n = level.length
  const at = hover >= 0 ? hover : focus >= 0 ? focus : held
  const look = at >= 0 ? { x: Math.cos(mid(at, n)) * 0.9, y: Math.sin(mid(at, n)) * 0.9 } : { x: 0, y: 0 }

  return (
    <div
      tabIndex={0}
      role="menu"
      aria-label={path.length ? path.map((p) => p.label).join(', ') : 'Menu'}
      aria-activedescendant={focus >= 0 ? `rm-${level[focus]?.id}` : undefined}
      className={`relative touch-none select-none rounded-full outline-none ${className}`}
      style={{ width: size, height: size }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={() => setHover(-1)}
      onPointerCancel={() => { press.current.i = -1; press.current.id = -1; run() }}
      onKeyDown={onKey}
      onBlur={() => setFocus(-1)}
    >
      <svg ref={svg} width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} className="block overflow-visible">
        {level.map((it, i) => {
          const a = mid(i, n), a0 = a - Math.PI / n, a1 = a + Math.PI / n
          const lx = Math.cos(a) * LABEL_R, ly = Math.sin(a) * LABEL_R
          const big = size / 13
          return (
            <g
              key={`${stack.length}-${it.id}`}
              id={`rm-${it.id}`}
              role="menuitem"
              aria-haspopup={it.children?.length ? 'menu' : undefined}
              aria-label={it.count != null ? `${it.label}, ${it.count}` : it.label}
              ref={(el) => { groups.current[i] = el }}
              style={{ opacity: 0, cursor: 'pointer' }}
            >
              <path d={segment(R0, R, a0, a1, GAP, 16, 7)} fill={c.rind} />
              <path ref={(el) => { fleshes.current[i] = el }} fill={c.flesh} />
              {focus === i ? <path d={segment(R0 - 3, R + 3, a0, a1, Math.max(0, GAP - 6), 18, 8)} fill="none" stroke="#BE9344" strokeWidth={2} /> : null}
              <g ref={(el) => { labels.current[i] = el }} style={{ color: c.text, transition: 'color 140ms ease' }} transform={`translate(${lx} ${ly})`}>
                {it.count != null ? (
                  <text y={-3} textAnchor="middle" fill="currentColor" fontSize={big} fontWeight={600} fontFamily={FONT} style={{ fontVariantNumeric: 'tabular-nums' }}>{it.count}</text>
                ) : it.icon ? (
                  <g transform={`translate(-11 ${-big * 1.02}) scale(${22 / 24})`}>
                    <Icon icon={it.icon} id={`${uid}-${stack.length}-${i}`} />
                  </g>
                ) : null}
                <text y={size / 24} textAnchor="middle" fill="currentColor" fontSize={Math.max(10, size / 27)} fontWeight={500} fontFamily={FONT}>
                  {it.label}{it.children?.length ? ' ›' : ''}
                </text>
              </g>
            </g>
          )
        })}
      </svg>

      {/* The middle: the Bot, small, with room around it. Press it to go back a ring. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        {bot ? <Bot size={R0 * 0.9} color={c.ink} eyeColor={c.eye} look={look} happy={glad} poke={false} /> : null}
      </div>
    </div>
  )
}

/* An icon in a 24-unit box, in the current colour. Filled shapes get their lines cut out with a mask. */
function Icon({ icon, id }: { icon: string | RadialIcon; id: string }) {
  const ic = typeof icon === 'string' ? { line: icon } : icon
  return (
    <>
      {ic.fill ? (
        <>
          {ic.cut ? (
            <mask id={id} maskUnits="userSpaceOnUse" x={-2} y={-2} width={28} height={28}>
              <path d={ic.fill} fill="#fff" />
              <path d={ic.cut} fill="none" stroke="#000" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          ) : null}
          <path d={ic.fill} fill="currentColor" mask={ic.cut ? `url(#${id})` : undefined} />
        </>
      ) : null}
      {ic.line ? <path d={ic.line} fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </>
  )
}
