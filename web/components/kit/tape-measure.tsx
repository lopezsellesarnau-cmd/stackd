'use client'

import { useEffect, useId, useRef, useState } from "react";
import { Bot, type BotShape } from "./bot";

/**
 * Tape measure · StackD Kit 30
 * A slider you pull like a real tape measure. Grab the hook (or the tape) and pull: the tape runs out of
 * its case with its marks sliding past, and the reading at the case's mouth is the value. Let go and it
 * whips back in and clacks home, unless the lock is on: then it stays where you left it, snapped to the
 * step. The Bot sits on the case and watches the hook; when the tape slams home it squints.
 * One real slider (arrow keys, Home/End, screen readers) and a real lock button.
 * React + Tailwind and the StackD Bot, no other libraries. Respects reduced motion.
 */

type Props = {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Where it starts (and stays, if locked). */
  defaultValue?: number;
  /** Start with the lock on. Default false: it retracts when you let go. */
  defaultLocked?: boolean;
  /** Called while it moves, and when it settles. */
  onChange?: (value: number) => void;
  /** Width in px; the tape can run out to the far edge. */
  width?: number;
  /** "light": ink case on a light page (default). "dark": white case on a dark page. */
  theme?: "light" | "dark";
  /** The tape's colour. Default Ochre. */
  tape?: string;
  bot?: BotShape;
  label?: string;
};

const CASE = 112; // the case, a rounded square
const TAPE_H = 34; // the tape's height
const MOUTH = CASE - 2; // where the tape leaves the case (from the left)
const WINDOW = 43; // the round window on the case, radius
const COIL = 40; // the coil's radius when all the tape is in
const HUB = 19; // the hub at its centre: the Bot
const FONT = '"SF Pro Display", -apple-system, system-ui, "Helvetica Neue", sans-serif';
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TapeMeasure({
  min = 0,
  max = 200,
  step = 1,
  unit = "cm",
  defaultValue,
  defaultLocked = false,
  onChange,
  width = 560,
  theme = "light",
  tape = "#BE9344",
  bot = "hexagon",
  label = "Length",
}: Props) {
  const dark = theme === "dark";
  const ink = dark ? "#FFFFFF" : "#141310";
  const paper = dark ? "#141310" : "#FFFFFF";
  const id = useId();
  const reach = width - MOUTH - 26; // how far the tape can run out, px
  const per = reach / (max - min); // px per unit

  const [locked, setLocked] = useState(defaultLocked);
  const [shown, setShown] = useState(defaultValue ?? min);
  const [squint, setSquint] = useState(false);
  const [look, setLook] = useState<{ x: number; y: number }>({ x: 0.6, y: 0.1 });

  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const hook = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  // The coil inside the case: its edge and the marks that show it spinning
  const coil = useRef<SVGCircleElement>(null);
  const coilClip = useRef<SVGCircleElement>(null);
  const spin = useRef<SVGGElement>(null);
  // The tape's length out of the case in px, its speed, and where it's headed
  const s = useRef({ L: ((defaultValue ?? min) - min) * per, v: 0, target: ((defaultValue ?? min) - min) * per, dragging: false, raf: 0, prev: 0 });
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const valueOf = (L: number) => Math.min(max, Math.max(min, min + L / per));
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));

  // Draw: slide the strip and the hook; the value label follows
  const draw = () => {
    const { L } = s.current;
    if (strip.current) strip.current.style.transform = `translateX(${(L - reach).toFixed(2)}px)`;
    if (hook.current) hook.current.style.transform = `translateX(${L.toFixed(2)}px)`;
    // The coil gets thinner as the tape runs out, and turns with it
    const R = HUB + 3 + (COIL - HUB - 3) * (1 - L / reach);
    coil.current?.setAttribute("r", R.toFixed(2));
    coilClip.current?.setAttribute("r", R.toFixed(2));
    spin.current?.setAttribute("transform", `rotate(${((-L / ((R + HUB) / 2)) * (180 / Math.PI)).toFixed(1)} ${CASE / 2} ${CASE / 2})`);
  };

  const settle = (v: number) => {
    setShown(v);
    onChange?.(v);
  };

  const run = () => {
    const st = s.current;
    if (st.raf) return;
    const still = calm();
    const tick = (now: number) => {
      const dt = st.prev ? Math.min(2.5, (now - st.prev) / 16.67) : 1;
      st.prev = now;
      if (still) {
        st.L = st.target;
        st.v = 0;
      } else {
        // A stiff spring that overshoots a little: the whip
        st.v = (st.v + (st.target - st.L) * 0.075 * dt) * Math.pow(0.8, dt);
        st.L += st.v * dt;
        // Home: it can't go into the case; it clacks
        if (st.L < 0) {
          st.L = 0;
          if (st.v < -6 && !still) clack(Math.min(1, -st.v / 40));
          st.v = 0;
        }
      }
      draw();
      const v = valueOf(st.L);
      setShown(Math.round(v / step) * step);
      // The Bot watches the hook
      const far = st.L / reach;
      setLook({ x: 0.35 + 0.5 * far, y: 0.1 });
      if (Math.abs(st.target - st.L) + Math.abs(st.v) < 0.1 && !st.dragging) {
        st.L = st.target;
        draw();
        st.raf = 0;
        st.prev = 0;
        settle(snap(valueOf(st.L)));
        return;
      }
      st.raf = requestAnimationFrame(tick);
    };
    st.raf = requestAnimationFrame(tick);
  };

  // Slamming home: the case jolts and the Bot squints
  const clack = (k: number) => {
    body.current?.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${(-6 * k).toFixed(1)}px) rotate(${(-3 * k).toFixed(1)}deg)` }, { transform: "translateX(0)" }],
      { duration: 260, easing: "cubic-bezier(.3,1.6,.5,1)" },
    );
    setSquint(true);
    setTimeout(() => setSquint(false), 450);
  };

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(s.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  // Dragging: the tape follows the pointer from where it was grabbed
  const grab = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const st = s.current;
    st.dragging = true;
    const startX = e.clientX;
    const startL = st.L;
    const move = (ev: PointerEvent) => {
      st.target = Math.min(reach, Math.max(0, startL + ev.clientX - startX));
      run();
    };
    const up = () => {
      st.dragging = false;
      st.target = lockedRef.current ? (snap(valueOf(st.target)) - min) * per : 0;
      run();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const key = (e: React.KeyboardEvent) => {
    const st = s.current;
    const big = (max - min) / 10;
    const now = snap(valueOf(st.target));
    const to =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? now + step :
      e.key === "ArrowLeft" || e.key === "ArrowDown" ? now - step :
      e.key === "PageUp" ? now + big : e.key === "PageDown" ? now - big :
      e.key === "Home" ? min : e.key === "End" ? max : null;
    if (to === null) return;
    e.preventDefault();
    // With the keyboard it stays put, like it's locked: you're choosing a value
    st.target = (snap(to) - min) * per;
    run();
  };

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    if (!next && !s.current.dragging) {
      // Unlocking lets it go home
      s.current.target = 0;
      run();
    }
  };

  // The marks, as many as fit: small ticks at least 4 px apart, numbers at least 34 px apart
  const marks = [];
  const pick = (opts: number[], gap: number) => opts.find((u) => u * per >= gap) ?? opts[opts.length - 1];
  const minor = pick([1, 2, 5, 10, 20, 50, 100], 4);
  const numbered = pick([10, 20, 50, 100, 200, 500, 1000], 34);
  for (let v = min; v <= max + 1e-9; v += minor) {
    const x = reach - (v - min) * per; // the hook end is 0, so the numbers grow towards the case
    const n = Math.round(v - min);
    const big = n % numbered === 0;
    const tall = big ? 16 : n % (minor * 5) === 0 ? 11 : 6;
    marks.push(<line key={v} x1={x} x2={x} y1={TAPE_H - 2} y2={TAPE_H - 2 - tall} stroke="#141310" strokeWidth={big ? 1.6 : 1} />);
    if (big && v !== min)
      marks.push(
        <text key={`t${v}`} x={x - 3} y={13} textAnchor="end" fontSize={11} fontWeight={600} fill="#141310" fontFamily={FONT}>
          {v}
        </text>,
      );
  }

  return (
    <div ref={root} className="relative select-none" style={{ width, height: CASE + 46 + 12, color: ink, touchAction: "none" }}>
      {/* The reading at the case's mouth */}
      <div
        className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-full px-2.5 py-1 text-[14px] font-medium tabular-nums"
        style={{ left: MOUTH, background: ink, color: paper, fontFamily: FONT }}
        aria-hidden
      >
        {shown} {unit}
      </div>

      {/* The tape, clipped at the case's mouth, sliding out; and its hook */}
      <div className="absolute overflow-hidden" style={{ left: MOUTH, top: 46 + CASE / 2 - TAPE_H / 2 + 8, width: reach + 4, height: TAPE_H }}>
        <div
          ref={strip}
          className="absolute top-0 left-0 h-full cursor-grab active:cursor-grabbing"
          style={{ width: reach, background: tape, borderRadius: 3, boxShadow: "inset 0 -2px 0 rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.35)" }}
          onPointerDown={grab}
        >
          <svg aria-hidden width={reach} height={TAPE_H} className="block">
            {marks}
          </svg>
        </div>
      </div>
      <div
        ref={hook}
        className="absolute cursor-grab active:cursor-grabbing"
        // Outside the case, resting against it like a real tape's hook, and on top so it's easy to grab
        style={{ left: MOUTH + 2, top: 46 + CASE / 2 - TAPE_H / 2 + 2, width: 12, height: TAPE_H + 12, zIndex: 2, background: "#8E8A80", borderRadius: "2px 4px 4px 2px", boxShadow: "inset -2px 0 0 rgba(0,0,0,.2)" }}
        onPointerDown={grab}
        aria-hidden
      />

      {/* The case: a window onto the coil of tape, the Bot as its hub, and the lock on top */}
      <div ref={body} className="absolute left-0" style={{ top: 46, width: CASE, height: CASE }}>
        <div className="absolute inset-0 rounded-[30px]" style={{ background: ink }} />
        <svg aria-hidden className="absolute inset-0" width={CASE} height={CASE}>
          <defs>
            <clipPath id={`${id}-coil`}>
              <circle ref={coilClip} cx={CASE / 2} cy={CASE / 2} r={COIL} />
            </clipPath>
          </defs>
          {/* The window */}
          <circle cx={CASE / 2} cy={CASE / 2} r={WINDOW} fill={dark ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.08)"} />
          {/* The coil: the tape wound round, its layers as fine rings */}
          <circle ref={coil} cx={CASE / 2} cy={CASE / 2} r={COIL} fill={tape} />
          <g clipPath={`url(#${id}-coil)`} fill="none" stroke="rgba(20,19,16,.28)" strokeWidth={0.8}>
            {Array.from({ length: Math.floor((COIL - HUB) / 2.4) }, (_, k) => (
              <circle key={k} cx={CASE / 2} cy={CASE / 2} r={HUB + 2 + k * 2.4} />
            ))}
            {/* A few marks on the tape, so you see the coil turn */}
            <g ref={spin}>
              {Array.from({ length: 6 }, (_, k) => {
                const a = (k / 6) * Math.PI * 2;
                return <line key={k} x1={CASE / 2 + Math.cos(a) * (HUB + 6)} y1={CASE / 2 + Math.sin(a) * (HUB + 6)} x2={CASE / 2 + Math.cos(a) * (COIL - 1)} y2={CASE / 2 + Math.sin(a) * (COIL - 1)} stroke="rgba(20,19,16,.35)" strokeWidth={1.2} />;
              })}
            </g>
          </g>
          {/* The hub */}
          <circle cx={CASE / 2} cy={CASE / 2} r={HUB} fill={ink} />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Bot size={HUB * 2 - 6} shape={bot} eyes="tall" color={paper} eyeColor={ink} look={look} happy={squint} poke={false} />
        </div>
        {/* The lock: a thumb tab under the case that slides forward and turns the tape's colour */}
        <button
          type="button"
          onClick={toggleLock}
          aria-pressed={locked}
          aria-label={locked ? "Lock on: it stays where you leave it" : "Lock off: it goes back when you let go"}
          className="absolute bottom-[-9px] left-[30px] h-[16px] w-[52px] rounded-full outline-none focus-visible:ring-2"
          style={{ background: ink, boxShadow: `inset 0 0 0 1.5px ${dark ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.18)"}`, ["--tw-ring-color" as string]: ink }}
        >
          <span
            className="absolute top-[3px] h-[10px] w-[22px] rounded-full"
            style={{ left: locked ? 27 : 3, background: locked ? tape : dark ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.4)", transition: "left .22s cubic-bezier(.3,1.4,.5,1), background .2s" }}
          />
        </button>
      </div>

      {/* The real control, for the keyboard and screen readers, over the tape */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={`${shown} ${unit}`}
        aria-describedby={`${id}-help`}
        onKeyDown={key}
        // Over the tape so its focus ring shows there; it lets the pointer through to the tape
        className="pointer-events-none absolute rounded-md outline-none focus-visible:ring-2"
        style={{ left: MOUTH, top: 46 + CASE / 2 - TAPE_H / 2 + 8, width: reach, height: TAPE_H, ["--tw-ring-color" as string]: ink }}
      />
      <span id={`${id}-help`} className="sr-only">
        Drag the tape out to measure. With the lock off it goes back when you let go.
      </span>
    </div>
  );
}
