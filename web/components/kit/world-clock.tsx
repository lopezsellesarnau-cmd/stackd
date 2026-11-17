'use client'

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * World clock · StackD Kit 20
 * A clock per city, each on its own panel (with theme="auto", white while it's day there and black at night). Drag the
 * minute hand of any clock and all of them turn together, so you can find a time that works for
 * everyone; let go and it glides to the nearest quarter hour. "Now" springs back to the live time.
 * When every city is inside working hours, a small sign says so.
 * Keyboard: on a clock, ← → move 15 minutes, Esc goes back to now.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type City = { code: string; timeZone: string; name?: string };

type Props = {
  cities?: City[];
  /** Working hours, used for the "Everyone's at work" sign. Default [9, 18]. */
  hours?: [number, number];
  /** Called when the planned time changes, with the minutes away from now (0 = live). */
  onChange?: (minutes: number) => void;
  /** Width in px, or any CSS length. Default 340. */
  width?: number | string;
  /** "light" (default) or "dark": all panels one colour. "auto": each panel is white by day and black by night. */
  theme?: "auto" | "light" | "dark";
  /** The second hand. Default Ochre. */
  color?: string;
  className?: string;
};

const DEFAULT: City[] = [
  { code: "AMS", timeZone: "Europe/Amsterdam", name: "Amsterdam" },
  { code: "NYC", timeZone: "America/New_York", name: "New York" },
];
const INK = "#141310";
const MIN = 60_000;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The wall time in a zone: hours, minutes, seconds, the date line and the UTC offset. */
function useZone(timeZone: string) {
  return useMemo(() => {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      weekday: "short", month: "short", day: "numeric", timeZoneName: "shortOffset",
    });
    return (t: number) => {
      const p: Record<string, string> = {};
      for (const x of f.formatToParts(t)) p[x.type] = x.value;
      const off = (p.timeZoneName || "GMT").replace("GMT", "") || "+0";
      return {
        h: Number(p.hour) % 24,
        m: Number(p.minute),
        s: Number(p.second) + (t % 1000) / 1000,
        date: `${p.weekday}, ${p.month} ${p.day}`,
        utc: `UTC ${off.replace(/^([+-])/, "$1")}`,
      };
    };
  }, [timeZone]);
}

function Face({
  zone, at, size, dark, color, planning, onTurn, onLet, onKey, label,
}: {
  zone: ReturnType<typeof useZone>;
  at: React.MutableRefObject<() => number>;
  size: number;
  dark: boolean;
  color: string;
  planning: boolean;
  onTurn: (minutes: number) => void;
  onLet: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  label: string;
}) {
  const hour = useRef<SVGGElement>(null);
  const minute = useRef<SVGGElement>(null);
  const second = useRef<SVGGElement>(null);
  const last = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  // The hands move outside React, every frame
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const z = zone(at.current());
      hour.current?.setAttribute("transform", `rotate(${((z.h % 12) + z.m / 60 + z.s / 3600) * 30} 50 50)`);
      minute.current?.setAttribute("transform", `rotate(${(z.m + z.s / 60) * 6} 50 50)`);
      second.current?.setAttribute("transform", `rotate(${z.s * 6} 50 50)`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [zone, at]);

  const angle = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  const fg = dark ? "#FFFFFF" : INK;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0;
    return <line key={i} x1="50" y1={big ? 6 : 5} x2="50" y2={big ? 13 : 8.5} stroke={fg} strokeOpacity={big ? 0.9 : 0.4} strokeWidth={big ? 1.6 : 0.8} strokeLinecap="round" transform={`rotate(${i * 6} 50 50)`} />;
  });

  return (
    <svg
      ref={svg}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="slider"
      tabIndex={0}
      aria-label={`${label}. Drag the minute hand to plan a time`}
      aria-valuetext={(() => { const z = zone(at.current()); return `${String(z.h).padStart(2, "0")}:${String(z.m).padStart(2, "0")}`; })()}
      className="shrink-0 cursor-grab touch-none select-none outline-none active:cursor-grabbing [&:focus-visible]:rounded-full [&:focus-visible]:ring-2"
      style={{ ["--tw-ring-color" as string]: color }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = angle(e); }}
      onPointerMove={(e) => {
        if (last.current === null) return;
        const a = angle(e);
        let d = a - last.current;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        last.current = a;
        onTurn(d / 6); // the minute hand: 6° a minute
      }}
      onPointerUp={() => { last.current = null; onLet(); }}
      onPointerCancel={() => { last.current = null; onLet(); }}
      onKeyDown={onKey}
    >
      {ticks}
      {/* Hour and minute hands: a thin neck, then a rounded blade */}
      <g ref={hour}>
        <line x1="50" y1="50" x2="50" y2="42" stroke={fg} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="50" y1="42" x2="50" y2="27" stroke={fg} strokeWidth="4.2" strokeLinecap="round" />
      </g>
      <g ref={minute}>
        <line x1="50" y1="50" x2="50" y2="42" stroke={fg} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="50" y1="42" x2="50" y2="12" stroke={fg} strokeWidth="4.2" strokeLinecap="round" />
      </g>
      <g ref={second} style={{ opacity: planning ? 0 : 1, transition: "opacity .3s" }}>
        <line x1="50" y1="58" x2="50" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="2.6" fill={planning ? fg : color} stroke={dark ? INK : "#FFFFFF"} strokeWidth="1" />
    </svg>
  );
}

function Row({
  city, at, tick, auto, theme, ...face
}: {
  city: City;
  at: React.MutableRefObject<() => number>;
  tick: number;
  auto: boolean;
  theme: "auto" | "light" | "dark";
} & Omit<React.ComponentProps<typeof Face>, "zone" | "at" | "dark" | "label">) {
  const zone = useZone(city.timeZone);
  const z = zone(at.current());
  void tick; // re-read the text when the clock ticks
  const night = z.h < 7 || z.h >= 19;
  const dark = theme === "dark" || (auto && night);
  const fg = dark ? "#FFFFFF" : INK;
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[22px] py-4 pl-5 pr-4 motion-safe:transition-colors motion-safe:duration-500"
      style={{ background: dark ? INK : "#FFFFFF", color: fg, boxShadow: dark ? "none" : "inset 0 0 0 1px rgba(20,19,16,0.06)" }}
    >
      <div className="min-w-0">
        <p className="text-[34px] font-semibold leading-none tracking-[-0.02em]">{city.code}</p>
        <p className="mt-2 text-[14px] leading-tight" style={{ opacity: 0.6 }}>{z.date}</p>
        <p className="text-[14px] leading-tight tabular-nums" style={{ opacity: 0.6 }}>{z.utc}</p>
      </div>
      <Face zone={zone} at={at} dark={dark} label={city.name ?? city.code} {...face} />
    </div>
  );
}

export function WorldClock({
  cities = DEFAULT,
  hours = [9, 18],
  onChange,
  width = 340,
  theme = "light",
  color = "#BE9344",
  className = "",
}: Props) {
  // offset: how far the planned time is from now, in ms. Kept in a ref so the hands read it every frame
  const off = useRef(0);
  const at = useRef(() => Date.now() + off.current);
  const [shown, setShown] = useState(0); // the offset, in whole minutes, for the text
  const [tick, setTick] = useState(0);
  const spring = useRef(0);
  const changed = useRef(onChange);
  changed.current = onChange;

  // Text (dates, offsets, the sign) once a second is plenty
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const publish = () => {
    const m = Math.round(off.current / MIN);
    setShown(m);
    changed.current?.(m);
  };

  // Glide the offset to a target: critically damped, so it lands without a bounce
  const glide = (to: number) => {
    cancelAnimationFrame(spring.current);
    if (calm()) { off.current = to; publish(); return; }
    let v = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      v += (120 * (to - off.current) - 22 * v) * dt;
      off.current += v * dt;
      if (Math.abs(to - off.current) < 500 && Math.abs(v) < 2000) { off.current = to; publish(); return; }
      publish();
      spring.current = requestAnimationFrame(step);
    };
    spring.current = requestAnimationFrame(step);
  };

  const turn = (minutes: number) => {
    cancelAnimationFrame(spring.current);
    off.current = clamp(off.current + minutes * MIN, -24 * 60 * MIN, 24 * 60 * MIN);
    publish();
  };
  // Let go: to the nearest quarter hour of the planned time (or back to live if it's close to now)
  const settle = () => {
    if (Math.abs(off.current) < 4 * MIN) return glide(0);
    const t = Date.now() + off.current;
    const q = Math.round(t / (15 * MIN)) * 15 * MIN;
    glide(q - Date.now());
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Home") { e.preventDefault(); glide(0); return; }
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const t = Date.now() + off.current;
    const q = (Math.round(t / (15 * MIN)) + d) * 15 * MIN;
    glide(q - Date.now());
  };

  const planning = shown !== 0;
  // Everyone at work? Checked on the planned time
  const all = cities.every((c) => {
    const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: c.timeZone, hour: "2-digit", hour12: false }).format(at.current())) % 24;
    return h >= hours[0] && h < hours[1];
  });
  void tick;
  const a = Math.abs(shown);
  const diff = `${shown < 0 ? "−" : "+"}${Math.floor(a / 60) ? `${Math.floor(a / 60)}h ` : ""}${a % 60 ? `${a % 60}m` : ""}`.trim();

  return (
    <div
      className={`select-none rounded-[30px] p-2 ${className}`}
      style={{ width, background: "#ECEBE8", boxShadow: "inset 0 0 0 1px rgba(20,19,16,0.05)" }}
    >
      <div className="flex flex-col gap-2">
        {cities.map((c) => (
          <Row
            key={c.timeZone + c.code}
            city={c}
            at={at}
            tick={tick}
            auto={theme === "auto"}
            theme={theme}
            size={104}
            color={color}
            planning={planning}
            onTurn={turn}
            onLet={settle}
            onKey={key}
          />
        ))}
      </div>

      {/* Footer: live, or how far you've moved and the way back */}
      <div className="flex h-11 items-center justify-between px-3 text-[13px]" style={{ color: INK }}>
        <span className="flex items-center gap-2" aria-live="polite">
          <span
            className="h-2 w-2 rounded-full motion-safe:transition-colors"
            style={{ background: all ? "#6C8544" : "rgba(20,19,16,0.25)" }}
          />
          <span style={{ opacity: all ? 0.9 : 0.5 }}>{all ? "Everyone's at work" : planning ? "Someone's off" : "Drag a hand to plan"}</span>
        </span>
        <span className="flex items-center gap-2">
          {planning ? <span className="tabular-nums" style={{ opacity: 0.5 }}>{diff}</span> : null}
          <button
            type="button"
            onClick={() => glide(0)}
            disabled={!planning}
            className="rounded-full px-3 py-1 text-[12px] font-medium motion-safe:transition-[opacity,transform] motion-safe:active:scale-95"
            style={{ background: INK, color: "#FFFFFF", opacity: planning ? 1 : 0, pointerEvents: planning ? "auto" : "none" }}
          >
            Now
          </button>
        </span>
      </div>
    </div>
  );
}
