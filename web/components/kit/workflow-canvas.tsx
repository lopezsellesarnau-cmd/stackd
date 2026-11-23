'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot } from './bot'

/**
 * Workflow canvas · StackD Kit
 * A small automation canvas: node cards on a dotted board, joined by soft wires. Drag a node and its wires
 * follow like jelly: they stretch, overshoot and settle. Drag the board to pan.
 * Press Run and the Bot rides the wires from node to node like a drop of jelly, stretching as it speeds up: each node lights up while it works, its duration
 * and last run update, and it gets a tick. A condition sends it down its true (Olive) or false (Wine)
 * branch and counts it.
 *
 * React + Tailwind and the StackD Bot, no other dependencies. Mouse, touch and keyboard
 * (Tab to a node, arrows move it, Enter runs). Respects reduced motion.
 */

export type FlowIcon = 'clock' | 'code' | 'branch' | 'mail' | 'log' | 'bolt'
export type FlowRow = { label: string; value?: string }
export type FlowNode = {
  id: string
  title: string
  icon?: FlowIcon
  x: number
  y: number
  /** Grey boxes of label/value rows. Each inner array is one box. */
  rows?: FlowRow[][]
  /** A condition: which branch a run takes (true or false), or a function to decide each time. */
  condition?: boolean | (() => boolean)
}
export type FlowEdge = { from: string; to: string; branch?: 'true' | 'false' }

type Props = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** The node a run starts from. Default: the first. */
  start?: string
  /** Called as each node runs; resolve when it's done (or throw to stop the run there). */
  onStep?: (node: FlowNode) => Promise<void> | void
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  /** Width of every node card, px. */
  nodeWidth?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const OLIVE = '#6C8544'
const WINE = '#901919'
const THEMES = {
  light: { board: '#F2F1EF', dot: 'rgba(20,19,16,0.13)', card: '#FFFFFF', ink: '#141310', dim: 'rgba(20,19,16,0.5)', box: '#F4F3F1', line: 'rgba(20,19,16,0.07)' },
  dark: { board: '#141310', dot: 'rgba(242,240,236,0.12)', card: '#1E1D1A', ink: '#F2F0EC', dim: 'rgba(242,240,236,0.5)', box: '#262420', line: 'rgba(242,240,236,0.08)' },
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const time = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/* Filled icons, drawn for StackD (24-unit box) */
const ICONS: Record<FlowIcon, string> = {
  clock: 'M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm-.9 4.6v5.6l4.3 2.6.9-1.5-3.5-2.1V7.1z',
  code: 'M8.6 6.2 3 12l5.6 5.8 1.5-1.4L5.9 12l4.2-4.4zm6.8 0-1.5 1.4 4.2 4.4-4.2 4.4 1.5 1.4L21 12z',
  branch: 'M7 3a3 3 0 0 1 1 5.83v1.42A4.5 4.5 0 0 0 12 14.7a3 3 0 1 1 .02 2.06A6.5 6.5 0 0 1 8 15.06v.11A3 3 0 1 1 6 15.17V8.83A3 3 0 0 1 7 3z',
  mail: 'M4.5 5h15A2.5 2.5 0 0 1 22 7.5v.3l-10 6.1-10-6.1v-.3A2.5 2.5 0 0 1 4.5 5zM2 10.1l10 6.1 10-6.1v6.4a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5z',
  log: 'M6.5 3h8.2L19 7.3v11.2a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3zm1.5 9v1.7h8V12zm0 3.6v1.7h5.5v-1.7z',
  bolt: 'M13.5 2 4.8 13.2h6l-1.3 8.8 8.7-11.2h-6z',
}

type Spring = { x: number; y: number; vx: number; vy: number }

export function WorkflowCanvas({ nodes, edges, start, onStep, theme = 'light', width = 820, height = 440, nodeWidth: W = 228, className = '' }: Props) {
  const c = THEMES[theme]
  const [pos, setPos] = useState(() => Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }])))
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [state, setState] = useState<Record<string, 'idle' | 'running' | 'done' | 'failed'>>({})
  const [stats, setStats] = useState<Record<string, { last?: string; ms?: number; t?: number; f?: number }>>({})
  const [lit, setLit] = useState<string[]>([]) // wires the run has passed through
  const [running, setRunning] = useState(false)
  const [rider, setRider] = useState<{ x: number; y: number; dx: number; dy: number; v: number; lands: number } | null>(null)
  const [, force] = useState(0)
  const cards = useRef<Record<string, HTMLDivElement | null>>({})
  const paths = useRef<Record<string, SVGPathElement | null>>({})
  const jelly = useRef<Record<string, Spring>>({}) // each node's wire wobble
  const raf = useRef(0)
  const still = useRef(false)
  useEffect(() => { still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches }, [])

  // every card's height, for where its ports sit
  useEffect(() => {
    const ro = new ResizeObserver(() => setHeights(Object.fromEntries(Object.entries(cards.current).map(([id, el]) => [id, el?.offsetHeight ?? 120]))))
    Object.values(cards.current).forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [nodes])

  // the wobble: a spring per node pulling its wire's bend back to rest
  const wobble = () => {
    if (raf.current) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      let moving = false
      for (const s of Object.values(jelly.current)) {
        const k = 160, d = 9
        s.vx += (-k * s.x - d * s.vx) * dt; s.vy += (-k * s.y - d * s.vy) * dt
        s.x += s.vx * dt; s.y += s.vy * dt
        if (Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) > 0.05) moving = true
        else { s.x = s.y = s.vx = s.vy = 0 }
      }
      force((n) => n + 1)
      raf.current = moving ? requestAnimationFrame(tick) : 0
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const kick = (id: string, dx: number, dy: number) => {
    if (still.current) return
    const s = (jelly.current[id] ??= { x: 0, y: 0, vx: 0, vy: 0 })
    s.vx -= dx * 9; s.vy -= dy * 9
    wobble()
  }

  const byId = useMemo<Record<string, FlowNode>>(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  // Where a wire leaves and arrives: from the side of each card that faces the other (right, left, down or up)
  const ends = (e: FlowEdge) => {
    const pa = pos[e.from], pb = pos[e.to], ha = heights[e.from] ?? 120, hb = heights[e.to] ?? 120
    const dx = pb.x + W / 2 - (pa.x + W / 2), dy = pb.y + hb / 2 - (pa.y + ha / 2)
    const dir = Math.abs(dx) * 0.9 > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u'
    const off = e.branch === 'true' ? -9 : e.branch === 'false' ? 9 : 0
    const a = dir === 'r' ? { x: pa.x + W, y: pa.y + ha / 2 + off } : dir === 'l' ? { x: pa.x, y: pa.y + ha / 2 + off }
      : dir === 'd' ? { x: pa.x + W / 2 + off * 3, y: pa.y + ha } : { x: pa.x + W / 2 + off * 3, y: pa.y }
    const b = dir === 'r' ? { x: pb.x, y: pb.y + hb / 2 } : dir === 'l' ? { x: pb.x + W, y: pb.y + hb / 2 }
      : dir === 'd' ? { x: pb.x + W / 2, y: pb.y } : { x: pb.x + W / 2, y: pb.y + hb }
    const u = dir === 'r' ? [1, 0] : dir === 'l' ? [-1, 0] : dir === 'd' ? [0, 1] : [0, -1]
    return { a, b, u }
  }
  const wire = (e: FlowEdge) => {
    const { a, b, u } = ends(e)
    const ja = jelly.current[e.from] ?? { x: 0, y: 0 }, jb = jelly.current[e.to] ?? { x: 0, y: 0 }
    const k = Math.max(46, Math.abs(u[0] ? b.x - a.x : b.y - a.y) * 0.5)
    return `M${a.x} ${a.y}C${a.x + u[0] * k + ja.x} ${a.y + u[1] * k + ja.y} ${b.x - u[0] * k + jb.x} ${b.y - u[1] * k + jb.y} ${b.x} ${b.y}`
  }
  const key = (e: FlowEdge) => `${e.from}>${e.to}`

  // dragging a node, or the board
  const drag = (e: React.PointerEvent, id?: string) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    let lx = e.clientX, ly = e.clientY
    const k = width / (el.closest('[data-flow]') as HTMLElement).getBoundingClientRect().width // drawn scaled? stay in our units
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - lx) * k, dy = (ev.clientY - ly) * k
      lx = ev.clientX; ly = ev.clientY
      if (id) { setPos((p) => ({ ...p, [id]: { x: p[id].x + dx, y: p[id].y + dy } })); kick(id, dx, dy) }
      else setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
    }
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
  }

  // ride a wire: the Bot follows the path
  const ride = (e: FlowEdge) => new Promise<void>((done) => {
    const path = paths.current[key(e)]
    if (!path || still.current) { done(); return }
    const len = path.getTotalLength(), dur = Math.max(500, len * 2.4)
    const t0 = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / dur)
      const q = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2 // ease in and out
      const pt = path.getPointAtLength(q * len), ahead = path.getPointAtLength(Math.min(len, q * len + 4))
      setRider((r) => ({ x: pt.x, y: pt.y, dx: ahead.x - pt.x, dy: ahead.y - pt.y, v: Math.sin(Math.PI * u) * 6, lands: r?.lands ?? 0 })) // fastest mid-wire, stretched most
      if (u < 1) requestAnimationFrame(step)
      else done()
    }
    requestAnimationFrame(step)
  })

  const run = async () => {
    if (running) return
    setRunning(true); setState({}); setLit([])
    let id: string | undefined = start ?? nodes[0]?.id
    const seen = new Set<string>()
    while (id && !seen.has(id)) {
      seen.add(id)
      const node: FlowNode = byId[id]
      const into = edges.find((e) => e.to === id && seen.has(e.from))
      const at = into ? ends(into).b : { x: pos[id].x, y: pos[id].y + (heights[id] ?? 120) / 2 }
      setRider((r) => ({ x: at.x, y: at.y, dx: 1, dy: 0, v: 0, lands: (r?.lands ?? 0) + 1 })) // landed: squash
      setState((s) => ({ ...s, [id!]: 'running' }))
      const t0 = performance.now()
      try { await Promise.all([onStep?.(node), wait(still.current ? 150 : 650 + Math.random() * 400)]) }
      catch { setState((s) => ({ ...s, [id!]: 'failed' })); break }
      const ms = performance.now() - t0
      // a condition picks its branch
      let branch: FlowEdge['branch']
      if (node.condition !== undefined) {
        const ok: boolean = typeof node.condition === 'function' ? node.condition() : node.condition
        branch = ok ? 'true' : 'false'
      }
      setStats((s) => ({ ...s, [id!]: { ...s[id!], last: time(), ms, t: (s[id!]?.t ?? 0) + (branch === 'true' ? 1 : 0), f: (s[id!]?.f ?? 0) + (branch === 'false' ? 1 : 0) } }))
      setState((s) => ({ ...s, [id!]: 'done' }))
      const next: FlowEdge | undefined = edges.find((e) => e.from === id && (!branch || e.branch === branch))
      if (!next) break
      setLit((l) => [...l, key(next)])
      await ride(next)
      id = next.to
    }
    setRider(null)
    setRunning(false)
  }

  const onKeyNode = (e: React.KeyboardEvent, id: string) => {
    const d = e.shiftKey ? 40 : 10
    const mv = (dx: number, dy: number) => { e.preventDefault(); setPos((p) => ({ ...p, [id]: { x: p[id].x + dx, y: p[id].y + dy } })); kick(id, dx * 0.3, dy * 0.3) }
    if (e.key === 'ArrowRight') mv(d, 0)
    else if (e.key === 'ArrowLeft') mv(-d, 0)
    else if (e.key === 'ArrowDown') mv(0, d)
    else if (e.key === 'ArrowUp') mv(0, -d)
    else if (e.key === 'Enter') { e.preventDefault(); run() }
  }

  const rowValue = (n: FlowNode, r: FlowRow) => {
    const st = stats[n.id]
    if (!st) return r.value
    if (/^duration$/i.test(r.label) && st.ms) return `${(st.ms / 1000).toFixed(1)}s`
    if (/^last$/i.test(r.label) && st.last) return st.last
    if (/^true/i.test(r.label)) return String((Number(r.value) || 0) + (st.t ?? 0))
    if (/^false/i.test(r.label)) return String((Number(r.value) || 0) + (st.f ?? 0))
    return r.value
  }

  return (
    <div
      data-flow
      className={`relative select-none overflow-hidden rounded-[26px] ${className}`}
      style={{ width, height, background: c.board, color: c.ink, fontFamily: FONT, boxShadow: `inset 0 0 0 1px ${c.line}` }}
    >
      <style>{CSS}</style>
      {/* the board: dotted, drag it to pan */}
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ backgroundImage: `radial-gradient(${c.dot} 1.1px, transparent 1.3px)`, backgroundSize: '18px 18px', backgroundPosition: `${pan.x}px ${pan.y}px` }}
        onPointerDown={(e) => drag(e)}
      />
      <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
        {/* the wires */}
        <svg className="absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
          {edges.map((e) => {
            const on = lit.includes(key(e))
            const col = e.branch === 'true' ? OLIVE : e.branch === 'false' ? WINE : c.ink
            return (
              <g key={key(e)}>
                <path ref={(el) => { paths.current[key(e)] = el }} d={wire(e)} fill="none" stroke={col} strokeOpacity={e.branch ? (on ? 1 : 0.55) : on ? 1 : 0.85} strokeWidth={on ? 3 : 2.2} strokeLinecap="round" />
                {on ? <path d={wire(e)} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" className="wf-flow" strokeDasharray="2 10" style={{ stroke: '#FFFFFF', opacity: 0.7 }} /> : null}
              </g>
            )
          })}
          {/* the ports */}
          {edges.map((e) => {
            const { a, b } = ends(e)
            const col = e.branch === 'true' ? OLIVE : e.branch === 'false' ? WINE : c.ink
            return (
              <g key={`p-${key(e)}`}>
                <circle cx={a.x} cy={a.y} r={4.6} fill={c.card} stroke={col} strokeWidth={2.2} />
                <circle cx={b.x} cy={b.y} r={4.6} fill={c.card} stroke={c.ink} strokeWidth={2.2} />
              </g>
            )
          })}
        </svg>

        {/* the nodes */}
        {nodes.map((n, i) => {
          const p = pos[n.id], st = state[n.id] ?? 'idle'
          return (
            <div key={n.id} className="absolute" style={{ left: p.x, top: p.y, width: W }}>
              {i === 0 ? <span className="absolute -top-8 left-0 rounded-full px-2.5 py-1 text-[13px] font-semibold" style={{ background: c.card, boxShadow: `0 0 0 1px ${c.line}` }}>Start</span> : null}
              <div
                ref={(el) => { cards.current[n.id] = el }}
                role="group"
                tabIndex={0}
                aria-label={`${n.title}${st === 'running' ? ', running' : st === 'done' ? ', done' : st === 'failed' ? ', failed' : ''}`}
                onPointerDown={(e) => drag(e, n.id)}
                onKeyDown={(e) => onKeyNode(e, n.id)}
                className={`wf-node pointer-events-auto cursor-grab touch-none rounded-[18px] p-1.5 outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#BE9344] ${st === 'running' ? 'wf-running' : ''} ${st === 'done' ? 'wf-done' : ''}`}
                style={{ background: c.card, boxShadow: `0 0 0 1px ${st === 'failed' ? WINE : c.line}, 0 6px 20px rgba(20,19,16,0.06)` }}
              >
                <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                  {n.icon ? <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden><path d={ICONS[n.icon]} fill="currentColor" /></svg> : null}
                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{n.title}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    {st === 'done' ? (
                      <span className="wf-tick flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: OLIVE }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M2.2 5.2 4.2 7.2 7.8 3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    ) : st === 'running' ? (
                      <span className="wf-spin h-[16px] w-[16px] rounded-full border-2" style={{ borderColor: `${c.ink} transparent ${c.ink} ${c.ink}` }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden style={{ color: c.dim }}><circle cx="4" cy="9" r="1.4" fill="currentColor" /><circle cx="9" cy="9" r="1.4" fill="currentColor" /><circle cx="14" cy="9" r="1.4" fill="currentColor" /></svg>
                    )}
                  </span>
                </div>
                {(n.rows ?? []).map((box, b) => (
                  <div key={b} className="mt-1 rounded-[12px] px-3 py-2 text-[13px]" style={{ background: c.box }}>
                    {box.map((r) => {
                      const v = rowValue(n, r)
                      const tone = /^true/i.test(r.label) ? OLIVE : /^false/i.test(r.label) ? WINE : undefined
                      return (
                        <div key={r.label} className="flex items-baseline justify-between gap-3 py-[2px]">
                          <span className="flex items-center gap-1.5" style={{ color: c.dim }}>
                            {tone ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} /> : null}
                            {r.label}
                          </span>
                          {v !== undefined ? <span key={v} className="wf-value truncate tabular-nums">{v}</span> : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* the run: the Bot riding the wire like a drop of jelly. It stretches along the wire as it speeds up
            (without turning its face), looks where it's going, and squashes when it lands on a node. */}
        {rider ? (() => {
          const a = Math.atan2(rider.dy, rider.dx), n = Math.hypot(rider.dx, rider.dy) || 1
          const sx = 1 + Math.min(0.38, rider.v * 0.06), sy = 1 - Math.min(0.22, rider.v * 0.035)
          return (
            <span className="absolute" style={{ left: rider.x - 17, top: rider.y - 17, width: 34, height: 34, transform: `rotate(${a}rad) scale(${sx}, ${sy}) rotate(${-a}rad)` }}>
              <span key={rider.lands} className="wf-land flex h-full w-full items-center justify-center rounded-full" style={{ background: c.card, boxShadow: `0 0 0 1.5px ${c.ink}, 0 4px 14px rgba(20,19,16,0.22)` }}>
                <Bot size={26} color={c.ink} eyeColor={c.card} look={{ x: (rider.dx / n) * 0.8, y: (rider.dy / n) * 0.6 }} poke={false} />
              </span>
            </span>
          )
        })() : null}
      </div>

      {/* Run */}
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="wf-press absolute bottom-4 right-4 flex items-center gap-2 rounded-full py-2 pl-3 pr-4 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#BE9344] disabled:cursor-default"
        style={{ background: c.ink, color: c.card }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 2.2v7.6a.6.6 0 0 0 .9.5l6.2-3.8a.6.6 0 0 0 0-1L3.9 1.7a.6.6 0 0 0-.9.5z" fill="currentColor" /></svg>
        {running ? 'Running…' : 'Run'}
      </button>
      <span className="sr-only" aria-live="polite">{running ? 'Running the workflow' : Object.keys(state).length ? 'Run finished' : ''}</span>
    </div>
  )
}

const CSS = `
.wf-node{transition:box-shadow 260ms ease}
.wf-running{animation:wf-work 900ms ease-in-out infinite}
@keyframes wf-work{0%,100%{transform:scale(1)}50%{transform:scale(1.025,.985)}}
.wf-done{animation:wf-done 520ms cubic-bezier(.3,1.6,.5,1)}
@keyframes wf-done{0%{transform:scale(1)}35%{transform:scale(1.05,.94)}65%{transform:scale(.98,1.03)}100%{transform:scale(1)}}
.wf-tick{animation:wf-tick 460ms cubic-bezier(.34,1.8,.5,1) both}
@keyframes wf-tick{0%{transform:scale(0)}100%{transform:scale(1)}}
.wf-spin{animation:wf-spin 700ms linear infinite}
@keyframes wf-spin{to{transform:rotate(360deg)}}
.wf-value{animation:wf-value 420ms cubic-bezier(.34,1.6,.5,1)}
@keyframes wf-value{0%{opacity:0;transform:translateY(5px)}100%{opacity:1;transform:none}}
.wf-flow{animation:wf-flow 900ms linear infinite}
@keyframes wf-flow{to{stroke-dashoffset:-24}}
.wf-land{animation:wf-land 560ms cubic-bezier(.3,1.6,.5,1)}
@keyframes wf-land{0%{transform:scale(1.25,.7)}40%{transform:scale(.86,1.16)}70%{transform:scale(1.06,.95)}100%{transform:scale(1)}}
.wf-press{transition:transform 420ms cubic-bezier(.34,1.8,.5,1)}
.wf-press:active{transform:scale(.92,.86);transition-duration:90ms}
@media (prefers-reduced-motion:reduce){.wf-running,.wf-done,.wf-tick,.wf-value,.wf-flow,.wf-land{animation:none}.wf-spin{animation-duration:2s}}
`
