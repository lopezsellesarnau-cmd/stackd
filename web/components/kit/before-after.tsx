'use client'

import { useEffect, useRef } from "react";

/**
 * Before / after · StackD Kit 18
 * Two pictures, one on top of the other, split by a line you drag. The line is jelly: the point you
 * hold follows your hand and the two ends trail behind on a spring, so a quick drag bends it and it
 * wobbles a little as it settles. The edge of the "before" picture is the same curve.
 * Press anywhere to jump there. Keyboard: ← → move 5%, Home / End go to the edges.
 * Everything moves outside React: one animation loop that sleeps when the line is still.
 * React + Tailwind, no other dependencies. Respects reduced motion (a straight line, no spring).
 */

export type CompareImage = { src: string; alt?: string; label?: string };

type Props = {
  before: CompareImage;
  after: CompareImage;
  /** Where the line starts, 0 (all "after") to 1 (all "before"). Default 0.5. */
  defaultValue?: number;
  /** Called while the line moves, with its position from 0 to 1. */
  onChange?: (value: number) => void;
  /** Size: px, or any CSS length like "100%". Default 420 × 300. */
  width?: number | string;
  height?: number | string;
  /** How much the line bends, 0 (straight) to 1. Default 1. */
  jelly?: number;
  /** Show the "Before" / "After" pills. Default true. */
  labels?: boolean;
  /** "light": white line, knob and pills. "dark": black ones. */
  theme?: "light" | "dark";
  className?: string;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function BeforeAfter({
  before,
  after,
  defaultValue = 0.5,
  onChange,
  width = 420,
  height = 300,
  jelly = 1,
  labels = true,
  theme = "light",
  className = "",
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const jellyRef = useRef(jelly);
  jellyRef.current = jelly;

  // p: where the line is (0–1). T: same in px. E, V: where the ends are and how fast they go.
  // gy, gv: the height of the point being held, which drifts back to the middle once let go.
  const s = useRef({ p: clamp(defaultValue, 0, 1), T: 0, E: 0, V: 0, gy: 0, gv: 0, w: 0, h: 0, held: false, raf: 0, last: 0 });

  const draw = () => {
    const { T, E, gy, w, h } = s.current;
    if (!w) return;
    const a = gy / 2, b = (gy + h) / 2;
    const curve = `C${E} ${a} ${T} ${a} ${T} ${gy} C${T} ${b} ${E} ${b} ${E} ${h}`;
    line.current?.setAttribute("d", `M${E} 0 ${curve}`);
    if (top.current) top.current.style.clipPath = `path("M0 0 L${E} 0 ${curve} L0 ${h} Z")`;
    if (knob.current) {
      knob.current.style.left = knob.current.style.top = "0";
      knob.current.style.transform = `translate(${T}px, ${gy}px) translate(-50%, -50%)`;
    }
  };

  const still = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || jellyRef.current <= 0;

  // One loop for the spring. Ends: underdamped, so they overshoot and wobble. Held point: critically
  // damped, so it glides back to the middle without bouncing.
  const tick = (now: number) => {
    const st = s.current;
    const dt = Math.min(1 / 30, (now - st.last) / 1000 || 1 / 60);
    st.last = now;
    if (still()) { st.E = st.T; st.V = 0; }
    else {
      const max = 70 * clamp(jellyRef.current, 0, 1);
      for (let i = 0; i < 4; i++) {
        const d = dt / 4;
        st.V += (190 * (st.T - st.E) - 13 * st.V) * d;
        st.E += st.V * d;
      }
      st.E = clamp(st.E, st.T - max, st.T + max);
    }
    if (!st.held) {
      const mid = st.h / 2;
      st.gv += (60 * (mid - st.gy) - 15.5 * st.gv) * dt;
      st.gy += st.gv * dt;
    }
    draw();
    const rest = !st.held && Math.abs(st.T - st.E) < 0.1 && Math.abs(st.V) < 0.5 && Math.abs(st.gy - st.h / 2) < 0.2;
    if (rest) { st.E = st.T; st.V = 0; st.gy = st.h / 2; st.gv = 0; st.raf = 0; draw(); return; }
    st.raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    const st = s.current;
    if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); }
  };

  const setP = (p: number) => {
    const st = s.current;
    st.p = clamp(p, 0, 1);
    st.T = st.p * st.w;
    root.current?.setAttribute("aria-valuenow", String(Math.round(st.p * 100)));
    change.current?.(st.p);
    wake();
  };

  // Size: measured, so a `className="w-full"` works too. A resize puts the line back, straight.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const st = s.current;
      st.w = el.offsetWidth;
      st.h = el.offsetHeight;
      st.T = st.E = st.p * st.w;
      st.V = 0;
      st.gy = st.h / 2;
      draw();
    });
    ro.observe(el);
    return () => { ro.disconnect(); cancelAnimationFrame(s.current.raf); s.current.raf = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer position in the component's own pixels (inside a scaled parent they aren't screen pixels)
  const at = (e: React.PointerEvent) => {
    const el = root.current!;
    const r = el.getBoundingClientRect();
    const k = r.width / (el.offsetWidth || 1) || 1;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };
  const hold = (e: React.PointerEvent) => {
    const st = s.current;
    if (!st.held || !st.w) return;
    const { x, y } = at(e);
    st.gy = clamp(y, 22, st.h - 22);
    st.gv = 0;
    setP(x / st.w);
  };

  const dark = theme === "dark";
  const ink = "#141310";
  const fg = dark ? ink : "#FFFFFF";
  const onFg = dark ? "#FFFFFF" : ink;
  const pill = "pointer-events-none absolute bottom-[14px] rounded-full px-3 py-1.5 text-[13px] font-medium leading-none";
  const p0 = clamp(defaultValue, 0, 1);

  return (
    <div
      ref={root}
      className={`relative select-none overflow-hidden rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{ width, height, touchAction: "pan-y", cursor: "ew-resize", ["--tw-ring-color" as string]: ink }}
      role="slider"
      tabIndex={0}
      aria-label={`Compare ${before.label ?? "before"} and ${after.label ?? "after"}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p0 * 100)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        s.current.held = true;
        hold(e);
      }}
      onPointerMove={hold}
      onPointerUp={() => { s.current.held = false; wake(); }}
      onPointerCancel={() => { s.current.held = false; wake(); }}
      onKeyDown={(e) => {
        const p = s.current.p;
        const to = e.key === "ArrowLeft" || e.key === "ArrowDown" ? p - 0.05
          : e.key === "ArrowRight" || e.key === "ArrowUp" ? p + 0.05
          : e.key === "Home" ? 0 : e.key === "End" ? 1 : null;
        if (to === null) return;
        e.preventDefault();
        setP(to);
      }}
    >
      {/* "After" underneath, whole */}
      <img src={after.src} alt={after.alt ?? after.label ?? "After"} draggable={false} className="pointer-events-none absolute inset-0 block h-full w-full object-cover" />
      {labels ? <div className={`${pill} right-[14px]`} style={{ background: fg, color: onFg }}>{after.label ?? "After"}</div> : null}

      {/* "Before" on top, cut along the line. Starts as a straight cut so the first paint is right. */}
      <div ref={top} className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - p0 * 100}% 0 0)` }}>
        <img src={before.src} alt={before.alt ?? before.label ?? "Before"} draggable={false} className="block h-full w-full object-cover" />
        {labels ? <div className={`${pill} left-[14px]`} style={{ background: fg, color: onFg }}>{before.label ?? "Before"}</div> : null}
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {/* Drawn once the size is measured */}
        <path ref={line} fill="none" stroke={fg} strokeWidth={2} />
      </svg>

      {/* The knob rides the line at the height of your hand */}
      <div
        ref={knob}
        aria-hidden
        className="pointer-events-none absolute flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          background: fg,
          color: onFg,
          boxShadow: "0 6px 16px rgba(20,19,16,0.22), 0 1px 3px rgba(20,19,16,0.12)",
          left: `${p0 * 100}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 1 1 5l4 4M13 1l4 4-4 4" />
        </svg>
      </div>
    </div>
  );
}
