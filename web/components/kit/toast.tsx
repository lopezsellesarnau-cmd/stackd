'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Bot } from './bot'

/**
 * Toast · StackD Kit 23
 * Every toast is the Bot. It drops in as a drop of ink, lands with a squash and unrolls into a pill
 * with your message. Saved: it turns Olive and smiles. Failed: Wine, its lids droop and the pill
 * shakes once. Loading: it turns round until your promise settles, then becomes the answer.
 * Older toasts roll back into small drops beside the newest; hover them and they fan out into a
 * list, and the timers wait while you read. Leaving, the pill rolls back into the drop and it falls.
 *
 *   <Toaster />                       once, anywhere
 *   toast('Link copied')              from anywhere
 *   toast.success('Saved'), toast.error('Couldn't save', { description: 'Try again' })
 *   toast('Moved to bin', { action: { label: 'Undo', onClick: restore } })
 *   toast.promise(save(), { loading: 'Saving', success: 'Saved', error: 'Couldn't save' })
 *
 * React + Tailwind and the StackD Bot, no other dependencies. Respects reduced motion.
 */

export type ToastKind = 'info' | 'success' | 'error' | 'loading'
type Action = { label: string; onClick: () => void }
type Options = { description?: string; action?: Action; duration?: number; /** Which <Toaster id> shows it, when you have more than one */ toaster?: string }
type Item = { id: number; kind: ToastKind; title: string; description?: string; action?: Action; duration: number; leaving: boolean; toaster?: string }

// ── The store: plain module state, so toast() works from anywhere ──
let items: Item[] = []
let next = 1
const subs = new Set<() => void>()
const emit = () => { items = [...items]; subs.forEach((f) => f()) }
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
const snapshot = () => items

function add(kind: ToastKind, title: string, o: Options = {}) {
  const id = next++
  items.push({ id, kind, title, description: o.description, action: o.action, duration: o.duration ?? (o.action ? 6000 : 4000), leaving: false, toaster: o.toaster })
  emit()
  return id
}
function update(id: number, patch: Partial<Item>) {
  const i = items.findIndex((t) => t.id === id)
  if (i < 0) return
  items[i] = { ...items[i], ...patch }
  emit()
}
function dismiss(id?: number) {
  items = items.map((t) => (id === undefined || t.id === id ? { ...t, leaving: true } : t))
  emit()
}
const remove = (id: number) => { items = items.filter((t) => t.id !== id); emit() }

export const toast = Object.assign((title: string, o?: Options) => add('info', title, o), {
  success: (title: string, o?: Options) => add('success', title, o),
  error: (title: string, o?: Options) => add('error', title, o),
  loading: (title: string, o?: Options) => add('loading', title, o),
  dismiss,
  /** Shows `loading` until the promise settles, then turns into `success` or `error`. */
  promise<T>(p: Promise<T>, m: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string); toaster?: string }) {
    const id = add('loading', m.loading, { toaster: m.toaster })
    p.then(
      (v) => update(id, { kind: 'success', title: typeof m.success === 'function' ? m.success(v) : m.success, duration: 4000 }),
      (e) => update(id, { kind: 'error', title: typeof m.error === 'function' ? m.error(e) : m.error, duration: 5000 }),
    )
    return p
  },
})

// ── Look ──
const INK = '#141310', OLIVE = '#6C8544', WINE = '#901919'
const H = 56, HEAD = 44, PAD = (H - HEAD) / 2
const DROP = 0.46 // how small an older toast's drop is
const calm = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The Bot turning round, for loading */
function Turning(props: React.ComponentProps<typeof Bot>) {
  const [deg, setDeg] = useState(0)
  useEffect(() => {
    if (calm()) return
    let raf = 0
    const t0 = performance.now()
    const f = (now: number) => {
      const u = ((now - t0) / 1100) % 1
      setDeg(360 * (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2))
      raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <Bot {...props} turn={deg} />
}

type Phase = 'drop' | 'open' | 'away'

function ToastView({
  t, place, front, dark, paused, top, onSize, onHover,
}: {
  t: Item
  place: { x: number; y: number; small: boolean }
  front: boolean
  dark: boolean
  paused: boolean
  top: boolean
  onSize: (id: number, w: number) => void
  onHover: (on: boolean) => void
}) {
  const [phase, setPhase] = useState<Phase>(calm() ? 'open' : 'drop')
  const [w, setW] = useState(H)
  const [shake, setShake] = useState(0)
  const [hover, setHover] = useState(false)
  const row = useRef<HTMLDivElement>(null)

  // Land, then unroll
  useEffect(() => {
    if (phase !== 'drop') return
    const id = setTimeout(() => setPhase('open'), 420)
    return () => clearTimeout(id)
  }, [phase])

  // The pill's width follows its content (and changes when a promise settles)
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const width = Math.ceil(el.scrollWidth) + HEAD + PAD + 18
    setW(width)
    onSize(t.id, width)
  }, [t.title, t.description, t.action, t.id, onSize])

  // Failed: one shake
  useEffect(() => { if (t.kind === 'error') setShake((n) => n + 1) }, [t.kind])

  // The timer, paused while hovered; loading never times out
  const left = useRef(t.duration)
  useEffect(() => { left.current = t.duration }, [t.duration, t.kind])
  useEffect(() => {
    if (t.leaving || paused || t.kind === 'loading' || phase === 'drop') return
    const start = performance.now()
    const id = setTimeout(() => dismiss(t.id), left.current)
    return () => { clearTimeout(id); left.current -= performance.now() - start }
  }, [paused, t.leaving, t.kind, t.id, phase])

  // Leaving: roll back into the drop, then fall
  useEffect(() => {
    if (!t.leaving) return
    if (calm()) { const id = setTimeout(() => remove(t.id), 150); return () => clearTimeout(id) }
    setPhase('away')
    const id = setTimeout(() => remove(t.id), 700)
    return () => clearTimeout(id)
  }, [t.leaving, t.id])

  const open = phase === 'open' && !place.small && !t.leaving
  const body = t.kind === 'success' ? OLIVE : t.kind === 'error' ? WINE : dark ? '#FFFFFF' : INK
  const eye = t.kind === 'success' || t.kind === 'error' ? '#FFFFFF' : dark ? INK : '#FFFFFF'
  const sheet = dark ? INK : '#FFFFFF'
  const fg = dark ? '#FFFFFF' : INK
  const face = {
    size: HEAD, shape: 'circle' as const, eyes: 'tall' as const, color: body, eyeColor: eye,
    // Reading its own message, or watching the action; on hover it watches you
    look: hover ? undefined : t.action ? { x: 0.85, y: 0.1 } : { x: 0.5, y: 0.05 },
    follow: hover ? 0.8 : 0,
    happy: t.kind === 'success' && !t.leaving,
    mood: t.kind === 'error' ? -0.7 : 0,
  }
  const width = open ? w : H
  const gone = phase === 'away' && t.leaving
  const s = place.small ? DROP : 1
  const fall = top ? -50 : 50

  return (
    <div
      role={t.kind === 'error' ? 'alert' : 'status'}
      aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-auto absolute left-0"
      style={{
        [top ? 'top' : 'bottom']: 0,
        transform: `translate(${place.x}px, ${place.y + (gone ? fall : 0)}px) scale(${gone ? 0.3 : s})`,
        transformOrigin: `${H / 2}px 50%`,
        opacity: gone ? 0 : 1,
        transition: calm() ? 'opacity .15s' : `transform ${gone ? '.45s cubic-bezier(.5,0,.8,.4) .2s' : '.55s cubic-bezier(.3,1.3,.5,1)'}, opacity .3s ${gone ? '.3s' : '0s'}`,
        zIndex: front ? 2 : 1,
      }}
      onMouseEnter={() => { setHover(true); onHover(true) }}
      onMouseLeave={() => { setHover(false); onHover(false) }}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      <div
        key={shake}
        className="relative overflow-hidden"
        style={{
          width,
          height: H,
          borderRadius: H / 2,
          background: open ? sheet : 'transparent',
          boxShadow: open ? (dark ? '0 16px 36px rgba(0,0,0,.35)' : '0 14px 34px rgba(20,19,16,.13), 0 0 0 1px rgba(20,19,16,.05)') : 'none',
          transition: calm() ? 'none' : `width ${open ? '.6s cubic-bezier(.3,1.25,.5,1)' : '.32s cubic-bezier(.5,0,.5,1)'}, background-color .25s, box-shadow .3s`,
          animation: calm() ? undefined : phase === 'drop' ? `toast-land${top ? '-top' : ''} .42s cubic-bezier(.3,1,.5,1) both` : shake && t.kind === 'error' ? 'toast-shake .45s ease-in-out' : undefined,
        }}
      >
        {/* The Bot: the head of the pill */}
        <div className="absolute" style={{ left: PAD, top: PAD, width: HEAD, height: HEAD }}>
          {t.kind === 'loading' ? <Turning {...face} look={{ x: 0, y: 0 }} follow={0} /> : <Bot {...face} />}
        </div>

        {/* The message, and the action */}
        <div
          ref={row}
          className="absolute top-0 flex h-full items-center gap-3 whitespace-nowrap"
          style={{ left: HEAD + PAD + 10, color: fg, opacity: open ? 1 : 0, transform: open ? 'none' : 'translateX(-8px)', transition: `opacity ${open ? '.3s .18s' : '.12s'}, transform .4s ${open ? '.15s' : '0s'}` }}
        >
          <div className="leading-tight">
            <p className="text-[14px] font-medium">{t.title}</p>
            {t.description ? <p className="text-[12.5px]" style={{ opacity: 0.55 }}>{t.description}</p> : null}
          </div>
          {t.action ? (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => { t.action!.onClick(); dismiss(t.id) }}
              className="h-8 rounded-full px-3.5 text-[13px] font-medium"
              style={{ background: dark ? 'rgba(255,255,255,.12)' : 'rgba(20,19,16,.06)' }}
            >
              {t.action.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type Props = {
  /** Where they appear. Default "bottom" (centred). */
  position?: 'bottom' | 'top'
  /** "light": white pills, ink Bot (default). "dark": the other way round. */
  theme?: 'light' | 'dark'
  /** How many stay on screen; older ones are dismissed. Default 4. */
  max?: number
  /** Shows only the toasts sent with this `toaster` name. */
  id?: string
  /** Inside the nearest positioned parent instead of the window. */
  contained?: boolean
  className?: string
}

export function Toaster({ position = 'bottom', theme = 'light', max = 4, id, contained = false, className = '' }: Props) {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot)
  const list = all.filter((t) => t.toaster === id)
  const [sizes, setSizes] = useState<Record<number, number>>({})
  const [hover, setHover] = useState(false)
  const leave = useRef(0)
  const onSize = useRef((id: number, w: number) => setSizes((s) => (s[id] === w ? s : { ...s, [id]: w }))).current
  const onHover = (on: boolean) => {
    clearTimeout(leave.current)
    if (on) setHover(true)
    else leave.current = window.setTimeout(() => setHover(false), 160) // gaps between toasts don't count
  }
  const top = position === 'top'

  // Too many: the oldest goes
  useEffect(() => {
    const alive = list.filter((t) => !t.leaving)
    if (alive.length > max) alive.slice(0, alive.length - max).forEach((t) => dismiss(t.id))
  }, [list, max])
  // Nothing left to hover
  useEffect(() => { if (!list.length) setHover(false) }, [list.length])

  // Newest first. Folded: the newest is a pill, the rest drops in a row beside it. Hovered: a list.
  const order = [...list].reverse()
  const alive = order.filter((t) => !t.leaving)
  const frontW = sizes[alive[0]?.id] ?? H
  const place = (t: Item) => {
    const i = alive.indexOf(t)
    const w = sizes[t.id] ?? H
    if (i < 0) return { x: -w / 2, y: 0, small: false } // leaving: falls from where it is
    if (hover) return { x: -w / 2, y: (top ? 1 : -1) * i * (H + 10), small: false }
    if (i === 0) return { x: -frontW / 2, y: 0, small: false }
    return { x: frontW / 2 + 8 + (i - 1) * (H * DROP + 6), y: 0, small: true }
  }

  return (
    <div
      className={`pointer-events-none ${contained ? 'absolute' : 'fixed'} left-1/2 z-50 ${className}`}
      style={{ [top ? 'top' : 'bottom']: 24, width: 0, height: H }}
      aria-label="Notifications"
    >
      {order.map((t) => (
        <ToastView key={t.id} t={t} place={place(t)} front={t === alive[0]} dark={theme === 'dark'} paused={hover} top={top} onSize={onSize} onHover={onHover} />
      ))}
      <style>{`
        @keyframes toast-land{0%{transform:translateY(70px) scale(.55,1.35);opacity:0}45%{opacity:1}70%{transform:translateY(-3px) scale(1.16,.84)}100%{transform:none}}
        @keyframes toast-land-top{0%{transform:translateY(-70px) scale(.55,1.35);opacity:0}45%{opacity:1}70%{transform:translateY(3px) scale(1.16,.84)}100%{transform:none}}
        @keyframes toast-shake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
      `}</style>
    </div>
  )
}

