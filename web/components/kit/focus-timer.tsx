'use client'

import { useEffect, useRef, useState, type CSSProperties, type ComponentProps, type ReactNode } from "react";
import { Bot } from "./bot";

/**
 * Focus timer · StackD Kit 08
 * A pill with the Bot and the time left. Tap it and it opens into a panel: the Bot grows into the
 * corner, the digits travel and grow beside it, buttons and a strip of ticks arrive at the end.
 * One number runs from 0 (pill) to 1 (panel) and everything is read from it, with transforms only,
 * so it changes as one smooth object. Closing gives a small squeeze.
 * The Bot keeps you company: it watches the time while it runs, looks down when you pause,
 * and smiles when you're done.
 * Move the cursor or click anywhere and the Bot looks at it; after a moment it goes back to the time.
 * Two shapes: "island" (floats, for phones and apps) and "notch" (hangs from the top edge like a
 * laptop's notch, grows downward and opens on hover).
 * Tap outside or Esc to close. Black and white versions, any accent.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

type Props = {
  /** Length of a session, in minutes. */
  minutes?: number;
  /** Where it starts, in seconds left. Defaults to the full length. */
  remaining?: number;
  label?: string;
  theme?: "light" | "dark";
  /** Accent for the digits, ticks and pause button. */
  color?: string;
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  open?: boolean;
  /** Start open when not controlled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDone?: () => void;
  /** "island" floats; "notch" hangs from the top edge of its container, like a laptop's notch. */
  variant?: "island" | "notch";
  /** Open when the mouse comes over it. Defaults to true for the notch. */
  openOnHover?: boolean;
};

const MS = 460;
const P = 20;
const PILL = 36;
const SHUT_W = 148;
const OPEN_W = 300;
const BOT = 52; // the Bot's size in the panel; it's drawn at this size and scaled down in the pill
const BIG = 34; // the digits' size in the panel
const TICKS = 31;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const outQuart = (t: number) => 1 - (1 - t) ** 4;
const linear = (t: number) => t;
const still = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A solid colour between two hex colours, so tinted shapes never show what's under them */
function blend(a: string, b: string, t: number) {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(mix(y[i], v, t))).join(",")})`;
}

/** Places an element with a transform only, scaled by s and anchored by a fraction of its own size */
function at(x: number, y: number, s = 1, ax = 0, ay = 0): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    transform: `translate3d(${x}px, ${y}px, 0) scale(${s}) translate(${-ax * 100}%, ${-ay * 100}%)`,
    whiteSpace: "nowrap",
  };
}

/** Goes to `target` over `ms`, starting from wherever it is now, so a second tap turns it round */
function useTween(target: number, ms: number, ease: (t: number) => number) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current;
    if (from === target) return;
    const dur = still() ? 0 : ms;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = dur ? clamp((now - t0) / dur) : 1;
      cur.current = from + (target - from) * ease(k);
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, ease]);
  return v;
}

export function FocusTimer({
  minutes = 25,
  remaining,
  label = "Focus",
  theme = "dark",
  color,
  bot,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  onDone,
  variant = "island",
  openOnHover = variant === "notch",
}: Props) {
  const dark = theme === "dark";
  const notch = variant === "notch";
  const full = minutes * 60;
  const [left, setLeft] = useState(remaining ?? full);
  const [paused, setPaused] = useState(false);
  const done = left === 0;

  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const setOpen = (v: boolean) => {
    if (controlled === undefined) setOwn(v);
    onOpenChange?.(v);
  };

  // The clock
  const finished = useRef(onDone);
  useEffect(() => {
    finished.current = onDone;
  });
  useEffect(() => {
    if (paused || done) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, done]);

  useEffect(() => {
    if (done) finished.current?.();
  }, [done]);

  // One number for the whole open/close; the squeeze rides its own linear clock, on close only
  const p = useTween(open ? 1 : 0, MS, outQuart);
  const u = useTween(open ? 1 : 0, MS, linear);
  const squeeze = open ? 1 : 1 - 0.03 * Math.sin(Math.PI * clamp(u) ** 1.5);
  const late = clamp((p - 0.6) / 0.4); // panel-only things

  // The Bot's attention: the cursor while it moves, a click or tap for a moment, otherwise the time
  const botBox = useRef<HTMLSpanElement>(null);
  const [attend, setAttend] = useState<null | "cursor" | { x: number; y: number }>(null);
  const following = useRef(false);
  useEffect(() => {
    let t = 0;
    const later = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        following.current = false;
        setAttend(null);
      }, 2000);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!following.current) {
        following.current = true;
        setAttend("cursor");
      }
      later();
    };
    const down = (e: PointerEvent) => {
      const r = botBox.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const far = Math.min(0.6, Math.tanh(d / 160) * 0.6);
      following.current = false;
      setAttend({ x: (dx / d) * far, y: (dy / d) * far });
      later();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  // Tap outside or Esc closes it
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (e.isTrusted && shell.current && !shell.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const id = setTimeout(() => document.addEventListener("pointerdown", away), 0);
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  });

  // Colours: solid tints, so nothing shows through where shapes meet
  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const accent = color ?? (dark ? "#E2B865" : "#A57A2C");
  const dim = blend(fg, bg, 0.55);
  const line = blend(fg, bg, 0.14);
  const soft = blend(accent, bg, dark ? 0.24 : 0.16);

  // Geometry, all from p
  const W = mix(SHUT_W, OPEN_W, p);
  const stripY = P + BOT + 18;
  const H = mix(PILL, stripY + 26 + P, p);
  const R = mix(PILL / 2, 28, p);
  const botSize = mix(26, BOT, p);
  const botXY = mix((PILL - 26) / 2, P, p);
  const textX = P + BOT + 14;

  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const gone = clamp(1 - left / full);
  const now = done ? TICKS - 1 : Math.min(TICKS - 1, Math.floor(gone * TICKS));

  // The Bot watches the time while it runs, looks down when paused, smiles when done.
  // In the pill the time is to its right; in the panel it watches the current tick below.
  const tickX = P + ((OPEN_W - P * 2) * now) / (TICKS - 1);
  const job = done
    ? { x: 0, y: -0.2 }
    : paused
      ? { x: 0, y: 0.6 }
      : { x: mix(0.45, clamp((tickX - (P + BOT / 2)) / 260, -0.5, 0.5), p), y: mix(0, 0.3, p) };
  // Undefined lets the Bot follow the cursor itself
  const look = attend === "cursor" ? undefined : (attend ?? job);

  // Hover to open (the notch's default): a short delay on leave so passing through doesn't flicker
  const leaving = useRef(0);
  const hover = openOnHover
    ? {
        onPointerEnter: (e: React.PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          clearTimeout(leaving.current);
          setOpen(true);
        },
        onPointerLeave: (e: React.PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          leaving.current = window.setTimeout(() => setOpen(false), 250);
        },
      }
    : {};

  // The notch's inward curves where it meets the top edge
  const flare = mix(8, 12, p);
  const flareStyle = (side: "left" | "right"): CSSProperties => ({
    position: "absolute",
    top: 0,
    [side]: -flare,
    width: flare,
    height: flare,
    background: `radial-gradient(circle at ${side === "left" ? "0 100%" : "100% 100%"}, transparent ${flare - 0.5}px, ${bg} ${flare}px)`,
  });

  return (
    <div
      className="relative"
      style={{
        width: W,
        height: H,
        // The squeeze moves everything together, the notch's curves included.
        // The notch only squeezes vertically, from the top, so it never comes away from the edge.
        transform: notch ? `scaleY(${squeeze})` : `scale(${squeeze})`,
        transformOrigin: notch ? "50% 0" : "50% 50%",
      }}
      {...hover}
    >
      {notch ? (
        <>
          <span aria-hidden style={flareStyle("left")} />
          <span aria-hidden style={flareStyle("right")} />
        </>
      ) : null}
    <div
      ref={shell}
      className="relative overflow-hidden"
      style={{
        width: W,
        height: H,
        borderRadius: notch ? `0 0 ${R}px ${R}px` : R,
        background: bg,
        color: fg,
        boxShadow: notch
          ? "0 10px 24px rgba(20,19,16,0.18)"
          : dark
            ? "0 12px 32px rgba(20,19,16,0.28)"
            : "0 0 0 1px rgba(20,19,16,0.06), 0 12px 32px rgba(20,19,16,0.12)",
      }}
    >
      <style>{`@keyframes ft-glow{0%,100%{opacity:.6}50%{opacity:1}}`}</style>

      {/* The toggle: the whole pill when shut, the top of the panel when open. Buttons paint over it. */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${label}, ${time} left. ${open ? "Close" : "Open"}`}
        onClick={() => setOpen(!open)}
        className="absolute inset-x-0 top-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#888]/40"
        style={{ height: mix(PILL, stripY, p) }}
      />

      {/* The Bot: the hinge. Drawn at panel size, scaled down in the pill. */}
      <span ref={botBox} className="pointer-events-none" style={at(botXY, botXY, botSize / BOT)}>
        <Bot
          size={BOT}
          shape={bot?.shape ?? "circle"}
          eyes={bot?.eyes ?? "tall"}
          color={fg}
          eyeColor={bg}
          look={look}
          happy={done}
        />
      </span>

      <span className="pointer-events-none text-[13px] leading-none" style={{ ...at(textX, P + 2), opacity: late, color: dim }}>
        {done ? "Done" : paused ? "Paused" : label}
      </span>

      {/* The digits: pinned to the pill's right edge, then beside the Bot on the panel */}
      <span
        className="pointer-events-none font-semibold tabular-nums leading-none tracking-[-0.03em] transition-opacity duration-300"
        style={{
          ...at(mix(SHUT_W - 14, textX, p), mix(PILL / 2, P + 20, p), mix(15 / BIG, 1, p), mix(1, 0, p), mix(0.5, 0, p)),
          fontSize: BIG,
          color: accent,
          opacity: paused && !done ? 0.55 : 1,
        }}
      >
        {time}
      </span>

      <span className="flex gap-2" style={{ ...at(OPEN_W - P, P + BOT / 2, 1, 1, 0.5), opacity: late, pointerEvents: late > 0.9 ? "auto" : "none" }}>
        {done ? (
          <Tinted bg={soft} fg={accent} label="Start again" onClick={() => { setLeft(full); setPaused(false); }}>
            <path d="M12 5a7 7 0 1 1-6.6 4.7M5 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </Tinted>
        ) : (
          <>
            <Tinted bg={soft} fg={accent} label={paused ? "Resume" : "Pause"} onClick={() => setPaused(!paused)}>
              {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
            </Tinted>
            <Tinted bg={line} fg={fg} label="Stop" onClick={() => { setLeft(full); setPaused(true); }}>
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </Tinted>
          </>
        )}
      </span>

      {/* Ticks: time gone in the accent, the current one tallest and glowing */}
      <span className="pointer-events-none flex items-end justify-between" style={{ ...at(P, stripY), width: OPEN_W - P * 2, height: 26, opacity: late }}>
        {Array.from({ length: TICKS }, (_, i) => {
          const here = i === now;
          return (
            <span
              key={i}
              className="block w-[3px] rounded-full motion-reduce:![animation:none]"
              style={{
                height: here ? 26 : i % 5 === 0 ? 16 : 10,
                background: i <= now ? accent : line,
                boxShadow: here ? `0 0 10px ${accent}` : undefined,
                animation: here && !paused ? "ft-glow 1.6s ease-in-out infinite" : undefined,
              }}
            />
          );
        })}
      </span>
    </div>
    </div>
  );
}

/** A button on a solid tinted background, the icon in full colour */
function Tinted({ bg, fg, label, onClick, children }: { bg: string; fg: string; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
      style={{ background: bg, color: fg }}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        {children}
      </svg>
    </button>
  );
}
