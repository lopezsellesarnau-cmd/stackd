'use client'

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Card swap · StackD Kit 17
 * A stack of photo cards in depth: each one a step further back and up to the right, slanted.
 * Press the front card, or drag and fling it, and it goes straight to the back while the rest step
 * forward. A short drag springs back. With `auto` it swaps by itself every few seconds, pausing
 * while a pointer is on the stack, while it has focus and while the tab is hidden.
 * Keyboard: Enter, Space or → sends the front card back; ← brings the last one to the front.
 * The order is the only state: each position in the stack (a "slot") is a fixed transform, so a
 * swap just gives every card a new slot and the transition carries it there. The stage is flat
 * (no preserve-3d), so the paint order is the z-index: the card sent back goes behind at once
 * and travels to the back behind the others.
 * React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type SwapCard = { id: string; title: string; src: string; alt?: string };

type Props = {
  cards: SwapCard[];
  /** Swap by itself. Off by default: a stack that moves on a timer moves while people read. */
  auto?: boolean;
  /** Seconds between swaps when `auto` is on. At least 1.5. */
  every?: number;
  /** Called with the card now in front. */
  onChange?: (card: SwapCard) => void;
  /** Card size in px. Default 196 × 246. */
  cardWidth?: number;
  cardHeight?: number;
  /** How far each card sits from the one in front: x right, y up, z back (px). */
  step?: { x: number; y: number; z: number };
  /** Slant of the stack, in degrees. Default 6. */
  skew?: number;
  /** Show each card's title in a pill. Default true. */
  labels?: boolean;
  /** "light": white title pills. "dark": black ones. */
  theme?: "light" | "dark";
  className?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function CardSwap({
  cards,
  auto = false,
  every = 4,
  onChange,
  cardWidth: CW = 196,
  cardHeight: CH = 246,
  step = { x: 34, y: 26, z: 70 },
  skew = 6,
  labels = true,
  theme = "light",
  className = "",
}: Props) {
  const [order, setOrder] = useState(() => cards.map((c) => c.id));
  const els = useRef<Record<string, HTMLDivElement | null>>({});
  const root = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const focus = useRef(false);
  const drag = useRef<null | { id: string; pid: number; x: number; y: number; dx: number; dy: number; t: number }>(null);
  const unhook = useRef(() => {});
  const first = useRef(true);

  // New or removed cards: keep the order of the ones that stay, new ones go to the back
  useEffect(() => {
    setOrder((o) => {
      const ids = cards.map((c) => c.id);
      const kept = o.filter((id) => ids.includes(id));
      return [...kept, ...ids.filter((id) => !kept.includes(id))];
    });
  }, [cards]);

  // Tell the page which card is in front (not on the first render)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const c = cards.find((x) => x.id === order[0]);
    if (c) onChange?.(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order[0]]);

  useEffect(() => () => unhook.current(), []);

  const n = order.length;
  const slot = (k: number) => `translate3d(${k * step.x}px, ${-k * step.y}px, ${-k * step.z}px) skewY(${skew}deg)`;

  // Every card back to its own slot: a swap never leaves a card where a hand once put it
  const settle = () => {
    for (const el of Object.values(els.current)) if (el) { el.style.transition = ""; el.style.transform = ""; }
  };
  const next = () => { settle(); setOrder((o) => (o.length > 1 ? [...o.slice(1), o[0]] : o)); };
  const prev = () => { settle(); setOrder((o) => (o.length > 1 ? [o[o.length - 1], ...o.slice(0, -1)] : o)); };

  // The drag: only the front card moves, and the window follows the gesture so it can't be lost
  // off the edge. Past a little way the card is on a rubber band and can't leave the stack.
  const grab = (e: React.PointerEvent<HTMLDivElement>, front: boolean, id: string) => {
    if (!front || drag.current || e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { id, pid: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: performance.now() };
    el.style.transition = "none";
    // Inside a scaled parent, screen pixels aren't the card's pixels
    const k = root.current ? root.current.getBoundingClientRect().width / (root.current.offsetWidth || 1) || 1 : 1;
    const rub = (d: number) => 160 * Math.tanh(d / 160);
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.pid) return;
      d.dx = (ev.clientX - d.x) / k;
      d.dy = (ev.clientY - d.y) / k;
      const x = rub(d.dx), y = rub(d.dy);
      el.style.transform = `${slot(0)} translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(x * 0.05).toFixed(2)}deg)`;
    };
    const up = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.pid) return;
      drag.current = null;
      unhook.current();
      const far = Math.hypot(d.dx, d.dy);
      const quick = far / Math.max(1, performance.now() - d.t) > 0.6;
      // A press, or a drag far or quick enough: to the back. Otherwise it springs home.
      if (ev.type !== "pointercancel" && (far < 6 || far > 70 || (quick && far > 24))) next();
      else settle();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    unhook.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      unhook.current = () => {};
    };
  };

  // The timer: one swap every few seconds, unless a hand (or the keyboard) is on it
  useEffect(() => {
    if (!auto || n < 2) return;
    const id = window.setInterval(() => {
      if (!hover.current && !focus.current && !drag.current && !document.hidden) next();
    }, Math.max(1.5, every) * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, every, n]);

  const dark = theme === "dark";
  const slab = dark ? "#141310" : "#FFFFFF";
  const on = dark ? "#FFFFFF" : "#141310";
  const frontCard = cards.find((c) => c.id === order[0]);
  // The box the stack needs: the front card plus every step behind it
  const W = CW + (n - 1) * step.x + 8;
  const H = CH + (n - 1) * step.y + CW * Math.tan((skew * Math.PI) / 180) + 8;

  return (
    <div
      ref={root}
      className={`relative select-none ${className}`}
      style={{ width: W, height: H }}
      role="group"
      aria-roledescription="card stack"
      aria-label="Photos. Press the front card or Enter for the next one."
      tabIndex={0}
      onPointerEnter={() => { hover.current = true; }}
      onPointerLeave={() => { hover.current = false; }}
      onFocus={() => { focus.current = true; }}
      onBlur={() => { focus.current = false; }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      }}
    >
      <style>{`
        [data-swap-card]{transform:var(--t);transition:transform 600ms ${EASE}}
        @media (prefers-reduced-motion:reduce){[data-swap-card]{transition:none}}
      `}</style>

      {/* The stage is flat, with the perspective on it, aimed at the middle of the stack */}
      <div
        className="absolute"
        style={{
          left: 4,
          bottom: 4,
          width: CW,
          height: CH,
          perspective: 1000,
          perspectiveOrigin: `${CW / 2 + ((n - 1) * step.x) / 2}px ${CH / 2 - ((n - 1) * step.y) / 2}px`,
        }}
      >
        {cards.map((c) => {
          const k = Math.max(0, order.indexOf(c.id));
          const front = k === 0;
          const style: CSSProperties & Record<string, string | number> = {
            zIndex: n - k,
            // Just the picture: no frame or edge, a soft shadow to part it from the card behind
            borderRadius: 20,
            color: on,
            boxShadow: "0 14px 34px rgba(20,19,16,0.2), 0 2px 6px rgba(20,19,16,0.08)",
            // The slot arrives as a variable the stylesheet turns into the transform; a drag writes
            // the transform itself, which wins until it is cleared
            "--t": slot(k),
            backfaceVisibility: "hidden",
            cursor: front ? "grab" : "default",
            touchAction: front ? "none" : "auto",
          };
          return (
            <div
              key={c.id}
              ref={(el) => { els.current[c.id] = el; }}
              data-swap-card
              aria-hidden={!front}
              className="absolute inset-0 active:cursor-grabbing"
              style={style}
              onPointerDown={(e) => grab(e, front, c.id)}
            >
              <img src={c.src} alt={front ? c.alt ?? c.title : ""} draggable={false} className="pointer-events-none block h-full w-full object-cover" style={{ borderRadius: 20 }} />
              {labels ? (
                <div className="pointer-events-none absolute bottom-[14px] left-[14px] rounded-full px-3 py-1.5 text-[13px] font-medium leading-none" style={{ background: slab }}>
                  {c.title}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {frontCard ? `${frontCard.title}, ${cards.indexOf(frontCard) + 1} of ${n}` : ""}
      </p>
    </div>
  );
}
