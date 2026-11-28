'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, type BotShape } from './bot'

/**
 * Live feed · StackD Kit
 * What's happening, as it happens. New events spring in at the top with a small bounce, the rest slide down to make
 * room, and the oldest fades out at the bottom. Each one has a little Bot as its face, who did what, where, and a
 * time that keeps counting up; payments show their amount. Point at the feed and it holds still so you can read it.
 *
 * Plug in your own events with next (or push them in with events). React + Tailwind, needs the Bot (Kit 01).
 * Respects reduced motion.
 */

export type FeedEvent = {
  id: string | number
  /** Who: shown in bold. */
  who: string
  /** What they did, after the name. */
  what: string
  /** Where, under it. */
  where?: string
  /** A value on the right, like '+€29'. */
  amount?: string
  /** When it happened (ms). Default: when it arrived. */
  at?: number
  /** The avatar's shape. */
  shape?: BotShape
}

type Props = {
  /** Where new events come from. Default: a made-up stream of sign-ups, upgrades, deploys and reviews. */
  next?: () => FeedEvent
  /** Roughly how often a new one arrives, ms (it varies a little, like real life). */
  every?: number
  /** How many show at once. */
  max?: number
  theme?: 'light' | 'dark'
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const THEMES = {
  light: { ink: '#141310', mute: 'rgba(20,19,16,0.45)', line: 'rgba(20,19,16,0.07)', eye: '#FFFFFF', good: '#6C8544' },
  dark: { ink: '#F2F0EC', mute: 'rgba(242,240,236,0.45)', line: 'rgba(242,240,236,0.08)', eye: '#141310', good: '#8FAE5E' },
}
const ROW = 56

const NAMES = ['Ana', 'Lucas', 'Mei', 'Omar', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Lena', 'Kai', 'Nora', 'Theo', 'Aisha', 'Hugo', 'Yuki', 'Ines']
const CITIES = ['Lisbon', 'Berlin', 'Tokyo', 'New York', 'São Paulo', 'Amsterdam', 'Mumbai', 'Seoul', 'Madrid', 'Toronto', 'Lagos', 'Sydney']
const SHAPES: BotShape[] = ['hexagon', 'circle', 'squircle', 'pill', 'arch', 'drop', 'cloud', 'clover', 'triangle']
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
let seq = 0
export const demoEvent = (): FeedEvent => {
  const r = Math.random()
  const base = { id: `e${seq++}`, who: pick(NAMES), where: pick(CITIES), shape: pick(SHAPES) }
  if (r < 0.34) return { ...base, what: 'signed up' }
  if (r < 0.56) return { ...base, what: 'upgraded to Pro', amount: '+€29' }
  if (r < 0.7) return { ...base, what: `deployed v${2 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 10)}` }
  if (r < 0.84) return { ...base, what: 'left a 5★ review' }
  return { ...base, what: `invited ${2 + Math.floor(Math.random() * 4)} teammates` }
}

const ago = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 5 ? 'now' : s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`
}

export function LiveFeed({ next, every = 2600, max = 5, theme = 'light', className = '' }: Props) {
  const c = THEMES[theme]
  const src = useRef(next); src.current = next
  // the first events are made in the browser (they're random), so a server render and the page agree
  const [list, setList] = useState<(FeedEvent & { at: number })[]>([])
  useEffect(() => {
    const now = Date.now()
    setList((l) => (l.length ? l : Array.from({ length: max }, (_, i) => ({ ...demoEvent(), at: now - (i + 1) * 9000 - Math.random() * 6000 }))))
  }, [max])
  const [now, setNow] = useState(() => Date.now())
  const held = useRef(false)
  const fresh = useRef<Set<string | number>>(new Set())

  // new events, a little irregular, unless you're reading
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const go = () => {
      t = setTimeout(() => {
        if (!held.current) {
          const e = (src.current ?? demoEvent)()
          fresh.current.add(e.id)
          setList((l) => [{ ...e, at: e.at ?? Date.now() }, ...l].slice(0, max + 1))
        }
        go()
      }, every * (0.6 + Math.random() * 0.8))
    }
    go()
    return () => clearTimeout(t)
  }, [every, max])

  // the times keep counting
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  return (
    <div
      className={`relative ${className}`}
      style={{ height: ROW * max, fontFamily: FONT, color: c.ink }}
      onPointerEnter={() => { held.current = true }}
      onPointerLeave={() => { held.current = false }}
      role="log"
      aria-live="polite"
      aria-label="Live activity"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes livefeed-in { 0% { transform: scale(.82); opacity: 0 } 55% { transform: scale(1.025); opacity: 1 } 80% { transform: scale(.995) } 100% { transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { [data-livefeed] { transition: none !important; animation: none !important } }
      ` }} />
      {list.map((e, i) => {
        const gone = i >= max
        const isNew = fresh.current.has(e.id) && i === 0
        return (
          <div
            key={e.id}
            data-livefeed
            className="absolute inset-x-0 top-0 flex items-center gap-3"
            style={{
              height: ROW,
              transform: `translateY(${i * ROW}px)`,
              opacity: gone ? 0 : 1 - Math.max(0, i - (max - 2)) * 0.35,
              transition: 'transform .55s cubic-bezier(.3,1.35,.5,1), opacity .4s',
              borderTop: i === 0 ? 'none' : `1px solid ${c.line}`,
            }}
          >
            <div className="flex w-full items-center gap-3" style={{ transformOrigin: '0% 50%', animation: isNew ? 'livefeed-in .6s cubic-bezier(.3,.7,.4,1) both' : undefined }}>
              <Bot size={30} shape={e.shape ?? 'circle'} color={c.ink} eyeColor={c.eye} follow={0} poke={false} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] leading-tight"><span className="font-semibold">{e.who}</span> {e.what}</p>
                <p className="mt-0.5 truncate text-[12px] leading-tight" style={{ color: c.mute }}>{e.where ? `${e.where} · ` : ''}{ago(now - e.at)}</p>
              </div>
              {e.amount ? <span className="text-[13px] font-semibold tabular-nums" style={{ color: c.good }}>{e.amount}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
