'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hero card · StackD Kit
 * A mobile hero: a pill with your name and a menu, a headline, a living picture and a line of text.
 * The picture is one of three arts, each one alive under your finger:
 * - `pixel`: a pixel gradient across the top. A warm spot follows you on a spring and the pixels around it
 *   get finer, like a lens sharpening the picture.
 * - `halo`: a soft ring of colour that breathes. It leans toward your finger, and a press sends a squishy
 *   ripple out through it.
 * - `reeded`: colour clouds behind reeded glass; every rib bends its own slice of them. Point and the colour
 *   gathers where you are, smeared across the ribs. Optional white text on the glass.
 * The menu pill swells into a panel whose links drop in with a bounce; the text comes in word by word.
 *
 * Canvas or CSS, drawn only while something moves and only on screen.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type HeroLink = { label: string; href?: string; onClick?: () => void }
export type HeroArt = 'pixel' | 'halo' | 'reeded'

type Props = {
  art?: HeroArt
  brand?: string
  headline?: string
  body?: string
  footnote?: string
  links?: HeroLink[]
  /** The art's colours, the warmest or strongest first. */
  palette?: string[]
  /** Reeded only: white text on the glass. */
  caption?: { title: string; text?: string }
  /** Pixel only: pixel size in px. */
  pixel?: number
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Hold the pointer here (0 to 1 across and down the art), for covers and mock-ups. */
  glow?: { x: number; y: number }
  /** Start with the menu open. */
  defaultOpen?: boolean
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

const THEMES = {
  light: { card: '#F2F0EC', panel: '#FFFFFF', ink: '#141310', dim: 'rgba(20,19,16,0.42)', pill: '#F2F0EC', chip: 'rgba(20,19,16,0.06)', base: '#EDE6F7' },
  dark: { card: '#141310', panel: '#1E1D1A', ink: '#F2F0EC', dim: 'rgba(242,240,236,0.45)', pill: '#26241F', chip: 'rgba(242,240,236,0.08)', base: '#2A2236' },
}
const PALETTES: Record<HeroArt, string[]> = {
  pixel: ['#FF6B1A', '#BE9344', '#C9B8FF', '#E9B7A8', '#901919'],
  halo: ['#FF6B1A', '#FF8FB8', '#141310', '#7FA7E8', '#EEF3FF'], // outer → inner rings
  reeded: ['#6C8544', '#C8D96A', '#F2E3C6', '#3E7A5A', '#BE9344'],
}

/* The pointer over an element, on a loose spring, in the element's own units even when it's drawn scaled */
function useSpot(el: React.RefObject<HTMLElement | null>, w: number, h: number, glow: Props['glow'], onFrame: (s: Spot, t: number) => void, deps: unknown[]) {
  const frame = useRef(onFrame)
  frame.current = onFrame
  useEffect(() => {
    const host = el.current
    if (!host) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const s: Spot = { x: w * 0.35, y: h * 0.5, vx: 0, vy: 0, tx: w * 0.35, ty: h * 0.5, on: 0, onT: 0, still }
    if (glow) { s.x = s.tx = glow.x * w; s.y = s.ty = glow.y * h; s.on = s.onT = 1 }
    let raf = 0, seen = true, last = performance.now()
    const t0 = last
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      if (!glow && !still) {
        const k = 90, damp = 11
        s.vx += (-k * (s.x - s.tx) - damp * s.vx) * dt
        s.vy += (-k * (s.y - s.ty) - damp * s.vy) * dt
        s.x += s.vx * dt; s.y += s.vy * dt
        s.on += (s.onT - s.on) * Math.min(1, dt * 5)
      }
      frame.current(s, still ? 0 : (now - t0) / 1000)
      raf = seen && !still ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }
    const move = (e: PointerEvent) => {
      const box = host.getBoundingClientRect()
      const k = w / box.width
      s.tx = (e.clientX - box.left) * k; s.ty = (e.clientY - box.top) * k; s.onT = 1
      if (still) { s.x = s.tx; s.y = s.ty; s.on = 1; frame.current(s, 0) } else wake()
    }
    const leave = () => { if (glow) return; s.onT = 0; if (still) { s.on = 0; frame.current(s, 0) } else wake() }
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerdown', move)
    host.addEventListener('pointerleave', leave)
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) wake() })
    io.observe(host)
    frame.current(s, 0)
    wake()
    return () => {
      cancelAnimationFrame(raf); raf = 0; io.disconnect()
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerdown', move); host.removeEventListener('pointerleave', leave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, ...deps])
}
type Spot = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; on: number; onT: number; still: boolean }

/* Colour clouds drifting on slow loops, mixed over a base: shared by Pixel and Reeded */
function cloudsAt(x: number, y: number, t: number, w: number, h: number, pal: number[][], base: number[], s: Spot, hot: number[]) {
  let r = base[0], g = base[1], b = base[2]
  pal.forEach((col, i) => {
    const cx = w * (0.5 + 0.42 * Math.sin(t * (0.07 + i * 0.023) + i * 1.9))
    const cy = h * (0.5 + 0.5 * Math.cos(t * (0.05 + i * 0.017) + i * 2.6))
    const rad = (0.38 + 0.1 * Math.sin(i * 3.1)) * Math.max(w, h)
    const k = Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / (rad * rad))) * (i === 0 ? 0.95 : 0.8)
    r += (col[0] - r) * k; g += (col[1] - g) * k; b += (col[2] - b) * k
  })
  if (s.on > 0.01) {
    const k = Math.exp(-(((x - s.x) ** 2 + (y - s.y) ** 2) / (70 * 70))) * 0.9 * s.on
    r += (hot[0] - r) * k; g += (hot[1] - g) * k; b += (hot[2] - b) * k
  }
  return [r, g, b]
}

function PixelArt({ w, h, palette, pixel, base, glow }: { w: number; h: number; palette: string[]; pixel: number; base: string; glow: Props['glow'] }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const host = useRef<HTMLDivElement>(null)
  useSpot(host, w, h, glow, (s, t) => {
    const c = cv.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const pal = palette.map(rgb), b0 = rgb(base)
    const cols = Math.ceil(w / pixel), rows = Math.ceil(h / pixel)
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i * pixel, y = j * pixel
      // near the spot the pixels split: 2 × 2, then 4 × 4 right under it
      const d = Math.hypot(x + pixel / 2 - s.x, y + pixel / 2 - s.y)
      const split = s.on > 0.3 ? (d < 42 ? 4 : d < 90 ? 2 : 1) : 1
      const q = pixel / split
      for (let a = 0; a < split; a++) for (let bb = 0; bb < split; bb++) {
        const [r, gg, b] = cloudsAt(x + (a + 0.5) * q, y + (bb + 0.5) * q, t, w, h, pal, b0, s, pal[0])
        g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`
        g.fillRect(x + a * q, y + bb * q, q + 0.5, q + 0.5) // a hair over, so no seams
      }
    }
  }, [palette.join(), pixel, base])
  return (
    <div ref={host} className="relative touch-none" style={{ width: w, height: h }}>
      <canvas ref={cv} aria-hidden className="block" style={{ width: w, height: h }} />
    </div>
  )
}

function HaloArt({ w, h, palette, glow }: { w: number; h: number; palette: string[]; glow: Props['glow'] }) {
  const host = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<number[]>([])
  const size = Math.min(w, h) * 0.92
  // the rings, outer to inner, as one blurred radial gradient
  const [outer, mid, line, inner, core] = palette
  const bg = `radial-gradient(circle, ${core} 0%, ${core} 14%, ${inner} 26%, ${line} 33%, ${outer} 45%, ${mid} 60%, transparent 71%)`
  useSpot(host, w, h, glow, (s, t) => {
    const el = ring.current
    if (!el) return
    // it leans a fifth of the way toward the finger, and breathes
    const dx = (s.x - w / 2) * 0.2 * s.on, dy = (s.y - h / 2) * 0.2 * s.on
    const k = 1 + 0.035 * Math.sin(t * 1.3) + 0.04 * s.on
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${k.toFixed(4)})`
  }, [])
  return (
    <div
      ref={host}
      className="relative touch-none overflow-hidden"
      style={{ width: w, height: h }}
      onPointerDown={() => setRipples((r) => [...r.slice(-2), Date.now()])}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={ring} style={{ width: size, height: size, borderRadius: '50%', background: bg, filter: `blur(${Math.round(size / 22)}px)` }} />
      </div>
      {ripples.map((id) => (
        <span
          key={id}
          aria-hidden
          className="hc-ripple pointer-events-none absolute left-1/2 top-1/2 rounded-full"
          style={{ width: size * 0.55, height: size * 0.55, marginLeft: -size * 0.275, marginTop: -size * 0.275, border: `${Math.round(size / 18)}px solid ${outer}`, filter: `blur(${Math.round(size / 30)}px)` }}
          onAnimationEnd={() => setRipples((r) => r.filter((x) => x !== id))}
        />
      ))}
    </div>
  )
}

function ReededArt({ w, h, palette, base, glow, caption }: { w: number; h: number; palette: string[]; base: string; glow: Props['glow']; caption?: Props['caption'] }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLCanvasElement | null>(null)
  const RIBS = 6
  useSpot(host, w, h, glow, (s, t) => {
    const c = cv.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
    const g = c.getContext('2d')!
    // the clouds, painted small and stretched smooth
    const S = 6, fw = Math.ceil(w / S), fh = Math.ceil(h / S)
    if (!field.current) { field.current = document.createElement('canvas'); field.current.width = fw; field.current.height = fh }
    const f = field.current.getContext('2d')!
    const img = f.createImageData(fw, fh)
    const pal = palette.map(rgb), b0 = rgb(base)
    const spot = { ...s, x: s.x / S, y: s.y / S }
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
      const [r, gg, b] = cloudsAt(i, j, t, fw, fh, pal, b0, { ...spot, on: 0 }, pal[1])
      // the pointer's colour, gathered where you are
      const k = s.on > 0.01 ? Math.exp(-(((i - spot.x) ** 2 + (j - spot.y) ** 2) / (12 * 12))) * 0.85 * s.on : 0
      const o = (j * fw + i) * 4
      img.data[o] = r + (pal[1][0] - r) * k; img.data[o + 1] = gg + (pal[1][1] - gg) * k; img.data[o + 2] = b + (pal[1][2] - b) * k; img.data[o + 3] = 255
    }
    f.putImageData(img, 0, 0)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.imageSmoothingEnabled = true
    g.imageSmoothingQuality = 'high'
    // each rib shows a wider slice of what's behind it, squeezed: like a convex glass rod
    const rib = w / RIBS
    for (let i = 0; i < RIBS; i++) {
      const cx = (i + 0.5) * rib
      const span = rib * 2.4
      const sx = Math.max(0, Math.min(w - span, cx - span / 2))
      g.drawImage(field.current, sx / S, 0, span / S, fh, i * rib, 0, rib + 0.5, h)
      // the glass: a light edge on the left, a soft shade on the right
      const gr = g.createLinearGradient(i * rib, 0, (i + 1) * rib, 0)
      gr.addColorStop(0, 'rgba(255,255,255,0.32)')
      gr.addColorStop(0.18, 'rgba(255,255,255,0.06)')
      gr.addColorStop(0.7, 'rgba(255,255,255,0)')
      gr.addColorStop(1, 'rgba(0,0,0,0.08)')
      g.fillStyle = gr
      g.fillRect(i * rib, 0, rib + 0.5, h)
    }
  }, [palette.join(), base])
  return (
    <div ref={host} className="relative touch-none" style={{ width: w, height: h }}>
      <canvas ref={cv} aria-hidden className="block" style={{ width: w, height: h }} />
      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-[16%] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.12)]">
          <p className="text-[24px] font-semibold leading-[1.05] tracking-[-0.02em]">{caption.title}</p>
          {caption.text ? <p className="mt-3 text-[12px] leading-[1.35]">{caption.text}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export function HeroCard({
  art = 'pixel',
  brand = 'STACKD',
  headline,
  body,
  footnote,
  links = [{ label: 'Components' }, { label: 'Figma' }, { label: 'About' }, { label: 'Contact' }],
  palette,
  caption,
  pixel = 18,
  theme = 'light',
  width = 360,
  height = 600,
  glow,
  defaultOpen = false,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const pal = palette ?? PALETTES[art]
  const top = art === 'pixel' // pixel: the art across the top, under a glass pill
  const [open, setOpen] = useState(defaultOpen)
  const H = headline ?? (top ? 'Interfaces that feel alive. Small things you want to touch, made with care.' : 'Small things you want to touch.')
  const B = body ?? (top ? 'Every component comes with the Figma file and the code. Try it here first, then make it yours.' : undefined)
  const F = footnote ?? 'Figma file and React code for every state. Many of them are free, and all of them respect reduced motion.'

  // words come in one after another, out of a slight blur
  let n = 0
  const words = (s: string, base: number) =>
    s.split(' ').map((word, i) => (
      <span key={i} className="hc-word inline-block" style={{ animationDelay: `${base + (n++) * 28}ms` }}>{word}&nbsp;</span>
    ))

  const artW = top ? width : width - 24
  const heroH = Math.round(height * 0.42)
  const pill = (glass: boolean) => (
    <nav
      className={`hc-pill absolute left-3 right-3 top-3 z-10 overflow-hidden ${glass ? 'border border-white/40 bg-white/30 backdrop-blur-xl' : ''}`}
      style={{ height: open ? (top ? heroH + 64 : height * 0.62) : 44, borderRadius: open ? 24 : 22, background: glass ? undefined : c.pill, boxShadow: glass ? undefined : '0 1px 0 rgba(20,19,16,0.04)' }}
      aria-label={brand}
    >
      <div className="flex h-11 items-center justify-between pl-4 pr-1.5">
        <span className={`text-[12px] font-semibold tracking-[0.04em] ${glass ? 'text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.12)]' : ''}`}>{brand}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`hc-press rounded-full px-3 py-1 text-[12.5px] font-medium outline-none focus-visible:ring-2 ${glass ? 'bg-white/35 text-white focus-visible:ring-white' : 'focus-visible:ring-[#BE9344]'}`}
          style={glass ? undefined : { background: c.chip }}
        >
          {open ? 'close' : 'menu'}
        </button>
      </div>
      {open ? (
        <ul className="px-4 pt-2">
          {links.map((l, i) => (
            <li key={l.label} className="hc-link" style={{ animationDelay: `${80 + i * 60}ms` }}>
              <a
                href={l.href ?? '#'}
                onClick={(e) => { if (!l.href) e.preventDefault(); l.onClick?.(); setOpen(false) }}
                className={`block py-1.5 text-[26px] font-semibold tracking-[-0.02em] outline-none hover:opacity-70 focus-visible:underline ${glass ? 'text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.12)]' : ''}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  )

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height, borderRadius: 28, background: top ? c.card : c.panel, color: c.ink, fontFamily: FONT, boxShadow: theme === 'dark' ? '0 0 0 1px rgba(242,240,236,0.08)' : '0 0 0 1px rgba(20,19,16,0.06), 0 10px 30px rgba(20,19,16,0.06)' }}>
      <style>{CSS}</style>
      {top ? (
        <>
          <PixelArt w={width} h={heroH} palette={pal} pixel={pixel} base={c.base} glow={glow} />
          {pill(true)}
          <div className="flex flex-col px-6 pt-6" style={{ height: height - heroH }}>
            {/* the type follows the card's width (25 and 20 px at 360), so it fits a narrow phone too */}
            <h2 className="font-semibold leading-[1.12] tracking-[-0.025em]" style={{ fontSize: Math.round(width / 14.4) }}>{words(H, 120)}</h2>
            {B ? <p className="mt-4 font-medium leading-[1.2] tracking-[-0.015em]" style={{ color: c.dim, fontSize: Math.round(width / 18) }}>{words(B, 200)}</p> : null}
            <p className="mb-6 mt-auto text-[12.5px] leading-[1.4]">{words(F, 260)}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col px-3 pb-5 pt-[68px]">
          {pill(false)}
          <h2 className="px-2 text-[26px] font-semibold leading-[1.06] tracking-[-0.03em]">{words(H, 120)}</h2>
          <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[18px]" style={{ background: theme === 'dark' ? '#1A1916' : '#F4F3F1' }}>
            <Measured>
              {(h) => (art === 'halo'
                ? <HaloArt w={artW} h={h} palette={pal} glow={glow} />
                : <ReededArt w={artW} h={h} palette={pal} base={theme === 'dark' ? '#1E2A22' : '#EEF2E4'} glow={glow} caption={caption} />)}
            </Measured>
          </div>
          {B ? <p className="mt-4 px-2 text-[16px] leading-[1.25]" style={{ color: c.dim }}>{words(B, 200)}</p> : null}
          <p className="mt-4 px-2 text-[15px] leading-[1.3]">{words(F, 260)}</p>
        </div>
      )}
    </div>
  )
}

/* Gives its child the height it gets in the layout */
function Measured({ children }: { children: (h: number) => React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)
  useEffect(() => {
    const d = el.current
    if (!d) return
    const ro = new ResizeObserver(([e]) => setH(Math.round(e.contentRect.height)))
    ro.observe(d)
    return () => ro.disconnect()
  }, [])
  return <div ref={el} className="h-full w-full">{h > 0 ? children(h) : null}</div>
}

const CSS = `
.hc-pill{transition:height 620ms cubic-bezier(.34,1.45,.5,1),border-radius 620ms cubic-bezier(.34,1.45,.5,1)}
.hc-press{transition:transform 420ms cubic-bezier(.34,1.8,.5,1),background-color 200ms}
.hc-press:active{transform:scale(.9,.84);transition-duration:90ms}
.hc-link{animation:hc-link 560ms cubic-bezier(.3,1.6,.5,1) both}
@keyframes hc-link{0%{opacity:0;transform:translateY(-14px) scale(.92,.8)}60%{opacity:1;transform:translateY(2px) scale(1.03,1.05)}100%{opacity:1;transform:none}}
.hc-word{animation:hc-word 620ms cubic-bezier(.3,1.3,.5,1) both}
@keyframes hc-word{0%{opacity:0;filter:blur(6px);transform:translateY(6px)}100%{opacity:1;filter:none;transform:none}}
.hc-ripple{animation:hc-ripple 1100ms cubic-bezier(.2,.9,.3,1) forwards}
@keyframes hc-ripple{0%{opacity:.75;transform:scale(.6,.5)}35%{transform:scale(1.25,1.15)}100%{opacity:0;transform:scale(2.1)}}
@media (prefers-reduced-motion:reduce){.hc-pill,.hc-press{transition:none}.hc-link,.hc-word,.hc-ripple{animation:none}.hc-ripple{display:none}}
`
