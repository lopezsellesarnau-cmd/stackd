'use client'

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Rotary dial · StackD Kit 07
 * A knob you turn by dragging in a circle. It follows your finger smoothly while the value and
 * the ring of ticks move in clean steps; let go and it clicks into place with a small overshoot.
 * Past either end it gives a little, like rubber, and springs back.
 * Arrow keys, Page Up/Down and Home/End work too. White and black versions.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

type Props = {
  /** Controlled value. Leave it out and the dial keeps its own. */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Small text under the number, e.g. "Volume" or "°C". */
  label?: string;
  format?: (n: number) => string;
  theme?: "light" | "dark";
  /** Colour of the lit ticks. Defaults to ink on light, white on dark. */
  color?: string;
  /** Diameter in px. */
  size?: number;
};

const SWEEP = 270; // degrees the dial can turn, from -135 to +135
const START = -SWEEP / 2;
const GIVE = 10; // how far past the ends it can be pulled, in degrees

export function RotaryDial({
  value: controlled,
  defaultValue = 40,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = "Volume",
  format = (n) => String(n),
  theme = "light",
  color,
  size = 220,
}: Props) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const [drag, setDrag] = useState<number | null>(null); // the knob's free angle while dragging
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  const dark = theme === "dark";
  const ink = dark ? "#FFFFFF" : "#141310";
  const lit = color ?? ink;
  const span = max - min || 1;
  const toAngle = (v: number) => START + ((v - min) / span) * SWEEP;
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const fromAngle = (a: number) => snap(min + ((a - START) / SWEEP) * span);

  function set(v: number) {
    const next = snap(v);
    if (next === value) return;
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
    // A tiny tick on phones that support it (Android). iOS ignores it.
    navigator.vibrate?.(4);
  }

  // Angle of the pointer around the centre, 0 at the top, clockwise
  function pointerAngle(e: PointerEvent) {
    const r = box.current!.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    last.current = pointerAngle(e);
    setDrag(toAngle(value));
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (drag === null) return;
    const a = pointerAngle(e);
    let d = a - last.current;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    last.current = a;
    // The free angle keeps going; what you see is held near the ends with a rubbery give
    const free = drag + d;
    const end = START + SWEEP;
    const held = free < START ? Math.max(free, START - GIVE * 3) : free > end ? Math.min(free, end + GIVE * 3) : free;
    setDrag(held);
    set(fromAngle(Math.min(end, Math.max(START, held))));
  }

  function up() {
    setDrag(null);
  }

  function keys(e: KeyboardEvent) {
    const big = Math.max(step, Math.round(span / 10 / step) * step);
    const by: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big };
    if (e.key in by) set(value + by[e.key]);
    else if (e.key === "Home") set(min);
    else if (e.key === "End") set(max);
    else return;
    e.preventDefault();
  }

  // What the knob shows: the finger's angle while dragging (rubbery past the ends), the stepped one at rest
  const free = drag;
  const end = START + SWEEP;
  const shown =
    free === null
      ? toAngle(value)
      : free < START
        ? START - GIVE * (1 - Math.exp((free - START) / (GIVE * 1.5)))
        : free > end
          ? end + GIVE * (1 - Math.exp(-(free - end) / (GIVE * 1.5)))
          : free;

  // Ticks: one per step up to 51, evenly spread otherwise
  const steps = Math.round(span / step);
  const count = Math.min(steps, 50) + 1;
  const ticks = Array.from({ length: count }, (_, i) => ({ v: min + (i / (count - 1)) * span, a: START + (i / (count - 1)) * SWEEP }));
  const current = ticks.reduce((best, t, i) => (Math.abs(t.v - value) < Math.abs(ticks[best].v - value) ? i : best), 0);

  const R = size / 2;
  const knob = size * 0.66;

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${format(value)} ${label}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={keys}
      className="relative shrink-0 cursor-grab touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#888]/40 focus-visible:ring-offset-4 active:cursor-grabbing"
      style={{ width: size, height: size, color: ink }}
    >
      {/* The ring of ticks: lit up to the value, the current one longer */}
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
        {ticks.map((t, i) => {
          const on = t.v <= value + 1e-9;
          const here = i === current;
          const rad = (t.a * Math.PI) / 180;
          const outer = R - 2;
          const inner = outer - (here ? size * 0.075 : i % 5 === 0 ? size * 0.05 : size * 0.035);
          return (
            <line
              key={i}
              x1={R + Math.sin(rad) * inner}
              y1={R - Math.cos(rad) * inner}
              x2={R + Math.sin(rad) * outer}
              y2={R - Math.cos(rad) * outer}
              stroke={on ? lit : ink}
              strokeOpacity={on ? 1 : 0.14}
              strokeWidth={here ? 2.5 : 1.75}
              strokeLinecap="round"
              style={{ transition: "stroke-opacity .15s ease, stroke .15s ease" }}
            />
          );
        })}
      </svg>

      {/* The knob */}
      <div
        className="absolute rounded-full"
        style={{
          width: knob,
          height: knob,
          left: (size - knob) / 2,
          top: (size - knob) / 2,
          background: dark
            ? "radial-gradient(circle at 32% 26%, #34322D 0%, #1E1D1A 55%, #141310 100%)"
            : "radial-gradient(circle at 32% 26%, #FFFFFF 0%, #F6F5F2 50%, #E7E5E0 100%)",
          boxShadow: dark
            ? "0 14px 30px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -3px 6px rgba(0,0,0,0.35)"
            : "0 14px 30px rgba(20,19,16,0.16), 0 2px 4px rgba(20,19,16,0.08), inset 0 1px 1px #FFFFFF, inset 0 -3px 6px rgba(20,19,16,0.06)",
        }}
      >
        {/* The part that turns: grip lines round the edge and the indicator dot */}
        <div
          className="absolute inset-0 motion-reduce:!transition-none"
          style={{
            transform: `rotate(${shown}deg)`,
            // Free while dragging; a click with a little overshoot when it settles
            transition: drag === null ? "transform .38s cubic-bezier(.34,1.56,.64,1)" : "none",
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            {Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={50 + Math.sin(a) * 45}
                  y1={50 - Math.cos(a) * 45}
                  x2={50 + Math.sin(a) * 49}
                  y2={50 - Math.cos(a) * 49}
                  stroke={ink}
                  strokeOpacity={dark ? 0.14 : 0.1}
                  strokeWidth={0.8}
                />
              );
            })}
            <circle cx={50} cy={13} r={3.2} fill={lit} />
          </svg>
        </div>

        {/* The reading stays upright */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold tabular-nums leading-none tracking-[-0.03em]" style={{ fontSize: knob * 0.26 }}>
            {format(value)}
          </span>
          {label ? (
            <span className="mt-1 opacity-45" style={{ fontSize: Math.max(10, knob * 0.075) }}>
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
