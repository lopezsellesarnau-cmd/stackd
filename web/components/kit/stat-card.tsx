'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Live stat card · StackD Kit 04
 * A number, the change since the first point, and a smooth line that draws itself in.
 * Run along the line (pointer, touch or arrow keys) and the number follows you.
 * With `live`, a new point arrives every few seconds: the old line flows into the new one
 * while the number and the change count across, all on one clock so they land together.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type Point = { label: string; value: number };

type Props = {
  label?: string;
  data?: Point[];
  /** How the number is written. Defaults to euros with no decimals. */
  format?: (n: number) => string;
  /** Line colour. */
  color?: string;
  /** Add a point every few seconds. `true` makes up demo points; a function gives your own. */
  live?: boolean | (() => Point | Promise<Point>);
  /** Seconds between live points. */
  every?: number;
};

const W = 100; // the line is drawn in a 100 × 40 box and stretched to fit
const H = 40;
const SAMPLES = 64; // places along the line that the morph mixes
const MS = 650;
const MAX_POINTS = 14;

type Snap = { pts: { x: number; y: number }[]; value: number; pct: number };

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function StatCard({
  label = "Revenue",
  data = DEMO,
  format = (n) => euro.format(n),
  color = "#141310",
  live = false,
  every = 3,
}: Props) {
  const [points, setPoints] = useState(data);
  // Where the pointer is along the line, as a fractional index; null = the latest point
  const [scrub, setScrub] = useState<number | null>(null);
  // Morph progress, 0 → 1. Every change (first draw, new point) restarts it.
  const [m, setM] = useState(0);
  const [run, setRun] = useState(0);
  const [from, setFrom] = useState<Snap | null>(null);
  const onScreen = useRef<Snap | null>(null);
  // Where the dot was last, so it can fade out in place instead of jumping home
  const [dotAt, setDotAt] = useState(data.length - 1);
  const plot = useRef<HTMLDivElement>(null);
  const id = useId();

  const values = points.map((p) => p.value);
  const last = values.length - 1;
  const line = smooth(values);

  // What the card is heading to
  const goal: Snap = {
    pts: Array.from({ length: SAMPLES }, (_, i) => line.at((i / (SAMPLES - 1)) * last)),
    value: values[last],
    pct: change(values[0], values[last]),
  };

  // What it shows this frame: mid-morph, a mix of where it was and where it's going.
  // On the first draw it starts from 0 on the same line.
  const start = from ?? { pts: goal.pts, value: 0, pct: 0 };
  const show: Snap =
    m < 1
      ? {
          pts: goal.pts.map((p, i) => ({ x: mix(start.pts[i].x, p.x, m), y: mix(start.pts[i].y, p.y, m) })),
          value: mix(start.value, goal.value, m),
          pct: mix(start.pct, goal.pct, m),
        }
      : goal;

  useLayoutEffect(() => {
    onScreen.current = show;
  });

  // One clock for the line, the number and the change
  useEffect(() => {
    const dur = reduced() ? 0 : MS;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = dur ? clamp((t - t0) / dur, 0, 1) : 1;
      setM(1 - (1 - k) ** 4);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  // Live: a new point every few seconds, keeping the last 14. The morph starts from what's on screen.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(async () => {
      const next = typeof live === "function" ? await live() : null;
      setFrom(onScreen.current);
      setPoints((p) => [...p, next ?? demoNext(p)].slice(-MAX_POINTS));
      setM(0);
      setRun((r) => r + 1);
    }, every * 1000);
    return () => clearInterval(t);
  }, [live, every]);

  // Reading the line: the number, the change and the dot all come from one fractional index
  const u = scrub ?? last;
  const lo = Math.floor(u);
  const read = mix(values[lo], values[Math.min(last, lo + 1)], u - lo);
  const reading = scrub !== null;
  const value = reading ? read : show.value;
  const pct = reading ? change(values[0], read) : show.pct;
  const up = pct >= 0;

  const dot = line.at(Math.min(dotAt, last));

  function pick(e: PointerEvent<HTMLDivElement>) {
    const r = plot.current!.getBoundingClientRect();
    const v = clamp((e.clientX - r.left) / r.width, 0, 1) * last;
    setScrub(v);
    setDotAt(v);
  }

  function keys(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const now = scrub === null ? last : Math.round(scrub);
    const v = clamp(now + (e.key === "ArrowLeft" ? -1 : 1), 0, last);
    setScrub(v);
    setDotAt(v);
  }

  const d = trace(show.pts);
  const fade = `opacity .25s ease, transform .25s ease`;

  return (
    <div
      tabIndex={0}
      onKeyDown={keys}
      onBlur={() => setScrub(null)}
      aria-label={`${label}: ${format(values[last])}, ${goal.pct >= 0 ? "up" : "down"} ${Math.abs(goal.pct).toFixed(1)}%`}
      className="w-full max-w-[320px] rounded-[22px] bg-white p-5 text-[#141310] outline-none focus-visible:ring-2 focus-visible:ring-[#141310]/20"
    >
      <style>{`@keyframes sc-draw{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}`}</style>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#141310]/55">{label}</p>
        {live ? (
          <span className="flex items-center gap-1.5 text-[11px] text-[#141310]/45">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none" style={{ background: color }} />
            Live
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-[32px] font-semibold tabular-nums tracking-[-0.03em]">{format(Math.round(value))}</p>
        <span
          className="rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors duration-300"
          style={{ background: up ? "#6C854418" : "#90191918", color: up ? "#6C8544" : "#901919" }}
        >
          {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>

      {/* The date you're reading, or the range. Same row either way, so nothing jumps. */}
      <p className="mt-0.5 h-4 text-[11px] text-[#141310]/40 tabular-nums">
        {reading ? points[Math.round(scrub)].label : `${points[0].label} – ${points[last].label}`}
      </p>

      <div
        ref={plot}
        className="relative mt-3 h-[72px] cursor-crosshair touch-none"
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setScrub(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible motion-reduce:[animation:none]" style={{ animation: "sc-draw 1.1s cubic-bezier(.2,.8,.2,1)" }} aria-hidden>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.12" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="1.75"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Guide, dot and tooltip live in HTML so the stretched svg can't squash them into ellipses */}
        <i
          className="pointer-events-none absolute inset-y-0 w-px"
          style={{ left: `${dot.x}%`, background: `${color}26`, opacity: reading ? 1 : 0, transition: fade }}
        />
        <span
          className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(20,19,16,0.08)]"
          style={{
            left: `${dot.x}%`,
            top: `${(dot.y / H) * 100}%`,
            background: color,
            opacity: reading ? 1 : 0,
            transform: `translate(-50%,-50%) scale(${reading ? 1 : 0.4})`,
            transition: fade,
          }}
        />
      </div>
    </div>
  );
}

const change = (a: number, b: number) => (a ? ((b - a) / a) * 100 : 0);

/**
 * A smooth line through every value (Catmull-Rom as cubic Béziers).
 * `at(u)` gives the point on the curve at a fractional index, so the dot sits on the line, not on a chord.
 */
function smooth(values: number[]) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const n = values.length - 1;
  const p = values.map((v, i) => ({ x: (i / n) * W, y: H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6) }));
  const seg = p.slice(0, -1).map((a, i) => {
    const b = p[i + 1];
    const before = p[i - 1] ?? a;
    const after = p[i + 2] ?? b;
    return {
      a,
      b,
      c1: { x: a.x + (b.x - before.x) / 6, y: a.y + (b.y - before.y) / 6 },
      c2: { x: b.x - (after.x - a.x) / 6, y: b.y - (after.y - a.y) / 6 },
    };
  });
  const at = (u: number) => {
    const i = clamp(Math.floor(u), 0, seg.length - 1);
    const t = clamp(u - i, 0, 1);
    const s = 1 - t;
    const { a, b, c1, c2 } = seg[i];
    return {
      x: s * s * s * a.x + 3 * s * s * t * c1.x + 3 * s * t * t * c2.x + t * t * t * b.x,
      y: s * s * s * a.y + 3 * s * s * t * c1.y + 3 * s * t * t * c2.y + t * t * t * b.y,
    };
  };
  return { at };
}

/** The path through the sampled points, smoothed the same way */
function trace(p: { x: number; y: number }[]) {
  let d = `M${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const before = p[i - 1] ?? a;
    const after = p[i + 2] ?? b;
    d += ` C${(a.x + (b.x - before.x) / 6).toFixed(2)} ${(a.y + (b.y - before.y) / 6).toFixed(2)} ${(b.x - (after.x - a.x) / 6).toFixed(2)} ${(b.y - (after.y - a.y) / 6).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return d;
}

const DEMO: Point[] = [
  4210, 4380, 4290, 4620, 4810, 4700, 5030, 5240, 5110, 5480, 5720, 5650, 6010, 6284,
].map((value, i) => ({ label: `Nov ${i + 1}`, value }));

function demoNext(p: Point[]): Point {
  const last = p[p.length - 1];
  const day = Number(last.label.split(" ")[1]) + 1 || p.length + 1;
  return { label: `Nov ${day}`, value: Math.round(last.value * (0.97 + Math.random() * 0.08)) };
}
