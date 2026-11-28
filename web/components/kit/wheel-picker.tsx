'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Wheel picker: the options sit on a vertical cylinder you spin.
 * At rest only the chosen one shows; the top and bottom fade away. Start spinning and the
 * neighbours come out of the dark, curving back on the wheel. Let go and it carries on with
 * your flick, then lands on an option with a soft overshoot.
 */

export type WheelItem = { id: string; label: string; icon?: ReactNode }

type Props = {
  items: WheelItem[]
  /** The chosen id (controlled). */
  value?: string
  defaultValue?: string
  /** Called when the wheel settles on a new option. */
  onChange?: (item: WheelItem, index: number) => void
  /** Called each time an option passes the middle (for a haptic tick). */
  onTick?: (item: WheelItem) => void
  /** One row, in px. Default 56, or 132 when the items have icons. */
  itemHeight?: number
  /** Height of the wheel, in rows. Default 3.4. */
  rows?: number
  width?: number | string
  /** Spin round and round (hours, minutes) instead of stopping at the ends. */
  loop?: boolean
  theme?: 'light' | 'dark'
  /** Read out by screen readers. */
  label?: string
  className?: string
  /** Hold the neighbours visible, 0 to 1, as if it were spinning: for covers and mock-ups. */
  reveal?: number
}

const STEP = 22 // degrees between two options on the wheel
const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mod = (v: number, n: number) => ((v % n) + n) % n

export function WheelPicker({ items, value, defaultValue, onChange, onTick, itemHeight, rows = 3.4, width = 220, loop = false, theme = 'light', label = 'Choose', className = '', reveal = 0 }: Props) {
  const n = items.length
  const icons = items.some((it) => it.icon)
  const h = itemHeight ?? (icons ? 132 : 56)
  const H = Math.round(h * rows)
  const R = h / ((STEP * Math.PI) / 180) // radius so neighbours sit one row apart
  const ink = theme === 'dark' ? '#F2F0EC' : '#141310'

  const indexOf = (id?: string) => Math.max(0, items.findIndex((it) => it.id === id))
  const [index, setIndex] = useState(() => indexOf(value ?? defaultValue))

  const box = useRef<HTMLDivElement>(null)
  const rowsEl = useRef<(HTMLDivElement | null)[]>([])
  const s = useRef({ p: index, v: 0, target: index, drag: false, reveal: 0, last: index, raf: 0, startY: 0, startP: 0, moved: 0, samples: [] as { t: number; p: number }[], acc: 0, wheelT: 0 })
  const held = useRef(reveal)
  held.current = clamp(reveal, 0, 1)
  const props = useRef({ items, onChange, onTick, loop, n })
  props.current = { items, onChange, onTick, loop, n }

  // shortest way from the wheel's position to row i
  const dist = useCallback((i: number, p: number) => {
    if (!loop) return i - p
    const d = mod(i - p, n)
    return d > n / 2 ? d - n : d
  }, [loop, n])

  const paint = useCallback(() => {
    const st = s.current
    const stretch = 1 + clamp(Math.abs(st.v) * 0.012, 0, 0.08) // jelly: the rows stretch a little along a fast spin
    rowsEl.current.forEach((el, i) => {
      if (!el) return
      const d = dist(i, st.p)
      const a = d * STEP
      if (Math.abs(a) >= 88) { el.style.visibility = 'hidden'; return }
      const near = Math.max(0, 1 - Math.abs(d)) // 1 in the middle
      const o = near + (1 - near) * Math.max(st.reveal, held.current) * Math.max(0, 0.72 - Math.abs(d) * 0.16)
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      el.style.opacity = String(o)
      el.style.transform = `translate(-50%, -50%) translateZ(${-R}px) rotateX(${-a}deg) translateZ(${R}px) scale(${1 / Math.sqrt(stretch)}, ${stretch})`
    })
  }, [R, dist])

  const settle = useCallback((i: number) => {
    const { items, onChange, n } = props.current
    const k = mod(i, n)
    setIndex((prev) => {
      if (prev !== k) onChange?.(items[k], k)
      return k
    })
  }, [])

  // one loop runs while anything moves, then stops
  const run = useCallback(() => {
    const st = s.current
    if (st.raf) return
    let t0 = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - t0) / 1000)
      t0 = now
      if (!st.drag) {
        // spring to the target: soft, so it overshoots a touch and settles (spongy)
        const k = 150, c = 17
        const acc = -k * (st.p - st.target) - c * st.v
        st.v += acc * dt
        st.p += st.v * dt
      }
      const moving = st.drag || Math.abs(st.v) > 0.25 || Math.abs(st.p - st.target) > 0.06
      st.reveal += ((moving ? 1 : 0) - st.reveal) * (moving ? 0.22 : 0.07)
      // tick as each option crosses the middle
      const mid = Math.round(st.p)
      if (mid !== st.last) {
        st.last = mid
        const { items, onTick, n, loop } = props.current
        if (loop || (mid >= 0 && mid < n)) {
          onTick?.(items[mod(mid, n)])
          if ('vibrate' in navigator) try { navigator.vibrate(4) } catch { /* not allowed */ }
        }
      }
      paint()
      if (!st.drag && Math.abs(st.v) < 0.01 && Math.abs(st.p - st.target) < 0.002 && st.reveal < 0.01) {
        st.p = st.target
        st.v = 0
        st.reveal = 0
        paint()
        st.raf = 0
        return
      }
      st.raf = requestAnimationFrame(frame)
    }
    st.raf = requestAnimationFrame(frame)
  }, [paint])

  const goTo = useCallback((i: number) => {
    const st = s.current
    const { n, loop } = props.current
    st.target = loop ? i : clamp(i, 0, n - 1)
    settle(st.target)
    run()
  }, [run, settle])

  useEffect(() => { paint() }, [paint])
  useEffect(() => () => cancelAnimationFrame(s.current.raf), [])

  // controlled: follow the value from outside
  useEffect(() => {
    if (value === undefined) return
    const i = indexOf(value)
    const st = s.current
    if (mod(st.target, n) !== i) {
      st.target = st.target + dist(i, mod(st.target, n))
      setIndex(i)
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // pointer: the wheel follows the finger 1:1, then carries the flick
  const scale = () => { const r = box.current!.getBoundingClientRect(); return { k: H / r.height, top: r.top } }
  const onDown = (e: React.PointerEvent) => {
    const st = s.current
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    st.drag = true
    st.startY = e.clientY
    st.startP = st.p
    st.moved = 0
    st.v = 0
    st.samples = [{ t: performance.now(), p: st.p }]
    run()
  }
  const onMove = (e: React.PointerEvent) => {
    const st = s.current
    if (!st.drag) return
    const { k } = scale()
    const dy = (e.clientY - st.startY) * k
    st.moved = Math.max(st.moved, Math.abs(dy))
    let p = st.startP - dy / h
    if (!loop) {
      // rubber band past the ends
      const band = (x: number) => 0.5 * (1 - 1 / (1 + x)) // never more than half a row
      if (p < 0) p = -band(-p)
      if (p > n - 1) p = n - 1 + band(p - n + 1)
    }
    st.p = p
    const now = performance.now()
    st.samples.push({ t: now, p })
    while (st.samples.length > 2 && now - st.samples[0].t > 90) st.samples.shift()
  }
  const onUp = (e: React.PointerEvent) => {
    const st = s.current
    if (!st.drag) return
    st.drag = false
    if (st.moved < 4) {
      // a tap above or below the middle moves one way
      const { k, top } = scale()
      const off = ((e.clientY - top) * k - H / 2) / h
      st.v = 0
      goTo(Math.abs(off) > 0.5 ? Math.round(st.p + off) : Math.round(st.p))
      return
    }
    const a = st.samples[0], b = st.samples[st.samples.length - 1]
    const v = b.t > a.t ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0
    st.v = clamp(v, -40, 40)
    // where the flick would coast to, then the spring takes it there
    goTo(Math.round(st.p + st.v * 0.16))
  }

  // mouse wheel and trackpad
  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const st = s.current
      st.acc += e.deltaY / h
      const steps = Math.trunc(st.acc / 0.6)
      if (steps) {
        st.acc -= steps * 0.6
        goTo(st.target + steps)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [goTo, h])

  const onKey = (e: React.KeyboardEvent) => {
    const t = s.current.target
    const map: Record<string, number> = { ArrowUp: t - 1, ArrowDown: t + 1, PageUp: t - 5, PageDown: t + 5, Home: 0, End: n - 1 }
    if (!(e.key in map)) return
    e.preventDefault()
    goTo(map[e.key])
  }

  const current = items[index]
  return (
    <div
      ref={box}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuetext={current?.label}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`relative cursor-grab touch-none select-none overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344] active:cursor-grabbing ${className}`}
      style={{
        width,
        height: H,
        perspective: R * 3.2,
        fontFamily: FONT,
        color: ink,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.id}
          ref={(el) => { rowsEl.current[i] = el }}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 flex w-full flex-col items-center justify-center"
          style={{ height: h, backfaceVisibility: 'hidden', willChange: 'transform, opacity' }}
        >
          {it.icon ? (
            <>
              <div className="flex items-center justify-center" style={{ height: h * 0.62 }}>{it.icon}</div>
              <span className="mt-1 text-[13px] font-medium opacity-55">{it.label}</span>
            </>
          ) : (
            <span className="text-[24px] font-medium tabular-nums tracking-[-0.01em]">{it.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}
