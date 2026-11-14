'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/**
 * Elastic tabs · StackD Kit 10
 * Tabs with an indicator that moves like a drop: the front edge leaves first, the back edge
 * catches up, so it stretches (and gets a little thinner) on the way, then snaps into place with
 * a small wobble. You can also drag it with your finger; it follows, stretches with your speed,
 * gives like rubber past the ends and lands on the nearest tab.
 * The labels under the indicator change colour exactly at its edge.
 * Arrow keys, Home and End work. White and black versions, any colour.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

type Tab = { id: string; label: string; icon?: ReactNode };

type Props = {
  tabs: Tab[];
  /** Controlled value. Leave it out and the tabs keep their own. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  theme?: "light" | "dark";
  /** The indicator's colour. Defaults to ink on light, white on dark. */
  color?: string;
  /** Stretch the tabs to fill the width of their parent. */
  fill?: boolean;
  /** Show only the icons; the labels stay for screen readers. */
  iconOnly?: boolean;
  "aria-label"?: string;
};

const PAD = 4; // space between the bar and the indicator
const FRONT = { k: 520, z: 0.6 }; // the edge in front: quick, with a little overshoot
const BACK = { k: 170, z: 0.85 }; // the edge behind: slower, so the drop stretches

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ink or white, whichever reads better on the indicator
function textOn(hex: string) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 165 ? "#141310" : "#FFFFFF";
}

export function ElasticTabs({
  tabs,
  value,
  defaultValue,
  onChange,
  theme = "light",
  color,
  fill = false,
  iconOnly = false,
  "aria-label": ariaLabel = "Tabs",
}: Props) {
  const dark = theme === "dark";
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? own;
  const index = Math.max(0, tabs.findIndex((t) => t.id === active));

  const box = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = useRef(index);
  const geo = useRef({ W: 0, H: 0, slots: [] as { l: number; r: number }[] });
  // Both edges of the indicator, each on its own spring
  const s = useRef({ L: 0, R: 0, vL: 0, vR: 0, tL: 0, tR: 0, dir: 1, raf: 0, last: 0, ready: false });
  const drag = useRef<{ id: number; x0: number; on: boolean; c: number } | null>(null);
  const skipClick = useRef(false);

  function select(id: string) {
    if (value === undefined) setOwn(id);
    onChange?.(id);
  }

  // Draws the indicator: the coloured layer is clipped to it, labels included
  function paint() {
    const el = top.current;
    const { W, H } = geo.current;
    const st = s.current;
    if (!el || !H) return;
    const inner = H - PAD * 2;
    const stretch = (st.R - st.L) / Math.max(1, st.tR - st.tL) - 1;
    // Longer gets thinner, shorter (on the bounce) a touch fuller
    const t = PAD + clamp(stretch * 0.16 * inner, -PAD * 0.6, inner * 0.2);
    const L = clamp(st.L, 0, W);
    const R = clamp(st.R, L, W);
    el.style.clipPath = `inset(${t}px ${W - R}px ${t}px ${L}px round ${(H - 2 * t) / 2}px)`;
  }

  function step(now: number) {
    const st = s.current;
    const dt = Math.min(0.032, st.last ? (now - st.last) / 1000 : 0.016);
    st.last = now;
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      const fL = st.dir < 0 ? FRONT : BACK;
      const fR = st.dir < 0 ? BACK : FRONT;
      st.vL += (fL.k * (st.tL - st.L) - 2 * fL.z * Math.sqrt(fL.k) * st.vL) * h;
      st.vR += (fR.k * (st.tR - st.R) - 2 * fR.z * Math.sqrt(fR.k) * st.vR) * h;
      st.L += st.vL * h;
      st.R += st.vR * h;
    }
    const still =
      Math.abs(st.tL - st.L) < 0.3 && Math.abs(st.tR - st.R) < 0.3 && Math.abs(st.vL) < 4 && Math.abs(st.vR) < 4;
    if (still && !drag.current?.on) {
      st.L = st.tL;
      st.R = st.tR;
      st.vL = st.vR = 0;
      st.raf = 0;
      st.last = 0;
      paint();
      return;
    }
    paint();
    st.raf = requestAnimationFrame(step);
  }

  // Sends the indicator to a new spot; the side it travels to decides which edge leads
  function go(L: number, R: number) {
    const st = s.current;
    const move = (L + R) / 2 - (st.tL + st.tR) / 2;
    if (Math.abs(move) > 0.5) st.dir = Math.sign(move);
    st.tL = L;
    st.tR = R;
    if (!st.ready || reduced()) {
      st.L = L;
      st.R = R;
      st.vL = st.vR = 0;
      st.ready = true;
      paint();
      return;
    }
    if (!st.raf) st.raf = requestAnimationFrame(step);
  }

  function toSlot(i: number) {
    const sl = geo.current.slots[i];
    if (sl) go(sl.l, sl.r);
  }

  // Follow the selected tab
  useEffect(() => {
    idx.current = index;
    toSlot(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Measure the tabs (and again whenever they change size, e.g. when the font loads)
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const measure = () => {
      geo.current = {
        W: b.offsetWidth,
        H: b.offsetHeight,
        slots: btns.current.map((x) => (x ? { l: x.offsetLeft, r: x.offsetLeft + x.offsetWidth } : { l: 0, r: 0 })),
      };
      toSlot(idx.current);
      paint();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    btns.current.forEach((x) => x && ro.observe(x));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.current.raf);
      s.current.raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  // While dragging: the indicator's centre follows the finger, its width blends between tabs
  function follow(px: number) {
    const sl = geo.current.slots;
    if (!sl.length) return;
    const cs = sl.map((x) => (x.l + x.r) / 2);
    const ws = sl.map((x) => x.r - x.l);
    let w = ws[0];
    if (px >= cs[cs.length - 1]) w = ws[ws.length - 1];
    else
      for (let i = 0; i < cs.length - 1; i++)
        if (px >= cs[i] && px <= cs[i + 1]) w = ws[i] + ((px - cs[i]) / (cs[i + 1] - cs[i])) * (ws[i + 1] - ws[i]);
    // Past the first or last tab it gives like rubber
    const rub = (d: number) => 18 * (1 - Math.exp(-d / 40));
    const lo = cs[0];
    const hi = cs[cs.length - 1];
    const c = px < lo ? lo - rub(lo - px) : px > hi ? hi + rub(px - hi) : px;
    if (drag.current) drag.current.c = c;
    go(c - w / 2, c + w / 2);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x0: e.clientX, on: false, c: 0 };
  }

  function onPointerMove(e: PointerEvent) {
    const d = drag.current;
    const b = box.current;
    if (!d || !b || d.id !== e.pointerId) return;
    if (!d.on) {
      if (Math.abs(e.clientX - d.x0) < 6) return; // still a tap
      d.on = true;
      b.setPointerCapture(e.pointerId);
    }
    follow(e.clientX - b.getBoundingClientRect().left);
  }

  function onPointerUp(e: PointerEvent, cancel = false) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.on) return;
    // The click that follows a drag shouldn't pick a tab again
    skipClick.current = true;
    setTimeout(() => (skipClick.current = false), 0);
    if (cancel) return toSlot(index);
    const cs = geo.current.slots.map((x) => (x.l + x.r) / 2);
    let near = 0;
    cs.forEach((c, i) => Math.abs(c - d.c) < Math.abs(cs[near] - d.c) && (near = i));
    toSlot(near);
    if (tabs[near].id !== active) select(tabs[near].id);
  }

  function onKeyDown(e: KeyboardEvent) {
    const n = tabs.length;
    const i =
      e.key === "ArrowRight" ? (index + 1) % n
      : e.key === "ArrowLeft" ? (index - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (i < 0) return;
    e.preventDefault();
    select(tabs[i].id);
    btns.current[i]?.focus();
  }

  const fg = dark ? "#FFFFFF" : "#141310";
  const ind = color ?? fg;
  const cell = `flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full ${iconOnly ? "px-3.5" : "px-4"} text-[14.5px] font-medium tracking-[-0.01em] [&_svg]:h-[18px] [&_svg]:w-[18px] ${fill ? "flex-1" : ""}`;

  return (
    <div
      ref={box}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerCancel={(e) => onPointerUp(e, true)}
      className={`relative touch-pan-y select-none rounded-full p-1 outline-2 outline-offset-2 outline-[#901919] has-[button:focus-visible]:outline ${fill ? "flex w-full" : "inline-flex"}`}
      style={{
        background: dark ? "#141310" : "#FFFFFF",
        boxShadow: dark ? "0 12px 30px rgba(20,19,16,0.25)" : "0 0 0 1px rgba(20,19,16,0.06), 0 12px 30px rgba(20,19,16,0.08)",
      }}
    >
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            btns.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={i === index}
          tabIndex={i === index ? 0 : -1}
          onClick={() => {
            if (skipClick.current) return;
            select(t.id);
          }}
          className={`${cell} outline-none transition-opacity hover:opacity-100`}
          style={{ color: fg, opacity: i === index ? 1 : 0.5 }}
        >
          {t.icon}
          {iconOnly ? <span className="sr-only">{t.label}</span> : t.label}
        </button>
      ))}

      {/* The indicator: a coloured copy of the labels, clipped to its shape */}
      <div
        ref={top}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex p-1"
        style={{ background: ind, color: textOn(ind), clipPath: "inset(50%)" }}
      >
        {tabs.map((t) => (
          <span key={t.id} className={cell}>
            {t.icon}
            {iconOnly ? null : t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
