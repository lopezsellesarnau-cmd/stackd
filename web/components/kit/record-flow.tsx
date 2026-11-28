'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Record flow · StackD Kit
 * Pictures in a dark tray, in real 3D: the one in the middle faces you, big, with its title; the others stand
 * turned to either side, each tucked behind the next, fading into the dark. Drag and the row follows your finger
 * exactly; flick and it carries on a card or two, then settles. At rest the cards float, each at its own pace.
 * Point at the one in front and it gives under the pointer, a dent where you press and light on the far edge.
 * Press it and it comes forward while the rest step back; press a side card and it comes to the middle.
 *
 * Positions are written straight to the cards every frame, not rendered, so a drag never trails the finger.
 * React + Tailwind, no other dependencies. Mouse, touch and keyboard. Respects reduced motion.
 */

export type FlowPicture = { src: string; title: string; credit?: string }

type Props = {
  images: FlowPicture[]
  /** Horizontal: a row. Vertical: the same, turned to run top to bottom. */
  direction?: 'horizontal' | 'vertical'
  width?: number
  height?: number
  /** The picture that starts in the middle. */
  start?: number
  /** How much they float at rest, 0 (still) to 100. */
  float?: number
  /** How deep the card in front gives under the pointer, 0 to 100. */
  sink?: number
  /** Called when a picture comes to the middle. */
  onChange?: (picture: FlowPicture, index: number) => void
  className?: string
  /** Card width ÷ height: 1 (square) by default; 1.5 or so for wide pictures, like desktop screens. */
  aspect?: number
  /** Share of the row's width the card in front can take, 0 to 1 (0.42 by default). Raise it for bigger cards. */
  share?: number
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const TRAY = '#0B0A09'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const quartOut = (t: number) => 1 - (1 - t) ** 4
const PERIODS = [5.1, 6.3, 4.7, 5.8, 6.9, 5.4, 4.9, 6.1] // awkward on purpose: no two cards drift together

export function RecordFlow({ images, direction = 'horizontal', width, height, start, float = 40, sink = 50, onChange, className = '', aspect = 1, share = 0.42 }: Props) {
  const n = images.length
  const vert = direction === 'vertical'
  const W = width ?? (vert ? 420 : 820)
  const H = height ?? (vert ? 720 : 440)
  // S is the card's height; CW its width (S × aspect). With the defaults it's the square card it always was.
  const S = vert ? Math.min(W * 0.66, H * 0.5) : Math.min(H * 0.78, (W * share) / aspect)
  const CW = S * aspect
  const PULL = S * 0.5 // px of drag that move one card

  const slots = useRef<(HTMLDivElement | null)[]>([])
  const shades = useRef<(HTMLSpanElement | null)[]>([])
  const titles = useRef<(HTMLSpanElement | null)[]>([])
  const faces = useRef<(HTMLButtonElement | null)[]>([])
  const pos = useRef(start ?? Math.floor((n - 1) / 2)) // where the row is, in cards; not state
  const lifted = useRef(0) // 0..1: the one in front pressed forward
  const [front, setFront] = useState(Math.round(pos.current))
  const [held, setHeld] = useState(false)
  const raf = useRef(0)
  const still = useRef(false)
  useEffect(() => { still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches }, [])

  // ── where a card stands, for a row position: one function for the first paint, the drag and the settle ──
  const paint = useCallback(() => {
    const p = pos.current, L = lifted.current
    for (let i = 0; i < n; i++) {
      const el = slots.current[i]
      if (!el) continue
      const o = i - p, d = Math.abs(o), side = Math.sign(o), k = Math.min(d, 1)
      // the first step out turns it and moves it most; after that they tuck in close, each behind the last
      // like the Figma frame: the side cards face in toward the middle, their OUTER edge tall and the one tucked
      // under the next card short. Each card has its own perspective (the vanishing point at its own centre),
      // so it's a symmetric trapezoid, and nothing sorts in 3D: the paint order below decides what's on top.
      const step = vert ? S : CW // in a row, cards stand apart by their own width
      const along = side * (k * step * 0.66 + Math.max(0, d - 1) * step * 0.28) * (1 + L * 0.16)
      const turn = -side * k * 66
      const back = -k * S * 0.2 - (d > 0.5 ? L * S * 0.2 : 0) // set back a little, so the tall outer edge is about the centre card's height
      const near = d < 0.5 ? L * S * 0.12 : 0
      el.style.transform = vert
        ? `translate(-50%, -50%) translate(0, ${along.toFixed(2)}px) perspective(${(S * 3.6).toFixed(0)}px) translateZ(${(back + near).toFixed(2)}px) rotateX(${(-turn).toFixed(2)}deg)`
        : `translate(-50%, -50%) translate(${along.toFixed(2)}px, 0) perspective(${(S * 3.6).toFixed(0)}px) translateZ(${(back + near).toFixed(2)}px) rotateY(${turn.toFixed(2)}deg)`
      el.style.zIndex = String(1000 - Math.round(d * 100))
      // the part tucked under the card before it is in its shadow; the rest just a little darker with distance
      const sh = shades.current[i]
      if (sh) {
        const under = clamp(0.62 * k + Math.max(0, d - 1) * 0.04, 0, 0.75), base = clamp(d * 0.1 + (d > 0.5 ? L * 0.25 : 0), 0, 0.7)
        const dir = vert ? (side > 0 ? '180deg' : '0deg') : side > 0 ? '90deg' : '270deg'
        sh.style.background = `linear-gradient(${dir}, rgba(0,0,0,${(base + under).toFixed(3)}) 0%, rgba(0,0,0,${(base + under * 0.35).toFixed(3)}) 30%, rgba(0,0,0,${base.toFixed(3)}) 70%)`
      }
      // and every card casts its shadow outward, onto the ones behind it
      const face = faces.current[i]
      if (face) {
        const sx = vert ? 0 : side * k * 22, sy = vert ? side * k * 22 : 0
        face.style.boxShadow = `${sx.toFixed(1)}px ${(sy + 14).toFixed(1)}px 34px -4px rgba(0,0,0,${(0.5 + 0.3 * k).toFixed(2)})`
      }
      const ti = titles.current[i]
      if (ti) ti.style.opacity = String(clamp(1 - d * 2.5, 0, 1))
    }
    const f = clamp(Math.round(p), 0, n - 1)
    setFront((x) => (x === f ? x : f))
  }, [n, S, CW, vert])
  useLayoutEffect(paint, [paint])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const told = useRef(-1)
  useEffect(() => { if (front !== told.current) { told.current = front; onChange?.(images[front], front) } }, [front]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── the settle: quart-out from wherever it is now, so a second flick during one carries on ──
  const glide = (to: number, lift = lifted.current) => {
    cancelAnimationFrame(raf.current)
    const target = clamp(to, 0, n - 1)
    const p0 = pos.current, l0 = lifted.current
    if (still.current) { pos.current = target; lifted.current = lift; paint(); return }
    const ms = 640, t0 = performance.now()
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / ms), e = quartOut(u)
      pos.current = p0 + (target - p0) * e
      lifted.current = l0 + (lift - l0) * e
      paint()
      if (u < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  // ── drag: one to one, with a flick that carries up to two cards; a little give past the ends ──
  const drag = useRef<{ p0: number; start: number; last: number; t: number; v: number; moved: boolean } | null>(null)
  const coord = (e: React.PointerEvent) => (vert ? e.clientY : e.clientX)
  const scale = (e: React.PointerEvent) => W / (e.currentTarget as HTMLElement).getBoundingClientRect().width
  const onDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(raf.current)
    drag.current = { p0: coord(e), start: pos.current, last: coord(e), t: e.timeStamp, v: 0, moved: false }
  }
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current
    if (!g) return
    const c = coord(e), dx = (c - g.p0) * scale(e)
    if (!g.moved) {
      if (Math.abs(dx) < 4) return
      g.moved = true; setHeld(true)
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* not a live pointer */ }
    }
    // speed at the end is what says how far a flick meant to go: smoothed, from the last reading
    const dt = Math.max(1, e.timeStamp - g.t)
    g.v = (g.v + ((c - g.last) * scale(e)) / dt) / 2
    g.last = c; g.t = e.timeStamp
    let p = g.start - dx / PULL
    if (p < 0) p *= 0.35
    if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.35
    pos.current = p
    if (lifted.current) lifted.current = 0
    paint()
  }
  const onUp = () => {
    const g = drag.current
    drag.current = null
    setHeld(false)
    if (!g?.moved) return
    const carry = clamp((-g.v * 150) / PULL, -2, 2)
    glide(Math.round(pos.current + carry), 0)
  }
  // wheel and trackpad: a notch, or a good swipe, is one card
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let acc = 0, t = 0
    const wheel = (e: WheelEvent) => {
      const d = vert ? e.deltaY : Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      e.preventDefault()
      acc += d
      if (Math.abs(acc) > 30 && performance.now() - t > 120) { glide(Math.round(pos.current) + Math.sign(acc), 0); acc = 0; t = performance.now() }
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [vert]) // eslint-disable-line react-hooks/exhaustive-deps
  const onKey = (e: React.KeyboardEvent) => {
    const next = vert ? 'ArrowDown' : 'ArrowRight', prev = vert ? 'ArrowUp' : 'ArrowLeft'
    if (e.key === next) { e.preventDefault(); glide(Math.round(pos.current) + 1, 0) }
    else if (e.key === prev) { e.preventDefault(); glide(Math.round(pos.current) - 1, 0) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); glide(Math.round(pos.current), lifted.current > 0.5 ? 0 : 1) }
    else if (e.key === 'Escape') glide(Math.round(pos.current), 0)
  }
  const press = (i: number) => {
    if (drag.current?.moved) return
    if (i !== front) glide(i, 0)
    else glide(i, lifted.current > 0.5 ? 0 : 1)
  }

  return (
    <div
      ref={box}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Pictures, ${front + 1} of ${n}`}
      onKeyDown={onKey}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className={`relative select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344] ${vert ? 'touch-pan-x' : 'touch-pan-y'} ${held ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{ width: W, height: H, borderRadius: Math.min(W, H) * 0.11, background: TRAY, fontFamily: FONT, boxShadow: 'inset 0 2px 30px rgba(0,0,0,0.8), 0 24px 60px rgba(20,19,16,0.22)' }}
    >
      <style>{CSS}</style>
      <div className="absolute left-1/2 top-1/2" style={{ width: 0, height: 0 }}>
        {images.map((img, i) => (
          <div key={img.src + i} ref={(el) => { slots.current[i] = el }} className="absolute left-0 top-0" style={{ width: CW, height: S, transformStyle: 'preserve-3d' }}>
            {/* the drift: its own element, so the keyframes own this transform and nothing else writes it */}
            <div
              className="rf-float h-full w-full"
              style={{ transformStyle: 'preserve-3d', animationDuration: `${PERIODS[i % PERIODS.length]}s`, animationPlayState: held ? 'paused' : 'running', animationName: float > 0 ? undefined : 'none', ['--lift' as string]: `${((float / 100) * 7).toFixed(1)}px`, ['--sway' as string]: `${((float / 100) * 0.8).toFixed(2)}deg` }}
            >
              <Card
                img={img}
                front={i === front && !held}
                sink={sink}
                onPress={() => press(i)}
                shade={(el) => { shades.current[i] = el }}
                face={(el) => { faces.current[i] = el }}
                title={(el) => { titles.current[i] = el }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* the tray's ends, where the cards fade into the dark */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: vert ? `linear-gradient(${TRAY} 2%, transparent 22%, transparent 78%, ${TRAY} 98%)` : `linear-gradient(90deg, ${TRAY} 2%, transparent 20%, transparent 80%, ${TRAY} 98%)` }} />
      <span className="sr-only" aria-live="polite">{images[front].title}{images[front].credit ? `, ${images[front].credit}` : ''}</span>
    </div>
  )
}

/* One card. The one in front gives under the pointer: it goes back where you press and the far side rises, with a
   dent under the pointer and light on the far edge. One sprung position drives all three. */
function Card({ img, front, sink, onPress, shade, title, face }: { img: FlowPicture; front: boolean; sink: number; onPress: () => void; shade: (el: HTMLSpanElement | null) => void; title: (el: HTMLSpanElement | null) => void; face: (el: HTMLButtonElement | null) => void }) {
  const el = useRef<HTMLButtonElement | null>(null)
  const sheen = useRef<HTMLSpanElement>(null)
  const st = useRef({ x: 0, y: 0, l: 0, vx: 0, vy: 0, vl: 0, tx: 0, ty: 0, tl: 0 })
  const raf = useRef(0)
  const deep = clamp(sink, 0, 100) / 100

  const draw = () => {
    const s = st.current, b = el.current
    if (!b) return
    const max = deep * 11
    b.style.transform = `translateZ(${(-12 * deep * s.l).toFixed(2)}px) rotateX(${(s.y * max).toFixed(2)}deg) rotateY(${(-s.x * max).toFixed(2)}deg)`
    if (sheen.current) {
      const px = ((s.x + 1) / 2) * 100, py = ((s.y + 1) / 2) * 100
      sheen.current.style.backgroundImage = `radial-gradient(42% 36% at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(0,0,0,${(deep * 0.42 * s.l).toFixed(3)}), transparent), radial-gradient(52% 44% at ${(100 - px).toFixed(1)}% ${(100 - py).toFixed(1)}%, rgba(255,255,255,${(deep * 0.16 * s.l).toFixed(3)}), transparent)`
    }
  }
  const spring = () => {
    if (raf.current) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67); last = now
      const s = st.current
      // per frame, with the decay raised to the frame count, so a dropped frame loses the same energy
      for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['l', 'vl', 'tl']] as const) {
        s[v] += (s[t] - s[p]) * 0.16 * dt
        s[v] *= Math.pow(0.72, dt)
        s[p] += s[v] * dt
      }
      draw()
      const moving = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) + Math.abs(s.tl - s.l) + Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vl) > 0.002
      raf.current = moving ? requestAnimationFrame(tick) : 0
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  useEffect(() => { if (!front) { const s = st.current; s.tx = s.ty = s.tl = 0; spring() } }, [front]) // eslint-disable-line react-hooks/exhaustive-deps

  const track = (e: React.PointerEvent) => {
    if (!front || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.current!.getBoundingClientRect(), s = st.current
    s.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
    s.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)
    s.tl = 1
    spring()
  }
  const leave = () => { const s = st.current; s.tx = s.ty = s.tl = 0; spring() }

  return (
    <button
      ref={(b) => { el.current = b; face(b) }}
      type="button"
      tabIndex={-1}
      aria-label={img.title}
      onClick={onPress}
      onPointerMove={track}
      onPointerLeave={leave}
      className="relative block h-full w-full overflow-hidden rounded-[18px] outline-none"
    >
      <img src={img.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
      <span ref={sheen} aria-hidden className="pointer-events-none absolute inset-0" />
      <span ref={title} className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-[6%] pt-[22%] text-center text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', opacity: 0 }}>
        <span className="text-[19px] font-semibold tracking-[-0.01em]">{img.title}</span>
        {img.credit ? <span className="text-[13px] opacity-70">{img.credit}</span> : null}
      </span>
      <span ref={shade} aria-hidden className="pointer-events-none absolute inset-0" />
    </button>
  )
}

const CSS = `
.rf-float{animation-name:rf-float;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}
@keyframes rf-float{0%{transform:translateY(calc(var(--lift) * -1)) rotate(calc(var(--sway) * -1))}100%{transform:translateY(var(--lift)) rotate(var(--sway))}}
@media (prefers-reduced-motion:reduce){.rf-float{animation:none}}
`
