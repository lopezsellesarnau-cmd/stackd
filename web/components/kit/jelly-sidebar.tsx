'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bot } from './bot'

/**
 * Jelly sidebar · StackD Kit
 * An app's side menu that moves like jelly. Fold it into a rail of icons or open it into the full menu: the
 * width springs and overshoots a little. The item you're on sits on a blob that slides to the next one,
 * stretching on the way (the edge in front leaves first, the other catches up). In the rail, pointing at an
 * icon pops its name out beside it. Groups open with their items dropping in one by one, and items can carry
 * a count. At the bottom, you, with the Bot as your avatar.
 *
 * React + Tailwind and the StackD Bot, no other dependencies. Mouse, touch and keyboard
 * (arrows move, Enter picks, [ folds it). Respects reduced motion.
 */

export type SidebarIcon = 'home' | 'inbox' | 'chart' | 'folder' | 'calendar' | 'users' | 'settings' | 'search' | 'spark' | 'help' | 'doc'
export type SidebarItem = { id: string; label: string; icon?: SidebarIcon; badge?: number; children?: SidebarItem[] }

type Props = {
  items: SidebarItem[]
  /** Items pinned to the bottom (settings, help). */
  footer?: SidebarItem[]
  brand?: string
  user?: { name: string; detail?: string }
  /** The item you're on. Leave it out to let the sidebar keep track. */
  active?: string
  onSelect?: (item: SidebarItem) => void
  defaultCollapsed?: boolean
  theme?: 'light' | 'dark'
  height?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const OPEN = 248, RAIL = 68
const THEMES = {
  light: { bg: '#FFFFFF', ink: '#141310', dim: 'rgba(20,19,16,0.5)', soft: 'rgba(20,19,16,0.05)', blob: '#141310', on: '#FFFFFF', line: 'rgba(20,19,16,0.08)', badge: '#BE9344' },
  dark: { bg: '#1A1916', ink: '#F2F0EC', dim: 'rgba(242,240,236,0.5)', soft: 'rgba(242,240,236,0.06)', blob: '#F2F0EC', on: '#141310', line: 'rgba(242,240,236,0.1)', badge: '#BE9344' },
}

/* Filled icons, drawn for StackD (24-unit box) */
const ICONS: Record<SidebarIcon, string> = {
  home: 'M10.6 3.5a2.2 2.2 0 0 1 2.8 0l6.4 5.3c.5.4.8 1 .8 1.7v8.3a2.2 2.2 0 0 1-2.2 2.2h-3.2v-5.2a1.4 1.4 0 0 0-1.4-1.4h-3.6A1.4 1.4 0 0 0 8.8 16v5.2H5.6a2.2 2.2 0 0 1-2.2-2.2v-8.3c0-.7.3-1.3.8-1.7z',
  inbox: 'M6.4 4h11.2a2.4 2.4 0 0 1 2.3 1.7L22 12.4V18a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 18v-5.6l2.1-6.7A2.4 2.4 0 0 1 6.4 4zm-2 8.2h4.3l1 2.4h4.6l1-2.4h4.3l-1.8-5.6a.8.8 0 0 0-.8-.6H7a.8.8 0 0 0-.8.6z',
  chart: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2.2 9.6v4.6h2.2v-4.6zm4.2-3.8v8.4h2.2V8.8zm4.2-2.2v10.6h2.2V6.6z',
  folder: 'M3 7.2A2.2 2.2 0 0 1 5.2 5h3.9c.6 0 1.1.2 1.5.6L12 7h6.8A2.2 2.2 0 0 1 21 9.2v8.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8z',
  calendar: 'M7.4 2.6h1.8v1.8h5.6V2.6h1.8v1.8h1.6A2.8 2.8 0 0 1 21 7.2v11a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 18.2v-11a2.8 2.8 0 0 1 2.8-2.8h1.6zM5 9.6v8.6c0 .5.4.8.8.8h12.4c.4 0 .8-.3.8-.8V9.6z',
  users: 'M9 4a3.6 3.6 0 1 1 0 7.2A3.6 3.6 0 0 1 9 4zm7.6 1.2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM2.4 18.4c0-3 3-5.2 6.6-5.2s6.6 2.2 6.6 5.2c0 .9-.7 1.6-1.6 1.6H4c-.9 0-1.6-.7-1.6-1.6zm14.8 1.6c.2-.5.4-1 .4-1.6 0-1.8-.8-3.4-2.1-4.6a6.2 6.2 0 0 1 1.5-.2c2.8 0 5 1.8 5 4.4 0 1.1-.6 2-1.6 2z',
  settings: 'M10.3 2.5h3.4l.5 2.6c.6.2 1.2.6 1.8 1l2.5-.9 1.7 3-2 1.7a7 7 0 0 1 0 2.1l2 1.8-1.7 2.9-2.5-.9c-.6.4-1.2.8-1.8 1l-.5 2.7h-3.4l-.5-2.7a7 7 0 0 1-1.8-1l-2.5.9-1.7-2.9 2-1.8a7 7 0 0 1 0-2.1l-2-1.7 1.7-3 2.5.9c.6-.4 1.2-.8 1.8-1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  search: 'M10.5 3a7.5 7.5 0 0 1 6 12l4.2 4.3-1.4 1.4-4.3-4.2A7.5 7.5 0 1 1 10.5 3zm0 2.4a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2z',
  spark: 'M12 2.5c.5 4.6 2.4 6.9 7.5 7.5-5.1.6-7 2.9-7.5 7.5-.5-4.6-2.4-6.9-7.5-7.5 5.1-.6 7-2.9 7.5-7.5zm6.5 11.5c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3z',
  help: 'M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm0 13.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zM12 6.2c-2 0-3.5 1.2-3.7 3.1h2.2c.1-.8.7-1.2 1.5-1.2.9 0 1.4.5 1.4 1.2 0 .6-.3 1-1.1 1.5-1 .6-1.5 1.3-1.5 2.5v.5h2.1V13c0-.6.3-.9 1.1-1.4 1-.6 1.7-1.4 1.7-2.6 0-1.7-1.5-2.8-3.7-2.8z',
  doc: 'M6.5 2.5h7.2l5.3 5.3v11.7a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 19.5v-14.5a2.5 2.5 0 0 1 2.5-2.5zm6.5 1.6v4.2c0 .4.3.7.7.7h4.2z',
}
const Icon = ({ name, size = 19 }: { name: SidebarIcon; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0"><path d={ICONS[name]} fill="currentColor" fillRule="evenodd" /></svg>
)

export function JellySidebar({
  items,
  footer = [],
  brand = 'StackD',
  user = { name: 'Arnau', detail: 'Pro plan' },
  active: activeProp,
  onSelect,
  defaultCollapsed = false,
  theme = 'light',
  height = 600,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [own, setOwn] = useState(activeProp ?? items[0]?.id)
  const active = activeProp ?? own
  const [opened, setOpened] = useState<string[]>(() => items.filter((i) => i.children?.some((ch) => ch.id === active)).map((i) => i.id))
  const [tip, setTip] = useState<{ label: string; y: number } | null>(null)
  const box = useRef<HTMLElement>(null)
  const rows = useRef<Record<string, HTMLElement | null>>({})
  const still = useRef(false)

  // ── the width: a spring that overshoots a little ──
  const width = useRef({ x: defaultCollapsed ? RAIL : OPEN, v: 0 })
  const [w, setW] = useState(width.current.x)
  const raf = useRef(0)
  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const to = collapsed ? RAIL : OPEN
    if (still.current) { width.current.x = to; setW(to); return }
    cancelAnimationFrame(raf.current)
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = width.current, k = 260, d = 19
      s.v += (-k * (s.x - to) - d * s.v) * dt
      s.x += s.v * dt
      setW(s.x)
      if (Math.abs(s.x - to) > 0.3 || Math.abs(s.v) > 2) raf.current = requestAnimationFrame(tick)
      else { s.x = to; s.v = 0; setW(to) }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [collapsed])
  const wide = w > RAIL + 70 // labels show once there's room

  // ── the blob under the active item: top and bottom edges move at different speeds ──
  const [blob, setBlob] = useState<{ top: number; bottom: number; down: boolean; instant?: boolean } | null>(null)
  const current = useRef(active)
  current.current = active
  const measure = (instant = false) => {
    // the item you're on now (even from a timer set earlier); folded away inside a group, its group instead
    const parent = items.find((i) => i.children?.some((ch) => ch.id === current.current))
    const el = rows.current[current.current] ?? (parent ? rows.current[parent.id] : null)
    const host = box.current
    if (!el || !host) { setBlob(null); return }
    const a = el.getBoundingClientRect(), h = host.getBoundingClientRect()
    const k = h.height / (host.offsetHeight || h.height) // drawn scaled (a tile, a preview)? back to our own units
    const top = (a.top - h.top) / k, bottom = (h.bottom - a.bottom) / k
    setBlob((b) => ({ top, bottom, down: b ? top > b.top : true, instant }))
  }
  // picking an item: the blob slides there; folding or opening the menu: it stays glued to its item, frame by frame
  useLayoutEffect(() => measure(), [active, opened]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => measure(true), [w, collapsed]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const id = setTimeout(() => measure(), 450); return () => clearTimeout(id) }, [opened]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (it: SidebarItem) => {
    if (it.children?.length) {
      if (collapsed) setCollapsed(false)
      setOpened((o) => (o.includes(it.id) ? o.filter((x) => x !== it.id) : [...o, it.id]))
      return
    }
    setOwn(it.id)
    onSelect?.(it)
  }

  // the items in order, for the arrow keys
  const flat = [...items.flatMap((i) => [i, ...(opened.includes(i.id) && !collapsed ? i.children ?? [] : [])]), ...footer]
  const onKey = (e: React.KeyboardEvent) => {
    const at = flat.findIndex((x) => rows.current[x.id] === document.activeElement)
    const go = (i: number) => { e.preventDefault(); rows.current[flat[(i + flat.length) % flat.length].id]?.focus() }
    if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === '[') { e.preventDefault(); setCollapsed((x) => !x) }
  }

  const row = (it: SidebarItem, depth: number, i: number) => {
    const on = it.id === active
    const open = opened.includes(it.id)
    return (
      <li key={it.id} className={depth ? 'js-drop' : ''} style={depth ? { animationDelay: `${i * 45}ms` } : undefined}>
        <button
          ref={(el) => { rows.current[it.id] = el }}
          type="button"
          onClick={() => pick(it)}
          onPointerEnter={(e) => { if (!wide) { const r = e.currentTarget.getBoundingClientRect(), host = box.current!, h = host.getBoundingClientRect(), k = h.height / (host.offsetHeight || h.height); setTip({ label: it.label, y: (r.top - h.top + r.height / 2) / k }) } }}
          onPointerLeave={() => setTip(null)}
          aria-current={on ? 'page' : undefined}
          aria-expanded={it.children?.length ? open : undefined}
          aria-label={wide ? undefined : it.label}
          className="js-row relative z-[1] flex h-10 w-full items-center gap-3 rounded-[12px] text-left text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344]"
          style={{ paddingLeft: depth && wide ? 44 : 14, paddingRight: 10, color: on ? c.on : depth ? c.dim : c.ink, transition: 'color 200ms' }}
        >
          {it.icon ? <span className="js-icon"><Icon name={it.icon} /></span> : depth ? null : <span className="w-[19px]" />}
          {wide ? <span className="min-w-0 flex-1 truncate" style={{ opacity: Math.min(1, (w - RAIL - 70) / 60) }}>{it.label}</span> : null}
          {it.badge ? (
            wide ? (
              <span className="rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-[18px]" style={{ background: on ? c.on : c.badge, color: on ? c.ink : '#FFFFFF' }}>{it.badge}</span>
            ) : (
              <span className="absolute left-[34px] top-[7px] h-2 w-2 rounded-full" style={{ background: c.badge, boxShadow: `0 0 0 2px ${c.bg}` }} />
            )
          ) : null}
          {it.children?.length && wide ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.8,.5,1)]" style={{ transform: open ? 'rotate(90deg)' : undefined, color: c.dim }}>
              <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
        {open && wide && it.children?.length ? <ul>{it.children.map((ch, j) => row(ch, depth + 1, j))}</ul> : null}
      </li>
    )
  }

  return (
    <nav
      ref={box}
      aria-label="Main"
      onKeyDown={onKey}
      className={`relative flex shrink-0 flex-col overflow-visible ${className}`}
      style={{ width: w, height, background: c.bg, color: c.ink, fontFamily: FONT, borderRadius: 22, boxShadow: `0 0 0 1px ${c.line}, 0 10px 30px rgba(20,19,16,0.06)` }}
    >
      <style>{CSS}</style>
      {/* the blob: the edge it moves toward leads, the other trails */}
      {blob ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-2.5 right-2.5 rounded-[12px]"
          style={{
            top: blob.top, bottom: blob.bottom, background: c.blob,
            // going down the bottom edge leaves first and the top catches up (and the other way going up): it stretches
            transition: blob.instant ? 'none' : `top ${blob.down ? 520 : 280}ms cubic-bezier(.34,1.5,.5,1), bottom ${blob.down ? 280 : 520}ms cubic-bezier(.34,1.5,.5,1)`,
          }}
        />
      ) : null}

      {/* brand and the fold button */}
      {/* brand and the fold button; in the rail the button sits under the brand, inside the menu */}
      <div className={wide ? 'flex h-16 items-center gap-2.5 px-4' : 'flex flex-col items-center gap-2 pb-2 pt-4'}>
        <span className="shrink-0"><Bot size={26} shape="hexagon" eyes="tall" color={c.ink} eyeColor={c.bg} poke={false} /></span>
        {wide ? <span className="truncate text-[16px] font-semibold tracking-[-0.01em]" style={{ opacity: Math.min(1, (w - RAIL - 70) / 60) }}>{brand}</span> : null}
        <button
          type="button"
          onClick={() => setCollapsed((x) => !x)}
          aria-label={collapsed ? 'Open the menu' : 'Fold the menu'}
          aria-expanded={!collapsed}
          className={`js-press flex h-7 w-7 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344] ${wide ? 'ml-auto' : ''}`}
          style={{ background: c.soft }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.8,.5,1)]" style={{ transform: collapsed ? 'rotate(180deg)' : undefined }}>
            <path d="M7.5 2.5 4 6l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 [scrollbar-width:none]">{items.map((it, i) => row(it, 0, i))}</ul>

      {footer.length ? <ul className="px-2.5 pb-1">{footer.map((it, i) => row(it, 0, i))}</ul> : null}

      {/* you, with the Bot as your avatar */}
      <div className="m-2.5 mt-1 flex items-center gap-2.5 rounded-[14px] p-2" style={{ background: c.soft }}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: c.ink }}>
          <Bot size={22} color={c.bg} eyeColor={c.ink} poke={false} />
        </span>
        {wide ? (
          <span className="min-w-0" style={{ opacity: Math.min(1, (w - RAIL - 70) / 60) }}>
            <span className="block truncate text-[13px] font-semibold">{user.name}</span>
            {user.detail ? <span className="block truncate text-[12px]" style={{ color: c.dim }}>{user.detail}</span> : null}
          </span>
        ) : null}
      </div>

      {/* in the rail, the name pops out beside the icon */}
      {tip ? (
        <span key={tip.label} className="js-tip pointer-events-none absolute z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ left: w + 10, top: tip.y, background: c.ink, color: c.bg }}>
          {tip.label}
        </span>
      ) : null}
    </nav>
  )
}

const CSS = `
.js-row .js-icon{display:inline-flex;transition:transform 420ms cubic-bezier(.34,1.8,.5,1)}
.js-row:hover .js-icon{transform:scale(1.12,.92)}
.js-row:active .js-icon{transform:scale(.86,1.1);transition-duration:90ms}
.js-press{transition:transform 420ms cubic-bezier(.34,1.8,.5,1)}
.js-press:active{transform:scale(.88,.8);transition-duration:90ms}
.js-drop{animation:js-drop 520ms cubic-bezier(.3,1.6,.5,1) both}
@keyframes js-drop{0%{opacity:0;transform:translateY(-10px) scale(.94,.8)}60%{opacity:1;transform:translateY(1px) scale(1.02,1.04)}100%{opacity:1;transform:none}}
.js-tip{transform:translateY(-50%);animation:js-tip 380ms cubic-bezier(.34,1.8,.5,1) both}
@keyframes js-tip{0%{opacity:0;transform:translate(-8px,-50%) scale(.6,.8)}100%{opacity:1;transform:translateY(-50%)}}
@media (prefers-reduced-motion:reduce){.js-drop,.js-tip{animation:none}.js-row .js-icon,.js-press{transition:none}}
`
