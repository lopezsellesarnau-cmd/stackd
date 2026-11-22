'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Bot } from './bot'

/**
 * Generate · StackD Kit
 * An empty frame with one pill in it. Press Generate and, while your model
 * works, a soft haze drifts in the frame and the count crawls. When the picture
 * arrives it forms the way a generated image does: a few soft masses under a
 * liquid surface, then the forms find their edges, then the fine grain lands
 * as ink dots and melts into the photo.
 *
 * If it fails, the haze stops and prints itself in ink dots, dry, the Bot
 * looks down, and the pill says so and offers to try again.
 *
 * The Bot is the loader: it rides in the pill, its eyes scanning the frame,
 * next to a count that climbs unevenly (a quick start, a stall, a burst) the
 * way real work does. 99 at most until the picture has landed.
 *
 * SVG filter + one canvas, drawn only while something happens.
 * React + Tailwind and the Bot, no other dependencies. Respects reduced motion.
 */

export type GenerateImage = { src: string; alt: string }

type Props = {
  /** Makes the picture: resolve with it, or throw (reject) when it fails. */
  onGenerate?: () => Promise<GenerateImage>
  /** Without onGenerate: these pictures, one per press, as a demo. */
  images?: GenerateImage[]
  /** Seconds the picture takes to form once it has arrived. */
  pace?: number
  /** How liquid the surface is while it forms, 0 to 100. */
  ripple?: number
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Corner radius of the frame, px. */
  corner?: number
  /** What the pill says when it fails. */
  failText?: string
  /** Called when a picture has landed. */
  onDone?: (image: GenerateImage) => void
  /** Called when it fails, with what was thrown. */
  onFail?: (error: unknown) => void
  /** Hold one still moment, for covers and mock-ups: a picture part-formed
      (`at` from 0 to 1), or the failed print. Nothing can be pressed. */
  freeze?: { image: GenerateImage; at: number } | 'failed'
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (a: number, b: number, v: number) => {
  const u = clamp((v - a) / (b - a), 0, 1)
  return u * u * (3 - 2 * u)
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* Pictures mostly have a light ground: the masses' contrast turns about it */
const PIVOT = 0.85
/* While waiting, the count creeps toward this and no further */
const WAIT_CAP = 32

const THEMES = {
  light: { paper: '#F2F0EC', ink: '#141310', on: '#FFFFFF', line: 'rgba(20,19,16,0.08)', haze: '20 19 16' },
  dark: { paper: '#1E1D1A', ink: '#F2F0EC', on: '#141310', line: 'rgba(242,240,236,0.08)', haze: '242 240 236' },
}

/* The count's own clock over [0, 1]: a few phases, each at its own speed (some
   nearly stopped), added up and scaled to land on 1. Rolled for every picture. */
function rollPace() {
  const speeds = [1.6, 0.35, 2.4, 0.12, 1.9, 0.5].map((s) => s * (0.7 + Math.random() * 0.6))
  const lengths = speeds.map(() => 0.6 + Math.random())
  const total = lengths.reduce((a, b) => a + b, 0)
  const marks: { t: number; v: number }[] = [{ t: 0, v: 0 }]
  let t = 0, v = 0
  speeds.forEach((s, i) => { t += lengths[i] / total; v += s * lengths[i]; marks.push({ t, v }) })
  marks.forEach((m) => { m.v /= v })
  return (x: number) => {
    for (let i = 1; i < marks.length; i++) {
      const a = marks[i - 1], b = marks[i]
      if (x <= b.t) return lerp(a.v, b.v, (x - a.t) / (b.t - a.t))
    }
    return 1
  }
}

/* A halftone screen: one dot per cell, sized by how much ink the cell holds,
   with the moment it lands (top to bottom, loosely). */
type Dot = { x: number; y: number; r: number; at: number }
function dotsOf(w: number, h: number, cell: number, inkAt: (x: number, y: number) => number): Dot[] {
  const dots: Dot[] = []
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5 + (j & 1) * 0.5) * cell, y = (j + 0.5) * cell
    const r = cell * 0.5 * Math.sqrt(clamp(inkAt(x, y), 0, 1))
    if (r < 0.35) continue
    dots.push({ x, y, r, at: clamp((y / h) * 0.7 + Math.random() * 0.3, 0, 1) })
  }
  return dots
}

/* The picture's screen: ink where it's dark (on paper) or light (on a dark frame) */
function pictureDots(img: HTMLImageElement, w: number, h: number, cell: number, light: boolean): Dot[] | null {
  try {
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
    const c = document.createElement('canvas')
    c.width = cols; c.height = rows
    const g = c.getContext('2d', { willReadFrequently: true })!
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight) // cover, as it's shown
    const sw = w / k, sh = h / k
    g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows)
    const px = g.getImageData(0, 0, cols, rows).data
    return dotsOf(w, h, cell, (x, y) => {
      const o = (Math.min(rows - 1, Math.floor(y / cell)) * cols + Math.min(cols - 1, Math.floor(x / cell))) * 4
      const lum = (px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114) / 255
      return light ? 1 - lum : Math.pow(lum, 1.8)
    })
  } catch {
    return null // a picture from another origin without CORS can't be read: no grain then
  }
}

/* The failed print: the haze, dried into ink. A few soft clouds, thin and patchy. */
function hazeDots(w: number, h: number, cell: number): Dot[] {
  const blobs = Array.from({ length: 7 }, () => ({
    x: Math.random() * w, y: Math.random() * h, r: (0.12 + Math.random() * 0.2) * Math.min(w, h), a: 0.3 + Math.random() * 0.5,
  }))
  return dotsOf(w, h, cell, (x, y) => {
    let v = 0
    for (const b of blobs) v += b.a * Math.exp(-(((x - b.x) ** 2 + (y - b.y) ** 2) / (b.r * b.r)))
    return Math.pow(clamp(v, 0, 1), 1.6) * 0.6
  })
}

type Phase = 'empty' | 'waiting' | 'forming' | 'landed' | 'made' | 'failed'

export function Generate({
  onGenerate,
  images = [],
  pace = 5,
  ripple = 50,
  theme = 'light',
  width = 320,
  height = 400,
  corner = 22,
  failText = "Couldn't generate",
  onDone,
  onFail,
  freeze,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const id = `gen-${useId().replace(/:/g, '')}`
  const [phase, setPhase] = useState<Phase>('empty')
  const [pic, setPic] = useState<GenerateImage | null>(null)
  const [count, setCount] = useState(0)
  const [look, setLook] = useState({ x: 0, y: 0 })

  const raf = useRef(0)
  const timer = useRef(0)
  const run = useRef(0) // which press this is, so a late answer from an old one is ignored
  const demo = useRef(-1)
  const still = useRef(false)
  const cb = useRef({ onDone, onFail, onGenerate })
  cb.current = { onDone, onFail, onGenerate }

  // the live parts, set straight on the elements each frame
  const turb = useRef<SVGFETurbulenceElement>(null)
  const disp = useRef<SVGFEDisplacementMapElement>(null)
  const blur = useRef<SVGFEGaussianBlurElement>(null)
  const funcs = useRef<(SVGFEFuncRElement | null)[]>([])
  const soft = useRef<SVGImageElement>(null)
  const sharp = useRef<SVGImageElement>(null)
  const hazeTurb = useRef<SVGFETurbulenceElement>(null)
  const haze = useRef<SVGRectElement>(null)
  const grain = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => { cancelAnimationFrame(raf.current); raf.current = 0; clearTimeout(timer.current); run.current++ }
  }, [])

  const busy = phase === 'waiting' || phase === 'forming' || phase === 'landed'
  const cell = Math.max(4, Math.round(Math.min(width, height) / 56))
  const light = theme === 'light'

  const loop = (frame: (now: number) => boolean) => {
    cancelAnimationFrame(raf.current)
    const step = (now: number) => { raf.current = frame(now) ? requestAnimationFrame(step) : 0 }
    raf.current = requestAnimationFrame(step)
  }

  const drawDots = (dots: Dot[], p: number, alpha: number) => {
    const cv = grain.current
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (cv.width !== Math.round(width * dpr)) { cv.width = Math.round(width * dpr); cv.height = Math.round(height * dpr) }
    const g = cv.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, width, height)
    g.fillStyle = c.ink
    g.globalAlpha = alpha
    for (const d of dots) {
      const q = (p - d.at * 0.85) / 0.15 // each dot pops in over a short stretch of its own
      if (q <= 0) continue
      const s = q >= 1 ? 1 : 1 + 0.25 * Math.sin(Math.PI * q) // a small overshoot as it lands
      g.beginPath(); g.arc(d.x, d.y, d.r * Math.min(1, q) * s, 0, Math.PI * 2); g.fill()
    }
  }
  const clearDots = () => {
    const cv = grain.current
    cv?.getContext('2d')?.clearRect(0, 0, cv.width, cv.height)
  }

  /* One moment of the forming, t from 0 to 1. Returns how far the forms are. */
  const formAt = (t: number, dots: Dot[] | null) => {
    const mass = ease(0, 0.28, t)
    const form = ease(0.08, 0.8, t)
    const fine = ease(0.66, 0.96, t)
    const settle = ease(0.9, 1, t)
    if (haze.current) haze.current.style.opacity = String(0.55 * (1 - ease(0, 0.3, t)))
    if (!still.current) {
      // blur lets go fast, then crawls through the small radii where the detail is
      const sd = lerp(18, 0.8, 1 - Math.pow(1 - form, 2.3))
      const k = lerp(2.2, 1, form)
      const cut = (PIVOT - PIVOT * k).toFixed(3)
      const warp = (clamp(ripple, 0, 100) / 100) * 30 * Math.pow(1 - ease(0.04, 0.88, t), 1.4)
      const f = 0.0065 + 0.002 * Math.sin(t * 5)
      turb.current?.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 1.4).toFixed(4)}`)
      disp.current?.setAttribute('scale', warp.toFixed(2))
      blur.current?.setAttribute('stdDeviation', sd.toFixed(2))
      funcs.current.forEach((fn) => { fn?.setAttribute('slope', k.toFixed(3)); fn?.setAttribute('intercept', cut) })
      if (soft.current) {
        soft.current.style.opacity = String(mass * lerp(0.75, 1, form))
        soft.current.style.transform = `scale(${lerp(1.05, 1, ease(0, 0.9, t))})`
      }
      if (dots) drawDots(dots, fine, 0.9 * (1 - settle))
    }
    if (sharp.current) sharp.current.style.opacity = String(still.current ? t : settle)
    return form
  }

  const fail = (me: number, error: unknown) => {
    if (me !== run.current) return
    setPhase('failed')
    setLook({ x: 0, y: 0.6 })
    cb.current.onFail?.(error)
    // the haze stops and dries into ink
    const dots = hazeDots(width, height, cell)
    let start = 0
    loop((now) => {
      if (!start) start = now
      const t = still.current ? 1 : Math.min(1, (now - start) / 900)
      drawDots(dots, t, 1)
      if (haze.current) haze.current.style.opacity = String(0.55 * (1 - t))
      return t < 1
    })
  }

  const generate = async () => {
    if (busy) return
    const me = ++run.current
    const make = cb.current.onGenerate ?? (async () => {
      if (!images.length) throw new Error('No pictures')
      await wait(700 + Math.random() * 600) // a model thinking
      demo.current = (demo.current + 1) % images.length
      return images[demo.current]
    })
    clearDots()
    setPic(null)
    setPhase('waiting')
    setCount(0)

    // ── waiting: a haze drifts and the count crawls toward a third ──
    let waitStart = 0, shown = -1
    loop((now) => {
      if (!waitStart) waitStart = now
      const a = (now - waitStart) / 1000
      const n = Math.floor(WAIT_CAP * (1 - Math.exp(-a / 2.2)))
      if (n !== shown) { shown = n; setCount(n) }
      if (haze.current) haze.current.style.opacity = String(0.55 * ease(0, 0.6, a))
      if (!still.current) {
        const f = 0.009 + 0.003 * Math.sin(a * 0.9)
        hazeTurb.current?.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 1.5).toFixed(4)}`)
        hazeTurb.current?.setAttribute('seed', String(1 + Math.floor(a * 2) % 40))
        setLook({ x: Math.sin(a * 2.1) * 0.75, y: Math.cos(a * 1.3) * 0.35 })
      }
      return true
    })

    let image: GenerateImage
    const img = new Image()
    try {
      image = await make()
      if (me !== run.current) return
      img.crossOrigin = 'anonymous'
      img.src = image.src
      await img.decode()
    } catch (e) {
      return fail(me, e)
    }
    if (me !== run.current) return

    // ── forming: masses, form, grain ──
    setPic(image)
    setPhase('forming')
    const dots = pictureDots(img, width, height, cell, light)
    const from = shown < 0 ? 0 : shown
    const total = still.current ? 600 : Math.max(2, pace) * 1000
    const climb = rollPace()
    let start = 0
    loop((now) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / total)
      const form = formAt(t, dots)
      const n = Math.min(99, Math.floor(lerp(from, 100, climb(t))))
      if (n !== shown) { shown = n; setCount(n) }
      const a = (now - start) / 1000
      setLook({ x: Math.sin(a * 2.1) * 0.75, y: Math.cos(a * 1.3) * 0.35 + (1 - form) * 0.2 })
      if (t < 1) return true
      clearDots()
      setPhase('landed')
      setCount(100)
      setLook({ x: 0, y: 0 })
      cb.current.onDone?.(image)
      timer.current = window.setTimeout(() => { if (me === run.current) setPhase('made') }, 900)
      return false
    })
  }

  // a still moment, for covers: set it up, then paint it once it's on screen
  const held = useRef<Dot[] | null | undefined>(undefined)
  useEffect(() => {
    if (!freeze) return
    run.current++
    if (freeze === 'failed') {
      setPhase('failed')
      setLook({ x: 0, y: 0.6 })
      drawDots(hazeDots(width, height, cell), 1, 1)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = freeze.image.src
    img.decode().then(() => {
      held.current = pictureDots(img, width, height, cell, light)
      setPic(freeze.image)
      setPhase('forming')
      setCount(Math.min(99, Math.round(freeze.at * 100)))
      setLook({ x: 0.5, y: 0.2 })
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (freeze && freeze !== 'failed' && phase === 'forming' && held.current !== undefined) formAt(freeze.at, held.current)
  })

  const forming = phase === 'forming'
  const failed = phase === 'failed'
  // empty: the pill in the middle; busy or failed: at the bottom; made: hidden until pointed at
  const where = phase === 'empty' ? 'center' : phase === 'made' ? 'rest' : 'bottom'
  const label = busy ? `${count}%` : failed ? failText : phase === 'made' ? 'Again' : 'Generate'

  return (
    <div
      className={`group relative select-none overflow-hidden ${className}`}
      style={{ width, height, borderRadius: corner, background: c.paper, boxShadow: `inset 0 0 0 1px ${c.line}`, fontFamily: FONT }}
    >
      <svg width={width} height={height} className="absolute inset-0 block" role="img" aria-label={pic && !forming ? pic.alt : failed ? failText : 'Empty frame'}>
        {/* the haze that drifts while the model works, and that a failure dries out */}
        <filter id={`${id}-haze`} x="0" y="0" width="100%" height="100%">
          <feTurbulence ref={hazeTurb} type="fractalNoise" baseFrequency="0.009 0.0135" numOctaves={3} seed={1} />
          <feColorMatrix type="matrix" values={`0 0 0 0 ${Number(c.haze.split(' ')[0]) / 255}  0 0 0 0 ${Number(c.haze.split(' ')[1]) / 255}  0 0 0 0 ${Number(c.haze.split(' ')[2]) / 255}  1.6 0 0 0 -0.55`} />
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <rect ref={haze} width={width} height={height} filter={`url(#${id}-haze)`} style={{ opacity: 0 }} />

        {pic ? (
          <>
            {forming && !still.current ? (
              <>
                <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                  <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.0065 0.009" numOctaves={2} seed={3} result="noise" />
                  <feDisplacementMap ref={disp} in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" result="moved" />
                  <feGaussianBlur ref={blur} in="moved" stdDeviation="18" />
                  <feComponentTransfer>
                    {['R', 'G', 'B'].map((ch, i) => {
                      const Fn = `feFunc${ch}` as 'feFuncR'
                      return <Fn key={ch} ref={(el: SVGFEFuncRElement | null) => { funcs.current[i] = el }} type="linear" slope="2.2" intercept="0" />
                    })}
                  </feComponentTransfer>
                </filter>
                <image ref={soft} href={pic.src} width={width} height={height} preserveAspectRatio="xMidYMid slice" filter={`url(#${id})`} style={{ opacity: 0, transformOrigin: 'center' }} />
              </>
            ) : null}
            <image ref={sharp} href={pic.src} width={width} height={height} preserveAspectRatio="xMidYMid slice" style={{ opacity: forming ? 0 : 1 }} />
          </>
        ) : null}
      </svg>
      <canvas ref={grain} className="pointer-events-none absolute inset-0" style={{ width, height }} aria-hidden="true" />

      {/* The pill: Generate when idle, the Bot and the count while it works, what went wrong when it fails */}
      <button
        type="button"
        onClick={freeze ? undefined : generate}
        disabled={busy}
        aria-label={busy ? `Generating, ${count}%` : failed ? `${failText}. Try again` : phase === 'made' ? 'Generate another' : 'Generate'}
        className={
          'absolute inset-x-0 mx-auto flex h-11 w-fit items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-4 text-[15px] font-medium outline-none ' +
          'transition-[top,transform,opacity] duration-500 ease-[cubic-bezier(.34,1.45,.5,1)] focus-visible:ring-2 focus-visible:ring-[#BE9344] ' +
          (where === 'rest'
            ? 'opacity-100 [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100'
            : 'opacity-100')
        }
        style={{ top: where === 'center' ? height / 2 - 22 : height - 44 - 16, background: c.ink, color: c.on, boxShadow: '0 6px 24px rgba(20,19,16,0.18)' }}
      >
        <Bot size={24} color={c.on} eyeColor={c.ink} look={busy || failed ? look : undefined} happy={phase === 'landed'} mood={failed ? -1 : 0} poke={false} follow={0.5} />
        <span className="tabular-nums" style={{ minWidth: busy ? 38 : undefined, textAlign: 'left' }}>{label}</span>
        {failed ? <span className="-mr-1 ml-1 rounded-full px-2.5 py-1 text-[13px]" style={{ background: c.on, color: c.ink }}>Try again</span> : null}
      </button>
      <span className="sr-only" role="status">{phase === 'landed' ? `${pic?.alt} is ready` : failed ? failText : ''}</span>
    </div>
  )
}
