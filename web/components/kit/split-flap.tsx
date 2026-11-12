'use client'

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Split-flap display · StackD Kit 06
 * Text on little tiles that flip like an old departure board. When the value changes, each tile
 * runs through the characters between the old one and the new one, top half falling over the
 * bottom, and the columns start one after another so the change rolls across the board.
 * White and black versions. React + Tailwind, no other dependencies. Respects reduced motion.
 */

export const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789€$£%.,:-+/!?&#";

type Props = {
  value: string;
  /** Pad to this many tiles, so the board keeps its size between values. */
  length?: number;
  align?: "left" | "center" | "right";
  theme?: "light" | "dark";
  /** Tile height in px. */
  size?: number;
  /** Milliseconds per flip. */
  speed?: number;
  /** Milliseconds between one column starting and the next. */
  stagger?: number;
  /** The characters a tile can show, in the order it runs through them. */
  chars?: string;
};

export function SplitFlap({
  value,
  length,
  align = "left",
  theme = "dark",
  size = 64,
  speed = 70,
  stagger = 45,
  chars = CHARS,
}: Props) {
  const text = fit(value.toUpperCase(), length, align, chars);
  const dark = theme === "dark";

  return (
    <div role="img" aria-label={value} className="inline-flex select-none" style={{ gap: Math.round(size * 0.08) }}>
      {Array.from(text).map((c, i) => (
        <Tile key={i} target={c} chars={chars} size={size} speed={speed} delay={i * stagger} dark={dark} />
      ))}
    </div>
  );
}

/** Uppercase, swap unknown characters for a space, pad to `length` */
function fit(v: string, length: number | undefined, align: Props["align"], chars: string) {
  let s = Array.from(v).map((c) => (chars.includes(c) ? c : " ")).join("");
  if (!length || s.length >= length) return length ? s.slice(0, length) : s;
  const gap = length - s.length;
  if (align === "right") s = " ".repeat(gap) + s;
  else if (align === "center") s = " ".repeat(Math.floor(gap / 2)) + s + " ".repeat(Math.ceil(gap / 2));
  else s = s + " ".repeat(gap);
  return s;
}

function Tile({
  target,
  chars,
  size,
  speed,
  delay,
  dark,
}: {
  target: string;
  chars: string;
  size: number;
  speed: number;
  delay: number;
  dark: boolean;
}) {
  // `shown` is the settled character; while flipping, `next` is the one coming in
  const [shown, setShown] = useState(" ");
  const [next, setNext] = useState<string | null>(null);
  const [flip, setFlip] = useState(0); // bumps on every flip so the animation restarts
  const now = useRef(" ");

  useEffect(() => {
    if (now.current === target) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t = 0;
    const step = () => {
      if (now.current === target) {
        setNext(null);
        return;
      }
      // Reduced motion: straight to the target. Otherwise one character along, like the real thing.
      const to = still ? target : chars[(chars.indexOf(now.current) + 1) % chars.length];
      setNext(to);
      setFlip((f) => f + 1);
      t = window.setTimeout(() => {
        now.current = to;
        setShown(to);
        step();
      }, still ? 0 : speed);
    };
    t = window.setTimeout(step, still ? 0 : delay);
    return () => clearTimeout(t);
  }, [target, chars, speed, delay]);

  const w = Math.round(size * 0.72);
  const r = Math.round(size * 0.1);
  const bg = dark ? "#1E1D1A" : "#FFFFFF";
  const fg = dark ? "#F2F2F0" : "#141310";
  const line = dark ? "#0B0A08" : "#E6E5E1";
  const flipping = next !== null;
  const half: CSSProperties = { position: "absolute", left: 0, right: 0, height: "50%", overflow: "hidden", background: bg };
  const ms = `${speed}ms`;

  return (
    <div
      aria-hidden
      className="relative"
      style={{
        width: w,
        height: size,
        perspective: size * 5,
        borderRadius: r,
        boxShadow: dark ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 10px rgba(0,0,0,0.35)" : "0 0 0 1px rgba(20,19,16,0.06), 0 4px 10px rgba(20,19,16,0.08)",
        color: fg,
      }}
    >
      <style>{`
        @keyframes sf-fall{from{transform:rotateX(0)}to{transform:rotateX(-90deg)}}
        @keyframes sf-land{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
        @keyframes sf-dim{from{opacity:0}to{opacity:.35}}
      `}</style>

      {/* Top: the new character waits behind the falling flap */}
      <div style={{ ...half, top: 0, borderRadius: `${r}px ${r}px 0 0` }}>
        <Glyph c={flipping ? next : shown} size={size} part="top" />
      </div>
      {/* Bottom: the old character until the new flap lands on it */}
      <div style={{ ...half, bottom: 0, borderRadius: `0 0 ${r}px ${r}px` }}>
        <Glyph c={shown} size={size} part="bottom" />
      </div>

      {flipping ? (
        <>
          {/* The old top half falls forward */}
          <div
            key={`fall-${flip}`}
            style={{
              ...half,
              top: 0,
              borderRadius: `${r}px ${r}px 0 0`,
              transformOrigin: "bottom",
              backfaceVisibility: "hidden",
              animation: `sf-fall calc(${ms} / 2) ease-in forwards`,
              zIndex: 2,
            }}
          >
            <Glyph c={shown} size={size} part="top" />
            <span className="absolute inset-0 bg-black" style={{ animation: `sf-dim calc(${ms} / 2) ease-in forwards` }} />
          </div>
          {/* The new bottom half lands */}
          <div
            key={`land-${flip}`}
            style={{
              ...half,
              bottom: 0,
              borderRadius: `0 0 ${r}px ${r}px`,
              transformOrigin: "top",
              backfaceVisibility: "hidden",
              transform: "rotateX(90deg)",
              animation: `sf-land calc(${ms} / 2) ease-out calc(${ms} / 2) forwards`,
              zIndex: 2,
            }}
          >
            <Glyph c={next} size={size} part="bottom" />
          </div>
        </>
      ) : null}

      {/* The hinge */}
      <span className="absolute inset-x-0 top-1/2 z-[3] -translate-y-1/2" style={{ height: Math.max(1, Math.round(size / 48)), background: line }} />
    </div>
  );
}

/** One character, cut to the top or bottom half of its tile */
function Glyph({ c, size, part }: { c: string; size: number; part: "top" | "bottom" }) {
  return (
    <span
      className="absolute inset-x-0 flex items-center justify-center font-semibold tabular-nums"
      style={{
        height: size,
        top: part === "top" ? 0 : -size / 2,
        fontSize: size * 0.62,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {c}
    </span>
  );
}
