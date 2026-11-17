'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PullToRefresh } from './kit/pull-to-refresh'
import { Bot } from './kit/bot'

// The store demo for Pull to refresh (kit 21): a sales feed for the StackD store. Pull to refresh brings in a new sale and the total
// counts up. Each row has a tiny drawing of the component that sold.

const INK = '#141310'
const MONO = 'ui-monospace, "SF Mono", "IBM Plex Mono", Menlo, monospace'

/** Tiny drawings of each component, 44 × 44 */
const THUMBS: Record<string, () => ReactNode> = {
  memo: () => (
    <div className="flex h-full items-center justify-center gap-[2px]">
      {[6, 14, 9, 20, 12, 24, 10, 16, 7].map((h, i) => (
        <span key={i} className="w-[2px] rounded-full" style={{ height: h, background: i > 1 && i < 7 ? '#FFFFFF' : 'rgba(255,255,255,.3)' }} />
      ))}
    </div>
  ),
  clock: () => (
    <svg viewBox="0 0 44 44" className="h-full w-full">
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="22" y1="8" x2="22" y2={i % 3 ? 10 : 12} stroke="#FFFFFF" strokeWidth={i % 3 ? 1 : 1.6} strokeLinecap="round" transform={`rotate(${i * 30} 22 22)`} />
      ))}
      <line x1="22" y1="22" x2="22" y2="13" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" transform="rotate(50 22 22)" />
      <line x1="22" y1="22" x2="22" y2="16" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" transform="rotate(-60 22 22)" />
      <circle cx="22" cy="22" r="1.6" fill="#BE9344" />
    </svg>
  ),
  flap: () => (
    <div className="flex h-full items-center justify-center gap-[3px]">
      {['2', '4'].map((c) => (
        <span key={c} className="relative flex h-[22px] w-[15px] items-center justify-center rounded-[3px] bg-[#2A2925] text-[14px] font-semibold text-white">
          {c}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
        </span>
      ))}
    </div>
  ),
  bot: () => (
    <div className="flex h-full items-center justify-center">
      <Bot size={26} eyes="tall" color="#FFFFFF" eyeColor={INK} look={{ x: 0.3, y: 0.1 }} />
    </div>
  ),
  pay: () => (
    <div className="flex h-full items-center px-[6px]">
      <span className="flex h-[16px] w-full items-center rounded-full bg-white/15 p-[2px]">
        <span className="h-[12px] w-[12px] rounded-full bg-white" />
      </span>
    </div>
  ),
  compare: () => (
    <div className="relative h-full w-full overflow-hidden">
      <img src="/glass/street.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <img src="/glass/street-raw.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: 'inset(0 50% 0 0)' }} />
      <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-white" />
    </div>
  ),
  swap: () => (
    <div className="relative h-full w-full">
      {[0, 1, 2].map((i) => (
        <span key={i} className="absolute left-1/2 top-1/2 h-[24px] w-[18px] rounded-[4px] border border-white/20" style={{ background: ['#6C8544', '#BE9344', '#C9B8FF'][i], transform: `translate(-50%,-50%) translate(${(i - 1) * 4}px, ${(1 - i) * 2}px) rotate(${(i - 1) * 8}deg)` }} />
      ))}
    </div>
  ),
}

type Sale = { id: number; kind: keyof typeof THUMBS; name: string; where: string; when: string; fresh?: boolean }

const START: Sale[] = [
  { id: 1, kind: 'clock', name: 'World clock', where: 'Amsterdam', when: '9:41' },
  { id: 2, kind: 'memo', name: 'Voice memo', where: 'Berlin', when: '9:12' },
  { id: 3, kind: 'compare', name: 'Before / after', where: 'Lisbon', when: '8:30' },
  { id: 4, kind: 'flap', name: 'Split flap', where: 'New York', when: '8:02' },
  { id: 5, kind: 'swap', name: 'Card swap', where: 'Madrid', when: 'Mon' },
  { id: 6, kind: 'pay', name: 'Slide to pay', where: 'London', when: 'Mon' },
  { id: 7, kind: 'memo', name: 'Voice memo', where: 'Tokyo', when: 'Sun' },
]
const NEXT: Omit<Sale, 'id' | 'when'>[] = [
  { kind: 'bot', name: 'Bot', where: 'Paris' },
  { kind: 'clock', name: 'World clock', where: 'San Francisco' },
  { kind: 'memo', name: 'Voice memo', where: 'Seoul' },
  { kind: 'flap', name: 'Split flap', where: 'Milan' },
]

/** A number that counts to its new value */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const a = from.current, start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      const e = 1 - Math.pow(1 - t, 3)
      setShown(a + (value - a) * e)
      if (t < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(Math.round(shown))}</>
}

export function PullFeed({ dark = false, height = 470 }: { dark?: boolean; height?: number }) {
  const [sales, setSales] = useState(START)
  const [total, setTotal] = useState(1284)
  const [n, setN] = useState(0)
  const refresh = () =>
    new Promise<void>((done) =>
      setTimeout(() => {
        setSales((s) => [{ ...NEXT[n % NEXT.length], id: Date.now(), when: 'now', fresh: true }, ...s.map((x) => ({ ...x, fresh: false }))])
        setTotal((t) => t + 7)
        setN((v) => v + 1)
        done()
      }, 2200),
    )
  const euro = (v: number) => `€${v.toLocaleString('en-US')}`

  return (
    <>
      <div className="w-[360px] overflow-hidden rounded-[36px] shadow-[0_30px_60px_rgba(20,19,16,0.12)] ring-1 ring-[#141310]/5" style={{ color: dark ? '#FFFFFF' : INK, background: dark ? INK : '#FFFFFF' }}>
        {/* Header: the week's total, counting up when a sale lands */}
        <div className="px-6 pb-4 pt-6">
          <div className="flex items-center justify-between text-[12px]">
            <span className="opacity-45">StackD · This week</span>
            <span className="flex items-center gap-1.5 opacity-45">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6C8544]" /> Live
            </span>
          </div>
          <p className="mt-2 text-[44px] font-medium leading-none tracking-[-0.04em]" style={{ fontFamily: MONO }}>
            <Count value={total} format={euro} />
          </p>
          <p className="mt-2 text-[13px] opacity-50" style={{ fontFamily: MONO }}>
            {Math.round(total / 7)} sales · €7 each
          </p>
        </div>

        <PullToRefresh onRefresh={refresh} theme={dark ? 'dark' : 'light'} className="relative" style={{ height }}>
          <ul className="pb-4">
            {sales.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3.5 px-6 py-3 transition-colors duration-[1500ms]"
                style={{ background: s.fresh ? (dark ? '#2A2722' : '#F7F3EA') : 'transparent', animation: s.fresh ? 'sale-in .6s cubic-bezier(.3,1.3,.5,1)' : undefined }}
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px]" style={{ background: dark ? '#2A2925' : INK }}>
                  {THUMBS[s.kind]()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-tight">{s.name}</span>
                  <span className="block text-[12px] leading-tight opacity-45">
                    {s.where} · {s.when}
                  </span>
                </span>
                <span className="text-[15px]" style={{ fontFamily: MONO }}>+€7</span>
              </li>
            ))}
          </ul>
        </PullToRefresh>
      </div>
      <style>{`@keyframes sale-in{from{opacity:0;transform:translateY(-14px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </>
  )
}
