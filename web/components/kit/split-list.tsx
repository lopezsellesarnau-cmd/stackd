'use client'

import { useEffect, useRef } from "react";

/**
 * Split list · StackD Kit 29
 * A long list split down the middle: on each line one name ends at the centre and the next one starts
 * there. Move over it and the lines part around the cursor, most at the line you're on and less above
 * and below, like a lens, and the same lens makes them bold: light far away, heavy where you are.
 * It follows the cursor up and down and closes when you leave. On a phone, tap a line.
 * The weight is drawn smoothly with a variable font (SF Pro on Apple devices); elsewhere it steps.
 * Moved straight on the page every frame (no re-render per move). React + Tailwind, no other libraries.
 * Respects reduced motion.
 */

type Props = {
  /** The lines: a name on the left of the centre and one on the right. */
  rows: [string, string][];
  /** Text size in px. Default 30. */
  size?: number;
  /** How wide the gap opens at the cursor, in px. Default: five times the text size. */
  gap?: number;
  /** How many lines above and below it reaches (roughly). */
  reach?: number;
  /** Hold the gap open at this line (0 = first), without a cursor: for covers and still mockups. */
  at?: number;
  theme?: "light" | "dark";
  className?: string;
};

const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Light at rest, heavy under the cursor
const LIGHT = 340;
const HEAVY = 820;
const FONT = '"SF Pro Display", -apple-system, system-ui, "Helvetica Neue", sans-serif';

export function SplitList({ rows, size = 30, gap: gapProp, reach = 2.6, at: holdAt, theme = "light", className = "" }: Props) {
  const dark = theme === "dark";
  const gap = gapProp ?? size * 5;
  const ink = dark ? "#FFFFFF" : "#141310";
  const box = useRef<HTMLDivElement>(null);
  const lefts = useRef<(HTMLSpanElement | null)[]>([]);
  const rights = useRef<(HTMLSpanElement | null)[]>([]);
  // Where the gap should be (a y in px inside the list) and whether it's open
  const aim = useRef({ y: 0, open: 0 });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const still = calm();
    const n = rows.length;
    const off = Array(n).fill(0);
    const vel = Array(n).fill(0);
    let y = aim.current.y;
    let raf = 0;
    let prev = 0;

    // The middle of each line, measured once (and again on resize)
    let mids: number[] = [];
    let line = 40;
    const measure = () => {
      mids = lefts.current.map((el) => (el ? el.offsetTop + el.offsetHeight / 2 : 0));
      line = n > 1 ? (mids[n - 1] - mids[0]) / (n - 1) : 40;
    };
    measure();

    const tick = (now: number) => {
      const dt = prev ? Math.min(2.5, (now - prev) / 16.67) : 1;
      prev = now;
      const { y: ty, open } = aim.current;
      y = still ? ty : y + (ty - y) * Math.min(1, 0.25 * dt);
      let moving = Math.abs(ty - y);
      for (let i = 0; i < n; i++) {
        // A lens: wide at the cursor's line, less and less further away
        const d = (mids[i] - y) / (line * reach);
        const target = open * gap * Math.exp(-d * d);
        if (still) {
          off[i] = target;
          vel[i] = 0;
        } else {
          vel[i] = (vel[i] + (target - off[i]) * 0.12 * dt) * Math.pow(0.7, dt);
          off[i] += vel[i] * dt;
        }
        moving += Math.abs(target - off[i]) + Math.abs(vel[i]);
        // The same lens sets the weight
        const k = Math.min(1, Math.max(0, off[i] / gap));
        const wght = Math.round(LIGHT + (HEAVY - LIGHT) * k);
        for (const [el, sign] of [[lefts.current[i], -1], [rights.current[i], 1]] as const) {
          if (!el) continue;
          el.style.transform = `translateX(${((sign * off[i]) / 2).toFixed(2)}px)`;
          el.style.fontWeight = String(wght);
        }
      }
      if (moving < 0.05) {
        raf = 0;
        prev = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    kick.current = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    // Held open at a line
    if (holdAt !== undefined && mids[holdAt] !== undefined) {
      aim.current = { y: mids[holdAt], open: 1 };
      kick.current();
    }
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [rows, gap, reach, size, holdAt]);

  const at = (clientY: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    aim.current = { y: clientY - r.top, open: 1 };
    kick.current();
  };

  return (
    <div
      ref={box}
      className={`relative select-none ${className}`}
      style={{ color: ink }}
      onPointerMove={(e) => e.pointerType === "mouse" && at(e.clientY)}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse" || holdAt !== undefined) return;
        aim.current.open = 0;
        kick.current();
      }}
      // A tap opens the gap at that line; tap the same place again to close it
      onPointerUp={(e) => {
        if (e.pointerType === "mouse") return;
        const r = box.current?.getBoundingClientRect();
        const y = r ? e.clientY - r.top : 0;
        const same = aim.current.open && Math.abs(aim.current.y - y) < 20;
        aim.current = { y, open: same ? 0 : 1 };
        kick.current();
      }}
    >
      <ul className="m-0 list-none p-0">
        {rows.map(([left, right], i) => (
          <li key={left + right + i} className="grid grid-cols-2 items-baseline leading-[1.12]">
            <span
              ref={(el) => {
                lefts.current[i] = el;
              }}
              className="justify-self-end whitespace-nowrap pr-[0.16em]"
              style={{ ...TYPE, fontSize: size }}
            >
              {left}
            </span>
            <span
              ref={(el) => {
                rights.current[i] = el;
              }}
              className="justify-self-start whitespace-nowrap pl-[0.16em]"
              style={{ ...TYPE, fontSize: size }}
            >
              {right}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One typeface for every name; the weight is set as the lens moves */
const TYPE: React.CSSProperties = { fontFamily: FONT, fontWeight: LIGHT, letterSpacing: "-0.03em", willChange: "transform" };
