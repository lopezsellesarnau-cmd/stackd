'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Jelly folder · StackD Kit
 * A folder for a dashboard that you fill with files and photos, and it feels soft. Drag files from your desktop over
 * it and the front flap opens to take them; drop, and each one flies in along an arc. When it lands the folder squashes
 * like a sponge and springs back. Point at it and the papers inside peek out and fan open.
 * Photos show as little prints, other files as paper with their extension.
 *
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type FolderItem = { id: string; name: string; kind: 'photo' | 'file'; src?: string }

type Props = {
  /** The folder's name, on its front. */
  name?: string
  /** What's inside to start with. */
  items?: FolderItem[]
  /** Called with the new items when files are dropped in (or added with the button). */
  onAdd?: (added: FolderItem[], all: FolderItem[]) => void
  /** Show the Add button. Its items come from addNext. */
  addButton?: boolean
  /** What the Add button puts in, one each press, in turn. */
  addNext?: FolderItem[]
  /** The folder's colour. Default: ink on light, cream on dark. */
  color?: string
  theme?: 'light' | 'dark'
  width?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const THEMES = {
  light: { card: '#FFFFFF', ink: '#141310', mute: 'rgba(20,19,16,0.45)', line: 'rgba(20,19,16,0.09)', folder: '#141310', paper: '#FFFFFF' },
  dark: { card: '#141310', ink: '#F2F0EC', mute: 'rgba(242,240,236,0.45)', line: 'rgba(242,240,236,0.11)', folder: '#F2F0EC', paper: '#FFFFFF' },
}
const rgb = (hex: string) => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (hex: string, to: number, k: number) => `rgb(${rgb(hex).map((v) => Math.round(v + (to - v) * k)).join(',')})`
const light = (hex: string) => { const [r, g, b] = rgb(hex); return r * 0.3 + g * 0.59 + b * 0.11 > 150 }

export const FOLDER_DEMO: FolderItem[] = [
  { id: 'd1', name: 'Brief.pdf', kind: 'file' },
  { id: 'd2', name: 'Street.jpg', kind: 'photo', src: '/glass/street.jpg' },
  { id: 'd3', name: 'Budget.xlsx', kind: 'file' },
]
export const FOLDER_MORE: FolderItem[] = [
  { id: 'm1', name: 'Autumn.jpg', kind: 'photo', src: '/glass/autumn.jpg' },
  { id: 'm2', name: 'Notes.md', kind: 'file' },
  { id: 'm3', name: 'Strokes.jpg', kind: 'photo', src: '/glass/abstract.jpg' },
  { id: 'm4', name: 'Contract.pdf', kind: 'file' },
  { id: 'm5', name: 'Lattice.jpg', kind: 'photo', src: '/views/4.jpg' },
]

// ── a spring for each soft thing: the squash, the flap, the fan ──
type Spring = { x: number; v: number; to: number; k: number; c: number }
const spring = (k: number, c: number): Spring => ({ x: 0, v: 0, to: 0, k, c })

/** One item, as it looks in the folder or in flight: a little print, or a sheet with its extension. */
function Sheet({ item, paper }: { item: FolderItem; paper: string }) {
  if (item.kind === 'photo') {
    return (
      <div className="overflow-hidden rounded-[7px] p-[3px]" style={{ width: 74, height: 58, background: paper, boxShadow: '0 0 0 0.6px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.18)' }}>
        {item.src ? <img src={item.src} alt="" draggable={false} className="h-full w-full rounded-[4px] object-cover" /> : <div className="h-full w-full rounded-[4px] bg-black/10" />}
      </div>
    )
  }
  const ext = (item.name.split('.').pop() || 'file').slice(0, 4).toUpperCase()
  return (
    <div className="relative" style={{ width: 56, height: 70, filter: 'drop-shadow(0 0 0.6px rgba(0,0,0,0.35)) drop-shadow(0 2px 4px rgba(0,0,0,0.16))' }}>
    <div className="relative h-full w-full" style={{ background: paper, borderRadius: 7, clipPath: 'polygon(0 0, 72% 0, 100% 22%, 100% 100%, 0 100%)' }}>
      {/* the folded corner */}
      <div className="absolute right-0 top-0" style={{ width: '28%', height: '22%', background: 'rgba(0,0,0,0.08)', borderBottomLeftRadius: 4 }} />
      {/* a few lines of text */}
      <div className="absolute left-[9px] right-[12px] top-[24px] space-y-[5px]">
        {[1, 0.8, 0.9].map((w, i) => <div key={i} className="h-[2px] rounded-full bg-black/12" style={{ width: `${w * 100}%` }} />)}
      </div>
      <span className="absolute bottom-[7px] left-[8px] text-[9px] font-semibold tracking-[0.04em] text-black/55">{ext}</span>
    </div>
    </div>
  )
}

type Flight = { item: FolderItem; from: { x: number; y: number } }

export function JellyFolder({ name = 'Project', items: initial = FOLDER_DEMO, onAdd, addButton = true, addNext = FOLDER_MORE, color, theme = 'light', width = 320, className = '' }: Props) {
  const c = THEMES[theme]
  const front = color ?? c.folder
  const back = light(front) ? mix(front, 0, 0.12) : mix(front, 255, 0.14)
  const label = light(front) ? '#141310' : '#FFFFFF'
  const [items, setItems] = useState<FolderItem[]>(initial)
  const [flights, setFlights] = useState<(Flight & { key: number })[]>([])
  const [over, setOver] = useState(false)
  const [hover, setHover] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const fan = useRef<(HTMLDivElement | null)[]>([])
  const next = useRef(0)
  const key = useRef(0)
  const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const S = useRef({ squash: spring(320, 9), open: spring(260, 18), peek: spring(220, 16), raf: 0 })
  const W = width, FW = Math.round(W * 0.78), FH = Math.round(FW * 0.7)
  const shown = items.slice(-5)

  // ── draw the springs onto the folder ──
  const paint = useCallback(() => {
    const { squash, open, peek } = S.current
    if (body.current) body.current.style.transform = `scale(${1 + squash.x * 0.06}, ${1 - squash.x * 0.09})`
    if (flap.current) flap.current.style.transform = `perspective(700px) rotateX(${-open.x * 32}deg) skewX(${squash.x * -1.5}deg)`
    const n = shown.length
    fan.current.forEach((el, i) => {
      if (!el) return
      const m = i - (n - 1) / 2
      const p = peek.x, o = open.x
      const x = m * (10 + p * 30)
      const y = -(16 + p * 30 + o * 16) - (i % 2) * (4 + p * 6) + Math.abs(m) * p * 6 - squash.x * 8
      const r = m * (3 + p * 7)
      el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`
    })
  }, [shown.length])

  const run = useCallback(() => {
    const st = S.current
    if (st.raf) return
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(32, now - last) / 1000
      last = now
      let busy = false
      for (const sp of [st.squash, st.open, st.peek]) {
        for (let k = 0; k < 2; k++) {
          sp.v += (sp.k * (sp.to - sp.x) - sp.c * sp.v) * (dt / 2)
          sp.x += sp.v * (dt / 2)
        }
        if (Math.abs(sp.to - sp.x) > 0.001 || Math.abs(sp.v) > 0.001) busy = true
        else { sp.x = sp.to; sp.v = 0 }
      }
      paint()
      st.raf = busy ? requestAnimationFrame(frame) : 0
    }
    st.raf = requestAnimationFrame(frame)
  }, [paint])

  useEffect(() => { paint() }, [paint, items])
  useEffect(() => () => { cancelAnimationFrame(S.current.raf); S.current.raf = 0 }, [])

  // the flap opens wide while files hover over it or fly in, a little when you point at it; the papers fan on hover
  useEffect(() => {
    const st = S.current
    st.open.to = over ? 1 : flights.length ? 0.75 : hover ? 0.25 : 0
    st.peek.to = hover && !over ? 1 : over ? 0.4 : 0
    if (still) { st.open.x = st.open.to; st.peek.x = st.peek.to; paint() } else run()
  }, [over, hover, flights.length, run, paint, still])

  // one item landed: into the folder, and the folder squashes
  const land = (f: Flight & { key: number }) => {
    setFlights((all) => all.filter((x) => x.key !== f.key))
    setItems((all) => [...all, f.item])
    const st = S.current
    if (!still) { st.squash.v += 4.2; run() }
  }

  const send = (added: FolderItem[], from: { x: number; y: number }) => {
    if (!added.length) return
    onAdd?.(added, [...items, ...added])
    if (still) { setItems((all) => [...all, ...added]); return }
    added.forEach((item, i) => {
      setTimeout(() => setFlights((all) => [...all, { item, from: { x: from.x + i * 6, y: from.y - i * 4 }, key: key.current++ }]), i * 110)
    })
  }

  // where things fly to: the folder's mouth
  const mouth = () => ({ x: W / 2, y: (card.current?.querySelector('[data-folder]') as HTMLElement | null)?.offsetTop ?? 60 })

  const flightRef = (f: Flight & { key: number }) => (el: HTMLDivElement | null) => {
    if (!el || el.dataset.flying) return
    el.dataset.flying = '1'
    const to = mouth()
    const dx = to.x - f.from.x, dy = to.y + FH * 0.25 - f.from.y
    const spin = (Math.random() - 0.5) * 50
    const a = el.animate(
      [
        { transform: `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) rotate(${spin}deg) scale(1.06)`, opacity: 1, offset: 0.5 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${spin * 0.3}deg) scale(0.7)`, opacity: 1 },
      ],
      { duration: 620, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' },
    )
    a.onfinish = () => land(f)
  }

  const pos = (e: { clientX: number; clientY: number }) => {
    const r = card.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    const files = Array.from(e.dataTransfer.files)
    const added: FolderItem[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      kind: f.type.startsWith('image/') ? 'photo' : 'file',
      src: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))
    send(added, pos(e))
  }

  const onAddClick = (e: React.MouseEvent) => {
    if (!addNext.length) return
    const base = addNext[next.current % addNext.length]
    next.current++
    const item = { ...base, id: `${base.id}-${next.current}` }
    send([item], pos(e))
  }

  const count = items.length + flights.length

  return (
    <div
      ref={card}
      className={`relative flex select-none flex-col items-center rounded-[28px] ${className}`}
      style={{ width: W, padding: '28px 24px 20px', background: c.card, color: c.ink, fontFamily: FONT, boxShadow: `0 0 0 1px ${over ? c.mute : c.line}, 0 18px 40px -24px rgba(0,0,0,0.18)`, transition: 'box-shadow .25s' }}
      onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
      onDragLeave={(e) => { if (!card.current?.contains(e.relatedTarget as Node)) setOver(false) }}
      onDrop={onDrop}
    >
      {/* the folder: its back with the tab, what's inside, and the front flap */}
      <div
        data-folder
        className="relative"
        style={{ width: FW, height: FH, marginTop: 34 }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        <div ref={body} className="absolute inset-0" style={{ transformOrigin: '50% 100%' }}>
          <svg className="absolute inset-0" width={FW} height={FH} viewBox={`0 0 ${FW} ${FH}`} aria-hidden>
            <path
              d={`M0 18 Q0 4 14 4 H${FW * 0.3} Q${FW * 0.34} 4 ${FW * 0.37} 12 Q${FW * 0.4} 20 ${FW * 0.45} 20 H${FW - 16} Q${FW} 20 ${FW} 36 V${FH - 16} Q${FW} ${FH} ${FW - 16} ${FH} H16 Q0 ${FH} 0 ${FH - 16} Z`}
              fill={back}
            />
          </svg>
          {/* what's inside, newest on top, peeking out of the mouth */}
          <div className="absolute inset-x-0 flex justify-center" style={{ top: FH * 0.2 }}>
            {shown.map((it, i) => (
              <div key={it.id} ref={(el) => { fan.current[i] = el }} className="absolute" style={{ transformOrigin: '50% 100%' }}>
                <Sheet item={it} paper={c.paper} />
              </div>
            ))}
          </div>
          {/* the front flap, hinged at the bottom */}
          <div
            ref={flap}
            className="absolute inset-x-0 bottom-0 flex flex-col justify-end overflow-hidden"
            style={{ height: FH * 0.74, background: front, borderRadius: 18, transformOrigin: '50% 100%', boxShadow: `inset 0 1px 0 ${light(front) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.14)'}, 0 -6px 14px -8px rgba(0,0,0,0.35)`, padding: '0 16px 14px', color: label }}
          >
            <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">{name}</p>
            <p className="mt-0.5 text-[12px] tabular-nums" style={{ opacity: 0.6 }}>{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
      </div>

      {/* in flight */}
      {flights.map((f) => (
        <div key={f.key} ref={flightRef(f)} className="pointer-events-none absolute z-20" style={{ left: f.from.x, top: f.from.y, transform: 'translate(-50%, -50%)' }}>
          <Sheet item={f.item} paper={c.paper} />
        </div>
      ))}

      <p className="mt-4 text-[12px]" style={{ color: c.mute }}>{over ? 'Drop to add' : 'Drop files or photos here'}</p>
      {addButton ? (
        <button
          type="button"
          onClick={onAddClick}
          className="mt-3 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-transform hover:scale-[1.04] active:scale-95"
          style={{ boxShadow: `inset 0 0 0 1px ${c.line}` }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 3a1.6 1.6 0 0 1 1.6 1.6v5.8h5.8a1.6 1.6 0 0 1 0 3.2h-5.8v5.8a1.6 1.6 0 0 1-3.2 0v-5.8H4.6a1.6 1.6 0 0 1 0-3.2h5.8V4.6A1.6 1.6 0 0 1 12 3Z" /></svg>
          Add
        </button>
      ) : null}
    </div>
  )
}
