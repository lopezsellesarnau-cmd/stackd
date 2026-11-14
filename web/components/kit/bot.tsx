'use client'

import { useEffect, useId, useRef } from 'react'

/**
 * Bot · StackD Kit 01
 * A bot whose eyes follow the cursor around the page, and blink now and then.
 * With `mood` its eyelids show how it feels: droopy when sad, smiling eyes when glad.
 * Four bodies, four kinds of eyes, any colour.
 *
 * The eyes are points on a sphere: when the bot turns, an eye heading for the
 * edge moves less and gets narrower, so a flat shape reads as round.
 * Drawn straight to the SVG every frame; a pointer move is not a React render.
 * React + Tailwind, no other dependencies.
 */

/* The bodies, in a 100-unit box. cx/cy is where the face rests, rx/ry how far the eyes can travel. */
export const SHAPES = {
  circle: { d: 'M50 0a50 50 0 1 1 0 100a50 50 0 1 1 0-100Z', cx: 50, cy: 50, rx: 50, ry: 50 },
  squircle: { d: 'M36 4h28c18 0 32 14 32 32v28c0 18-14 32-32 32H36C18 96 4 82 4 64V36C4 18 18 4 36 4Z', cx: 50, cy: 50, rx: 46, ry: 46 },
  pill: { d: 'M36 18h28a32 32 0 0 1 0 64H36a32 32 0 0 1 0-64Z', cx: 50, cy: 50, rx: 46, ry: 32 },
  arch: { d: 'M50 6c22 0 40 18 40 40v40c0 5.5-4.5 10-10 10H20c-5.5 0-10-4.5-10-10V46C10 24 28 6 50 6Z', cx: 50, cy: 52, rx: 40, ry: 44 },
} as const

/* The eyes: width, height and corner, in the same units. */
export const EYES = {
  round: { w: 17, h: 17, r: 8.5 },
  tall: { w: 11, h: 21, r: 5.5 },
  square: { w: 16, h: 16, r: 3.5 },
  wide: { w: 22, h: 9, r: 4.5 },
} as const

export type BotShape = keyof typeof SHAPES
export type BotEyes = keyof typeof EYES

type Props = {
  /** Size in px. */
  size?: number
  shape?: BotShape
  eyes?: BotEyes
  /** Body colour, any CSS colour. */
  color?: string
  /** Eye colour, any CSS colour. */
  eyeColor?: string
  /** How far it turns towards the cursor, 0 to 1. */
  follow?: number
  /** Fixed direction to look at instead of the cursor, -1 to 1 on each axis. */
  look?: { x: number; y: number }
  /** Happy eyes. */
  happy?: boolean
  /** How it feels, -1 (sad: the lids droop) to 1 (glad: the eyes smile). 0 = neutral. */
  mood?: number
  /** Only watch the cursor inside the nearest ancestor matching this selector (a card, say). Unset: the whole page. */
  within?: string
  className?: string
}

const SPACING = 13 // from the centre to each eye, in units
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function Bot({
  size = 112,
  shape = 'circle',
  eyes: eyeStyle = 'round',
  color = '#111111',
  eyeColor = '#FFFFFF',
  follow = 0.8,
  look,
  happy = false,
  mood = 0,
  within,
  className = '',
}: Props) {
  const ball = useRef<SVGSVGElement>(null)
  const eyes = useRef<(SVGRectElement | null)[]>([])
  const groups = useRef<(SVGGElement | null)[]>([])
  const tops = useRef<(SVGRectElement | null)[]>([])
  const bottoms = useRef<(SVGEllipseElement | null)[]>([])
  const clip = `bot-${useId().replace(/:/g, '')}`
  // Where the face should point; the loop springs towards it
  const aim = useRef({ x: 0, y: 0, m: 0 })
  const kick = useRef<() => void>(() => {})
  const props = useRef({ follow, look, happy, mood, shape, eyeStyle })
  props.current = { follow, look, happy, mood, shape, eyeStyle }

  // A fixed look, a new shape or new eyes: redraw
  useEffect(() => {
    if (look) aim.current = { ...aim.current, x: look.x, y: look.y }
    aim.current.m = clamp(mood, -1, 1)
    kick.current()
  }, [look?.x, look?.y, happy, mood, shape, eyeStyle])

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = { x: 0, y: 0, vx: 0, vy: 0, m: 0, vm: 0 }
    let raf = 0
    let prev = 0
    let blinkAt = -1e9
    let blinkTimer = 0

    const draw = (now: number) => {
      const body = SHAPES[props.current.shape]
      const eye = EYES[props.current.eyeStyle]
      const since = now - blinkAt
      const lid = since < 160 ? 1 - 0.9 * Math.sin((since / 160) * Math.PI) : 1
      const yaw = Math.asin(clamp(t.x, -0.92, 0.92))
      const pitch = -Math.asin(clamp(t.y, -0.92, 0.92))
      const tilt = 60 * t.x * t.y // a diagonal look leans the pair
      const g = SPACING / body.rx
      ;[-g, g].forEach((x0, i) => {
        const el = eyes.current[i]
        const grp = groups.current[i]
        if (!el || !grp) return
        // The eye as a point on the unit sphere, turned with the bot
        const z0 = Math.sqrt(1 - x0 * x0)
        const x1 = x0 * Math.cos(yaw) + z0 * Math.sin(yaw)
        const z1 = -x0 * Math.sin(yaw) + z0 * Math.cos(yaw)
        const y2 = -z1 * Math.sin(pitch)
        const z2 = z1 * Math.cos(pitch)
        // Nearer the edge: smaller, and narrower across the turn
        const near = clamp(z2, 0, 1)
        const k = 0.45 + 0.55 * near
        let w = eye.w * k * (0.7 + 0.3 * near)
        let h = Math.max(0.8, eye.h * k * lid)
        if (props.current.happy) {
          w = Math.max(w, 17 * k) * 1.1
          h = 5
        }
        el.setAttribute('x', (-w / 2).toFixed(2))
        el.setAttribute('y', (-h / 2).toFixed(2))
        el.setAttribute('width', w.toFixed(2))
        el.setAttribute('height', h.toFixed(2))
        el.setAttribute('rx', Math.min(eye.r, w / 2, h / 2).toFixed(2))
        grp.setAttribute(
          'transform',
          `translate(${(body.cx + x1 * body.rx).toFixed(2)} ${(body.cy + y2 * body.ry).toFixed(2)}) rotate(${tilt.toFixed(2)})`,
        )
        grp.style.opacity = z2 < 0.05 ? '0' : '1'
        // The lids, in the body's colour. Sad: a top lid that droops to the outside. Glad: a round
        // lower lid that pushes up, so the eye smiles. Hidden at 0 and on happy eyes.
        const top = tops.current[i]
        const bottom = bottoms.current[i]
        const m = props.current.happy ? 0 : t.m
        const H = eye.h * k // the open height, so a blink doesn't move the lids
        if (top) {
          const cut = Math.max(0, -m) * 0.42 * H
          const a = Math.max(0, -m) * 30 * (i === 0 ? -1 : 1)
          top.setAttribute('x', (-w * 1.4).toFixed(2))
          top.setAttribute('y', (-H / 2 - H * 1.5 + cut).toFixed(2))
          top.setAttribute('width', (w * 2.8).toFixed(2))
          top.setAttribute('height', (H * 1.5).toFixed(2))
          top.setAttribute('transform', `rotate(${a.toFixed(2)} 0 ${(-H / 2 + cut).toFixed(2)})`)
          top.style.display = cut > 0.05 ? '' : 'none'
        }
        if (bottom) {
          const push = Math.max(0, m) * 0.62 * H
          const ry = H * 0.5
          bottom.setAttribute('rx', (w * 1.1).toFixed(2))
          bottom.setAttribute('ry', ry.toFixed(2))
          bottom.setAttribute('cy', (H / 2 + ry - push).toFixed(2))
          bottom.style.display = push > 0.05 ? '' : 'none'
        }
      })
    }

    const tick = (now: number) => {
      const dt = prev ? Math.min(2.5, (now - prev) / 16.67) : 1
      prev = now
      const { x: tx, y: ty, m: tm } = aim.current
      if (still) {
        t.x = tx
        t.y = ty
        t.m = tm
      } else {
        // One spring for both axes; the damping is raised to dt so a dropped frame behaves the same
        const damp = Math.pow(0.74, dt)
        t.vx = (t.vx + (tx - t.x) * 0.07 * dt) * damp
        t.vy = (t.vy + (ty - t.y) * 0.07 * dt) * damp
        t.x += t.vx * dt
        t.y += t.vy * dt
        t.vm = (t.vm + (tm - t.m) * 0.09 * dt) * Math.pow(0.7, dt)
        t.m += t.vm * dt
      }
      draw(now)
      const settled =
        Math.abs(tx - t.x) + Math.abs(ty - t.y) + Math.abs(t.vx) + Math.abs(t.vy) + Math.abs(tm - t.m) + Math.abs(t.vm) < 0.002
      if (settled && now - blinkAt > 160) {
        raf = 0
        prev = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }
    kick.current = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Blink every few seconds
    const blink = () => {
      blinkTimer = window.setTimeout(() => {
        blinkAt = performance.now()
        kick.current()
        blink()
      }, 2500 + Math.random() * 3000)
    }
    if (!still) blink()

    // In a card, it only watches the cursor while the cursor is inside that card
    const frame = within ? ball.current?.closest<HTMLElement>(within) : null

    // Follow the cursor, unless it has been told where to look
    const move = (e: PointerEvent) => {
      if (props.current.look) return
      const r = ball.current?.getBoundingClientRect()
      if (!r) return
      let reach = 220
      if (frame) {
        const f = frame.getBoundingClientRect()
        if (e.clientX < f.left || e.clientX > f.right || e.clientY < f.top || e.clientY > f.bottom) return rest()
        // Measured against the card, so the eyes reach the edge as the cursor does
        reach = Math.max(60, Math.min(f.width, f.height) * 0.3)
      }
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const far = Math.min(0.85, Math.tanh(d / reach) * clamp(props.current.follow, 0, 1))
      aim.current = { ...aim.current, x: (dx / d) * far, y: (dy / d) * far }
      kick.current()
    }
    const rest = () => {
      if (props.current.look) return
      aim.current = { ...aim.current, x: 0, y: 0 }
      kick.current()
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', rest)
    kick.current()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(blinkTimer)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', rest)
    }
  }, [within])

  const body = SHAPES[shape]
  return (
    <svg ref={ball} aria-hidden viewBox="0 0 100 100" width={size} height={size} className={className}>
      <defs>
        <clipPath id={clip}>
          <path d={body.d} />
        </clipPath>
      </defs>
      <path d={body.d} fill={color} />
      <g clipPath={`url(#${clip})`} fill={eyeColor}>
        {[0, 1].map((i) => (
          <g
            key={i}
            ref={(el) => {
              groups.current[i] = el
            }}
          >
            <rect
              ref={(el) => {
                eyes.current[i] = el
              }}
            />
            <rect
              fill={color}
              style={{ display: 'none' }}
              ref={(el) => {
                tops.current[i] = el
              }}
            />
            <ellipse
              cx={0}
              fill={color}
              style={{ display: 'none' }}
              ref={(el) => {
                bottoms.current[i] = el
              }}
            />
          </g>
        ))}
      </g>
    </svg>
  )
}
