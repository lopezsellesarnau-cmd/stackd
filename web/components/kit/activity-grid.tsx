'use client'

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Activity · StackD Kit 22
 * A year-style grid of days, one square per day, darker for busier days. Move over it and the days
 * near the cursor lift toward you like under a lens, and the day you're on shows its date and count.
 * Switch to 3D and the grid tilts back while every day grows into a bar of its real height, one week
 * after another. In 3D, drag to turn it; let go and it settles back.
 * Drawn with CSS 3D (each day is a small box), no canvas, no other dependencies. Respects reduced motion.
 */

export type Day = { date: string; count: number };

type Props = {
  /** One entry per day, oldest first (YYYY-MM-DD). Missing days count as 0. Default: demo data. */
  data?: Day[];
  /** How many weeks to show, ending with the last day. Default 26. */
  weeks?: number;
  title?: string;
  /** What a count is called, for "12 commits". Default "commits". */
  unit?: string;
  /** The colour of the busiest days. Quieter days mix it with the card. Default ink. */
  color?: string;
  theme?: "light" | "dark";
  /** Start in 3D. */
  defaultView?: "flat" | "3d";
  className?: string;
};

const CELL = 14, GAP = 4, STEP = CELL + GAP;
const BAR = 44; // the tallest bar, px
const TILT = { x: 58, z: -24 }; // the 3D view: tipped back, turned a little
const ROOM = 70; // extra height the 3D view needs
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DISPLAY = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Made-up but believable: quieter weekends, busy streaks, a few days off */
function demo(weeks: number): Day[] {
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const end = new Date();
  const out: Day[] = [];
  let mood = 0.5;
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    mood = clamp(mood + (r() - 0.5) * 0.35, 0.05, 1);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const off = r() < (weekend ? 0.55 : 0.12);
    out.push({ date: iso(d), count: off ? 0 : Math.round(r() * 14 * mood * (weekend ? 0.4 : 1) + mood * 6) });
  }
  return out;
}

export function ActivityGrid({
  data,
  weeks = 26,
  title = "Activity",
  unit = "commits",
  color,
  theme = "light",
  defaultView = "flat",
  className = "",
}: Props) {
  const dark = theme === "dark";
  const ink = "#141310";
  const card = dark ? ink : "#FFFFFF";
  const fg = dark ? "#FFFFFF" : ink;
  const full = color ?? (dark ? "#FFFFFF" : ink);
  const empty = dark ? "#26241F" : "#EDECE8";

  const [view, setView] = useState<"flat" | "3d">(defaultView);
  const [hot, setHot] = useState<number | null>(null); // the day under the cursor
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null); // the cursor over the flat grid
  const [turn, setTurn] = useState<{ x: number; z: number } | null>(null); // while dragging in 3D
  const drag = useRef<{ x: number; y: number; from: { x: number; z: number } } | null>(null);
  const plane = useRef<HTMLDivElement>(null);
  const next = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  // Bars rise only after the first paint, so starting in 3D still shows them grow
  const [grown, setGrown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true))); return () => cancelAnimationFrame(id); }, []);

  // The days, laid out in columns of weeks (Sunday at the top), ending today
  const grid = useMemo(() => {
    const src = data ?? demo(weeks);
    const by = new Map(src.map((d) => [d.date, d.count]));
    const last = src.length ? new Date(src[src.length - 1].date + "T12:00:00") : new Date();
    const end = new Date(last); end.setDate(last.getDate() + (6 - last.getDay())); // the Saturday of the last week
    const cells: { date: Date; key: string; count: number; w: number; d: number; future: boolean }[] = [];
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
      const day = new Date(end); day.setDate(end.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
      const key = iso(day);
      cells.push({ date: day, key, count: by.get(key) ?? 0, w, d, future: day > last });
    }
    return cells;
  }, [data, weeks]);

  const counts = grid.filter((c) => !c.future).map((c) => c.count);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const active = counts.filter((c) => c > 0).length;
  let streak = 0, run = 0;
  for (const c of counts) { run = c > 0 ? run + 1 : 0; streak = Math.max(streak, run); }

  // Four steps of colour, like the grids you know, but solid (so the 3D sides can be shaded)
  const level = (n: number) => (n <= 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const shade = (n: number) => {
    const l = level(n);
    return l === 0 ? mixHex(empty, empty, 0) : mixHex(card, full, [0, 0.28, 0.5, 0.74, 1][l]);
  };
  // The sides: the top colour, darker
  const darken = (rgb: string, t: number) => {
    const v = (rgb.match(/[0-9]+/g) ?? []).map(Number);
    return `rgb(${v.slice(0, 3).map((x) => Math.round(x * (1 - t))).join(",")})`;
  };

  const three = view === "3d";
  const still = calm();
  const W = weeks * STEP - GAP, H = 7 * STEP - GAP;
  const rot = turn ?? TILT;

  // Month labels where a month starts
  const months: { w: number; m: string }[] = [];
  grid.forEach((c) => { if (c.d === 0 && (c.w === 0 || c.date.getDate() <= 7)) months.push({ w: c.w, m: MONTHS[c.date.getMonth()] }); });

  const hotCell = hot === null ? null : grid[hot];
  const fmt = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

  return (
    <div
      className={`select-none rounded-[24px] p-6 ${className}`}
      style={{ background: card, color: fg, width: W + 48 + 30, boxShadow: dark ? "0 24px 48px rgba(0,0,0,.3)" : "0 24px 48px rgba(20,19,16,.07), 0 0 0 1px rgba(20,19,16,.05)" }}
    >
      {/* Header: the total, or the day you're on; and the view switch */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px]" style={{ opacity: 0.5 }}>{title}</p>
          <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums" style={{ fontFamily: DISPLAY }}>
            {hotCell ? hotCell.count.toLocaleString("en-US") : total.toLocaleString("en-US")}
            <span className="ml-1.5 text-[14px] font-normal tracking-normal" style={{ opacity: 0.5 }}>{unit}</span>
          </p>
          <p className="mt-1 h-4 text-[12px] tabular-nums" style={{ opacity: 0.5 }} aria-live="polite">
            {hotCell ? fmt(hotCell.date) : `Last ${weeks} weeks`}
          </p>
        </div>
        <div className="flex rounded-full p-1" style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(20,19,16,.05)" }} role="group" aria-label="View">
          {(["flat", "3d"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => { setView(v); setTurn(null); }}
              className="h-7 rounded-full px-3 text-[12px] font-medium motion-safe:transition-colors"
              style={{ background: view === v ? (dark ? "#FFFFFF" : ink) : "transparent", color: view === v ? card : fg }}
            >
              {v === "flat" ? "Flat" : "3D"}
            </button>
          ))}
        </div>
      </div>

      {/* The grid. Flat: a lens follows the cursor. 3D: tipped back, drag to turn it */}
      <div
        className="relative mt-6"
        style={{ height: H + 22 + (three ? ROOM : 0), transition: still ? "none" : "height .6s cubic-bezier(.3,1.2,.4,1)", perspective: 1100, perspectiveOrigin: "50% 40%", cursor: three ? (drag.current ? "grabbing" : "grab") : "default", touchAction: three ? "none" : "auto" }}
        onPointerDown={(e) => {
          if (!three) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, from: rot };
        }}
        onPointerMove={(e) => {
          if (three && drag.current) {
            const d = drag.current;
            setTurn({ x: clamp(d.from.x - (e.clientY - d.y) * 0.3, 15, 72), z: d.from.z + (e.clientX - d.x) * 0.4 });
            return;
          }
          if (!three && plane.current) {
            const r = plane.current.getBoundingClientRect();
            const k = r.width / (plane.current.offsetWidth || 1) || 1;
            next.current = { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
            // At most one redraw a frame, however fast the mouse sends events
            if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; setLens(next.current); });
          }
        }}
        onPointerUp={() => { drag.current = null; setTurn(null); }}
        onPointerCancel={() => { drag.current = null; setTurn(null); }}
        onPointerLeave={() => { cancelAnimationFrame(frame.current); frame.current = 0; setLens(null); setHot(null); }}
      >
        {/* Weekday labels stay flat beside the grid */}
        <div className="absolute left-0 top-[22px] text-[10px] leading-none" style={{ opacity: three ? 0 : 0.45, transition: "opacity .3s" }}>
          {DAYS.map((d, i) => <div key={i} style={{ height: STEP, lineHeight: `${CELL}px` }}>{d}</div>)}
        </div>

        <div
          ref={plane}
          className="absolute"
          style={{
            left: 30,
            top: 22,
            width: W,
            height: H,
            transformStyle: "preserve-3d",
            transform: three ? `translateY(${ROOM * 0.55}px) rotateX(${rot.x}deg) rotateZ(${rot.z}deg) scale(.8)` : "none",
            transition: still || turn ? "none" : "transform .8s cubic-bezier(.3,1.2,.4,1)",
          }}
        >
          {/* Months along the top edge, on the plane so they tilt with it */}
          {months.map((m) => (
            <span key={m.w} className="absolute text-[10px] leading-none" style={{ left: m.w * STEP, top: -16, opacity: 0.45 }}>{m.m}</span>
          ))}

          {/* In 3D, the quiet days lie on one flat floor. Drawn as separate squares, the browser
              sometimes sorts them in front of the bars when the view turns (Safari most of all) */}
          {three ? (
            <div className="absolute inset-0" style={{ transformStyle: "flat" }}>
              {grid.map((c, i) =>
                c.future || c.count > 0 ? (
                  c.future ? (
                    <div key={c.key} className="absolute rounded-[3.5px]" style={{ left: c.w * STEP, top: c.d * STEP, width: CELL, height: CELL, outline: `1px dashed ${dark ? "rgba(255,255,255,.12)" : "rgba(20,19,16,.1)"}`, outlineOffset: -1 }} />
                  ) : null
                ) : (
                  <div
                    key={c.key}
                    className="absolute rounded-[3.5px]"
                    style={{ left: c.w * STEP, top: c.d * STEP, width: CELL, height: CELL, background: empty, boxShadow: hot === i ? `0 0 0 1.5px ${fg}` : "none" }}
                    onPointerEnter={() => setHot(i)}
                  />
                ),
              )}
            </div>
          ) : null}

          {grid.map((c, i) => {
            const x = c.w * STEP, y = c.d * STEP;
            // Flat: lifted by the lens. 3D: its real height
            let h = 0;
            if (three) h = !grown || c.future ? 0 : c.count > 0 ? 3 + (c.count / max) * BAR : 0;
            else if (lens && !still) {
              const dist = Math.hypot(x + CELL / 2 - lens.x, y + CELL / 2 - lens.y);
              h = Math.max(0, 1 - dist / 46) * 16;
            }
            if (hot === i && !three) h = Math.max(h, 18);
            const top = c.future ? "transparent" : shade(c.count);
            const delay = still ? 0 : three ? c.w * 22 + c.d * 6 : 0;
            const ease = three ? `.7s cubic-bezier(.3,1.35,.5,1) ${delay}ms` : ".18s ease-out";
            const ring = hot === i ? `0 0 0 1.5px ${fg}` : "";
            // Only busy days in 3D get sides. Everything moves with transform alone, so the
            // browser never has to lay the page out again while it animates.
            const bar = !c.future && c.count > 0;
            const lift = !three && h > 1 ? `${h / 5}px ${h / 2.5}px ${h / 2}px rgba(20,19,16,.16)` : "";
            const face = {
              background: top,
              borderRadius: 3.5,
              outline: c.future ? `1px dashed ${dark ? "rgba(255,255,255,.12)" : "rgba(20,19,16,.1)"}` : "none",
              outlineOffset: -1,
            } as const;
            return (
              <div
                key={c.key}
                className="absolute"
                style={{ left: x, top: y, width: CELL, height: CELL, transformStyle: "preserve-3d" }}
                onPointerEnter={() => !c.future && setHot(i)}
              >
                {bar ? (
                  // A bar: a box one pixel deep, stretched to its height with scaleZ
                  <div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d", transform: `scaleZ(${Math.max(h, 0.001)})`, transition: `transform ${ease}` }}
                  >
                    {([
                      ["south", { left: 0, top: CELL, width: CELL, height: 1, transformOrigin: "top", transform: "rotateX(90deg)" }, 0.24],
                      ["north", { left: 0, top: 0, width: CELL, height: 1, transformOrigin: "top", transform: "rotateX(90deg)" }, 0.1],
                      ["east", { left: CELL, top: 0, width: 1, height: CELL, transformOrigin: "left", transform: "rotateY(-90deg)" }, 0.38],
                      ["west", { left: 0, top: 0, width: 1, height: CELL, transformOrigin: "left", transform: "rotateY(-90deg)" }, 0.3],
                    ] as const).map(([side, box, dim]) => (
                      <div key={side} className="absolute" style={{ ...box, background: darken(top, dim) }} />
                    ))}
                    <div
                      className="absolute inset-0"
                      style={{
                        ...face,
                        transform: "translateZ(1px)",
                        // A soft light from the top-left, so the top reads as slightly curved
                        backgroundImage: three ? "linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,0) 60%)" : "none",
                        boxShadow: [ring, lift].filter(Boolean).join(", ") || "none",
                        transition: `box-shadow ${ease}`,
                      }}
                    />
                  </div>
                ) : three ? null : (
                  // A flat day: one square, lifted toward you by the lens with a plain shadow
                  <div
                    className="absolute inset-0"
                    style={{
                      ...face,
                      transform: `translateZ(${h}px)`,
                      transition: `transform ${ease}, box-shadow ${ease}`,
                      boxShadow: [ring, lift].filter(Boolean).join(", ") || "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Three numbers worth knowing */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["Active days", String(active)],
          ["Busiest day", String(max)],
          ["Longest streak", `${streak}d`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[14px] px-3 py-2.5" style={{ background: dark ? "rgba(255,255,255,.06)" : "rgba(20,19,16,.04)" }}>
            <p className="text-[11px]" style={{ opacity: 0.5 }}>{k}</p>
            <p className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em]" style={{ fontFamily: DISPLAY }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
