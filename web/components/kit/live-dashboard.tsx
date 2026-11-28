'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot } from './bot'
import { JellySidebar, type SidebarItem } from './jelly-sidebar'
import { StatCard } from './stat-card'
import { DottedGlobe } from './dotted-globe'
import { ActivityGrid } from './activity-grid'
import { LiveChart } from './live-chart'
import { LiveFeed } from './live-feed'

/**
 * Live dashboard · StackD Kit
 * A whole dashboard that feels alive, put together from StackD pieces: the Jelly sidebar, live stat cards whose numbers
 * roll, a chart that draws itself, the Dotted globe with your users, a feed of what's happening and the activity grid.
 * The layout is plain CSS grid, so you can swap any card for your own.
 *
 * React + Tailwind, needs the StackD pieces it shows.
 */

type Props = {
  /** Who's looking, for the greeting. */
  name?: string
  theme?: 'light' | 'dark'
  /** Height of the whole dashboard, px. */
  height?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const THEMES = {
  light: { page: '#F2F2F0', card: '#FFFFFF', ink: '#141310', mute: 'rgba(20,19,16,0.5)', line: 'rgba(20,19,16,0.07)', soft: '#F3F2F0' },
  dark: { page: '#0B0A09', card: '#141310', ink: '#F2F0EC', mute: 'rgba(242,240,236,0.5)', line: 'rgba(242,240,236,0.08)', soft: '#1E1D1A' },
}

const NAV: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: 4 },
  { id: 'projects', label: 'Projects', icon: 'folder', children: [{ id: 'p-web', label: 'Website' }, { id: 'p-app', label: 'Mobile app' }] },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'team', label: 'Team', icon: 'users' },
]
const NAV_FOOT: SidebarItem[] = [{ id: 'settings', label: 'Settings', icon: 'settings' }]

// a week of numbers for each card to start from
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const week = (base: number, spread: number, phase: number, labels: string[] = DAYS) =>
  labels.map((label, i) => ({ label, value: Math.round(base + Math.sin(i * 1.1 + phase) * spread + i * spread * 0.18) }))
const PERIODS = [
  { id: 'today', label: 'Today', k: 1 / 7, labels: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
  { id: 'week', label: '7 days', k: 1, labels: DAYS },
  { id: 'month', label: '30 days', k: 4.3, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Now'] },
] as const
type Period = (typeof PERIODS)[number]['id']
const stats = (k: number, l: string[]) => [
  { label: 'Visitors', data: week(4200 * k, 600 * k, 0, l), format: (n: number) => Math.round(n).toLocaleString('en') },
  { label: 'Sign-ups', data: week(180 * k, 30 * k, 1.7, l), format: (n: number) => Math.round(n).toLocaleString('en') },
  { label: 'Revenue', data: week(8400 * k, 900 * k, 3.1, l), format: (n: number) => `€${Math.round(n).toLocaleString('en')}` },
  { label: 'Conversion', data: week(42, 6, 4.6, l), format: (n: number) => `${(n / 10).toFixed(1)}%` },
]

/** The period switch: a pill that slides under the one you pick, with a little overshoot. */
function Periods({ value, onChange, c }: { value: Period; onChange: (p: Period) => void; c: (typeof THEMES)['light'] }) {
  const i = PERIODS.findIndex((p) => p.id === value)
  return (
    <div className="relative grid h-10 grid-cols-3 rounded-full p-1" style={{ background: c.card, boxShadow: `0 0 0 1px ${c.line}` }} role="tablist" aria-label="Period">
      <span className="absolute bottom-1 top-1 rounded-full" style={{ left: 4, width: 'calc((100% - 8px) / 3)', transform: `translateX(${i * 100}%)`, background: c.ink, transition: 'transform .45s cubic-bezier(.3,1.4,.5,1)' }} />
      {PERIODS.map((p) => (
        <button key={p.id} type="button" role="tab" aria-selected={p.id === value} onClick={() => onChange(p.id)}
          className="relative z-10 px-3 text-[12.5px] font-medium transition-colors duration-300" style={{ color: p.id === value ? c.card : c.mute }}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening' }

/** A card: white, round, a title and an optional live dot. */
function Card({ title, live, children, className = '', c }: { title?: string; live?: boolean; children: React.ReactNode; className?: string; c: (typeof THEMES)['light'] }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-[22px] p-5 ${className}`} style={{ background: c.card, boxShadow: `0 0 0 1px ${c.line}` }}>
      {title ? (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px]" style={{ color: c.mute }}>{title}</h2>
          {live ? <span className="flex items-center gap-1.5 text-[11px]" style={{ color: c.mute }}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6C8544] motion-reduce:animate-none" />Live</span> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

// the activity grid shows as many weeks as fit its space, so it lines up with the cards around it
function Deploys({ theme }: { theme: 'light' | 'dark' }) {
  const box = useRef<HTMLDivElement>(null)
  const [weeks, setWeeks] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    // the card is its weeks (18 px each) plus 78 px of padding
    const ro = new ResizeObserver(([e]) => setWeeks(Math.max(8, Math.floor((e.contentRect.width - 78 + 4) / 18))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="min-w-0 [&>*]:h-full [&>*]:!w-full">
      {weeks ? <ActivityGrid key={weeks} weeks={weeks} theme={theme} title="Deploys" unit="deploys" /> : null}
    </div>
  )
}

export function LiveDashboard({ name = 'Ada', theme = 'light', height = 820, className = '' }: Props) {
  const c = THEMES[theme]
  const [page, setPage] = useState('Overview')
  const [period, setPeriod] = useState<Period>('week')
  // the date and the greeting depend on the clock, so they're set in the browser
  const [today, setToday] = useState('')
  const [hello, setHello] = useState('Hello')
  useEffect(() => { setToday(new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })); setHello(greeting()) }, [])

  // the layout follows the dashboard's own width, not the screen's, so it also fits inside a smaller frame
  const root = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1400)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = w < 720, medium = !narrow && w < 1180
  const main = narrow ? w - 24 : w - 24 - (medium ? 80 : 260) // room beside the sidebar
  const two = main >= 760 // the big cards side by side
  const per = PERIODS.find((p) => p.id === period)!
  const STATS = stats(per.k, [...per.labels])

  const search = (
    <div className="flex h-10 items-center gap-2 rounded-full pl-4 pr-1.5 text-[13px]" style={{ background: c.card, boxShadow: `0 0 0 1px ${c.line}`, color: c.mute, width: narrow ? '100%' : 220 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.06l4.24 4.24a1.4 1.4 0 0 1-1.98 1.98l-4.24-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2.8a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Z" /></svg>
      <span className="flex-1">Search</span>
      <kbd className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: c.soft, fontFamily: FONT }}>⌘K</kbd>
    </div>
  )

  return (
    <div ref={root} className={`flex gap-3 rounded-[30px] p-3 ${className}`} style={{ height: narrow ? 'auto' : height, background: c.page, color: c.ink, fontFamily: FONT }}>
      {narrow ? null : (
        <JellySidebar key={medium ? 'rail' : 'open'} defaultCollapsed={medium} items={NAV} footer={NAV_FOOT} brand="Acme" user={{ name, detail: 'Admin' }} theme={theme} height={height - 24} onSelect={(it) => setPage(it.label)} />
      )}

      <main className={`flex min-w-0 flex-1 flex-col gap-3 ${narrow ? '' : 'overflow-y-auto'}`}>
        {/* on a phone: the brand and the Bot on top, instead of the sidebar */}
        {narrow ? (
          <div className="flex items-center justify-between px-2 pt-2">
            <span className="flex items-center gap-2 text-[16px] font-semibold"><Bot size={26} shape="hexagon" color={c.ink} eyeColor={c.card} />Acme</span>
            <span className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold" style={{ background: c.card, boxShadow: `0 0 0 1px ${c.line}` }}>{name[0]}</span>
          </div>
        ) : null}

        {/* the greeting and the date; the period, search, and the Bot keeping an eye on things */}
        <header className={`flex gap-3 px-2 pb-1 pt-3 ${narrow ? 'flex-col' : 'items-end justify-between'}`}>
          <div className="min-w-0">
            <p className="text-[13px]" style={{ color: c.mute }}>{today || '\u00A0'}</p>
            <h1 className="truncate text-[26px] font-semibold tracking-[-0.02em]">{page === 'Overview' ? `${hello}, ${name}` : page}</h1>
          </div>
          <div className={`flex items-center gap-2 ${narrow ? 'flex-col items-stretch' : ''}`}>
            <Periods value={period} onChange={setPeriod} c={c} />
            {main > 900 || narrow ? search : null}
            {narrow ? null : <Bot size={40} shape="hexagon" color={c.ink} eyeColor={c.card} />}
          </div>
        </header>

        {/* the numbers, live */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${main >= 1000 ? 4 : narrow && main < 420 ? 1 : 2}, minmax(0, 1fr))` }}>
          {STATS.map((s) => (
            <div key={`${s.label}-${period}`} className="[&>*]:max-w-none">
              <StatCard label={s.label} data={s.data} format={s.format} theme={theme} live every={2600} />
            </div>
          ))}
        </div>

        {/* traffic, and where your users are right now */}
        <div className="grid gap-3" style={{ gridTemplateColumns: two ? '1.5fr 1fr' : '1fr' }}>
          <Card title="Traffic · visitors right now" live c={c}>
            <LiveChart theme={theme} label="" height={224} />
          </Card>
          <Card title="Live users" live c={c}>
            <div className="-mx-5 -mb-5 flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 250 }}><DottedGlobe size={300} theme={theme} /></div>
          </Card>
        </div>

        {/* what's happening, and the months at a glance */}
        <div className="grid gap-3" style={{ gridTemplateColumns: two ? '1fr 1.4fr' : '1fr' }}>
          <Card title="Activity" live c={c}>
            <LiveFeed theme={theme} max={6} />
          </Card>
          <Deploys theme={theme} />
        </div>
      </main>
    </div>
  )
}
