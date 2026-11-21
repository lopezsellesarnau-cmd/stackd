'use client'

import { useEffect, useRef, useState } from "react";
import { Bot, type BotShape } from "./bot";

/**
 * Squeeze button · StackD Kit 28
 * A button made of words, each in its own rounded ink block, side by side, and one block holds the Bot.
 * Move over one and it swells while the others get squeezed; a block squeezed thinner than its word turns
 * the word on its side, and the Bot shrinks with its block (its eyes follow the cursor all along).
 * Every block springs, so they push back a little. Click and the blocks slide together into one whole
 * block, the Bot pops out of it smiling with "Sent", and after a moment it splits back into the words.
 * If `onClick` throws, the blocks shake and come apart again.
 * One real <button>, so the keyboard and screen readers work. React + Tailwind and the StackD Bot,
 * no other libraries. Respects reduced motion.
 */

type Status = "idle" | "sending" | "done";

type Props = {
  /** The words, one block each. Default: Keep · touch, with the Bot in between. */
  words?: string[];
  /** Where the Bot's block goes among the words (0 = first). -1: no Bot block. Default 1. */
  botAt?: number;
  /** What a screen reader says. Default "Keep in touch". */
  label?: string;
  /** What it does. Resolve when done; throw and the blobs shake and come apart. */
  onClick?: () => unknown | Promise<unknown>;
  /** Shown with the Bot once it's done. */
  doneLabel?: string;
  /** "light": ink blobs on a light page (default). "dark": white blobs on a dark page. */
  theme?: "light" | "dark";
  /** Width and height in px. */
  width?: number;
  height?: number;
  /** The Bot's body (Kit 01). */
  bot?: BotShape;
  /** How long "Sent" stays before it splits back, in ms. */
  doneFor?: number;
};

const GAP = 4; // between blobs at rest
const SWELL = 2.4; // how much bigger the blob under the cursor wants to be
const SHAKE = [0, -8, 7, -5, 3, 0].map((x) => ({ transform: `translateX(${x}px)` }));
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SqueezeButton({
  words = ["Keep", "touch"],
  botAt = 1,
  label = "Keep in touch",
  onClick = () => new Promise((r) => setTimeout(r, 900)),
  doneLabel = "Sent",
  theme = "light",
  width = 380,
  height = 120,
  bot = "hexagon",
  doneFor = 1600,
}: Props) {
  const dark = theme === "dark";
  const ink = dark ? "#FFFFFF" : "#141310";
  const paper = dark ? "#141310" : "#FFFFFF";

  const [status, setStatus] = useState<Status>("idle");
  const root = useRef<HTMLButtonElement>(null);
  const blobs = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const face = useRef<HTMLDivElement>(null);
  // The blocks in order: the words, with the Bot's block slotted in at botAt
  const items: (string | null)[] = [...words];
  if (botAt >= 0) items.splice(Math.min(botAt, words.length), 0, null);
  const botSize = Math.round(height * 0.5);
  // The words grow with the button: 22 px at the default 120 px tall
  const font = Math.round(height * 0.183);
  const layer = useRef<HTMLDivElement>(null);
  const whole = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLDivElement>(null);
  // What the loop springs towards: which blob is swollen, and how far the blobs have run together
  const aim = useRef({ hover: -1, merge: 0 });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const still = calm();
    const n = items.length;
    const free0 = width - GAP * (n - 1);
    const rest0 = n > 1 ? Math.min(0.5, height / free0) : 1;
    const w = Array.from({ length: n }, (_, i) => (i === n - 1 ? free0 * rest0 : (free0 * (1 - rest0)) / Math.max(1, n - 1)));
    const v = Array(n).fill(0);
    let m = 0;
    let vm = 0;
    let raf = 0;
    let prev = 0;
    // The last block's share of the width at rest, so it's a circle
    const circle = n > 1 ? Math.min(0.5, height / (width - GAP * (n - 1))) : 1;
    // Each word's own width, to know when its blob is too thin for it
    const need = labels.current.map((l) => (l ? l.scrollWidth + 28 : 0));

    const draw = () => {
      const gap = GAP - m * (GAP + 46); // running together: the blobs overlap
      const free = width - gap * (n - 1);
      const sum = w.reduce((a, b) => a + b, 0);
      let x = 0;
      for (let i = 0; i < n; i++) {
        const bw = (w[i] / sum) * free;
        const b = blobs.current[i];
        if (b) {
          b.style.transform = `translateX(${x.toFixed(2)}px)`;
          b.style.width = `${bw.toFixed(2)}px`;
          // Rounded corners (a thin block becomes a pill); the last one is fully round: a circle at rest,
          // a pill when it swells
          b.style.borderRadius = `${Math.min(i === n - 1 ? height / 2 : height * 0.28, bw / 2).toFixed(2)}px`;
        }
        // The Bot's block: the Bot shrinks with it when it's squeezed
        if (items[i] === null && face.current) {
          const k = Math.min(1, Math.max(0.35, (Math.min(bw, height) - 22) / botSize));
          face.current.style.left = `${(x + bw / 2).toFixed(2)}px`;
          face.current.style.transform = `translate(-50%, -50%) scale(${k.toFixed(3)})`;
          face.current.style.opacity = String(Math.max(0, 1 - m * 3));
        }
        const l = labels.current[i];
        if (l) {
          // Thinner than its word but tall enough: the word turns on its side
          const side = bw < need[i] && height > need[i] - 10;
          l.style.left = `${(x + bw / 2).toFixed(2)}px`;
          l.style.transform = `translate(-50%, -50%) rotate(${side ? -90 : 0}deg)`;
          l.style.opacity = String(Math.max(0, 1 - m * 3));
        }
        x += bw + gap;
      }
      // Running together: one whole block fades in over the blocks as they meet, so the merged
      // button is a single shape (no filter: switching one on and off made it flicker)
      const k = Math.min(1, Math.max(0, (m - 0.45) / 0.35));
      if (whole.current) whole.current.style.opacity = k.toFixed(3);
      // The blocks stay solid underneath until it's whole, so nothing shows through mid-way
      if (layer.current) layer.current.style.opacity = k < 1 ? "1" : "0";
      const d = done.current;
      if (d) {
        const k = Math.max(0, (m - 0.6) / 0.4);
        d.style.opacity = k.toFixed(3);
        d.style.transform = `translate(-50%, -50%) scale(${(0.6 + 0.4 * k).toFixed(3)})`;
      }
    };

    const tick = (now: number) => {
      const dt = prev ? Math.min(2.5, (now - prev) / 16.67) : 1;
      prev = now;
      const { hover, merge } = aim.current;
      const sum = w.reduce((a, b) => a + b, 0);
      let moving = 0;
      for (let i = 0; i < n; i++) {
        // Merging: all the same. At rest the last one is a circle (as wide as it's tall) and the others
        // share the rest. Otherwise the one under the cursor swells.
        let target: number;
        if (merge > 0.5) target = sum / n;
        else if (hover < 0) target = i === n - 1 ? sum * circle : (sum * (1 - circle)) / (n - 1);
        else target = (sum * (i === hover ? SWELL : 1)) / (SWELL + (n - 1));
        if (still) {
          w[i] = target;
          v[i] = 0;
        } else {
          v[i] = (v[i] + (target - w[i]) * 0.09 * dt) * Math.pow(0.72, dt);
          w[i] += v[i] * dt;
        }
        moving += Math.abs(target - w[i]) + Math.abs(v[i]);
      }
      if (still) {
        m = merge;
        vm = 0;
      } else {
        vm = (vm + (merge - m) * 0.08 * dt) * Math.pow(0.7, dt);
        m += vm * dt;
      }
      moving += Math.abs(merge - m) + Math.abs(vm);
      draw();
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
    draw();
    return () => cancelAnimationFrame(raf);
  }, [items.map((x) => x ?? "@bot").join("|"), width, height]);

  const over = (clientX: number) => {
    if (status !== "idle") return;
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    // Which blob is under the cursor, by where the blobs are right now
    const x = clientX - r.left;
    let hit = -1;
    blobs.current.forEach((b, i) => {
      if (!b) return;
      const left = new DOMMatrixReadOnly(getComputedStyle(b).transform).m41;
      if (x >= left && x <= left + b.offsetWidth) hit = i;
    });
    if (hit !== aim.current.hover) {
      aim.current.hover = hit;
      kick.current();
    }
  };
  const leave = () => {
    aim.current.hover = -1;
    kick.current();
  };

  async function send() {
    if (status !== "idle") return;
    setStatus("sending");
    aim.current = { hover: -1, merge: 1 };
    kick.current();
    const started = performance.now();
    let ok = true;
    try {
      await onClick();
    } catch {
      ok = false;
    }
    // Let the ink finish running together before the answer shows
    await new Promise((r) => setTimeout(r, Math.max(0, 650 - (performance.now() - started))));
    if (!ok) {
      aim.current.merge = 0;
      kick.current();
      if (!calm()) root.current?.animate(SHAKE, { duration: 420, easing: "ease-in-out" });
      setStatus("idle");
      return;
    }
    setStatus("done");
    setTimeout(() => {
      aim.current.merge = 0;
      kick.current();
      setStatus("idle");
    }, doneFor);
  }

  return (
    <button
      ref={root}
      type="button"
      onClick={send}
      onPointerMove={(e) => e.pointerType === "mouse" && over(e.clientX)}
      onPointerLeave={leave}
      aria-label={status === "done" ? doneLabel : label}
      aria-live="polite"
      className="relative block cursor-pointer select-none rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
      style={{ width, height, ["--tw-ring-color" as string]: ink, ["--tw-ring-offset-color" as string]: paper }}
    >
      {/* The whole block they become: rounded on the left like the word blocks, round on the right
          like the last one */}
      <div
        ref={whole}
        aria-hidden
        className="absolute inset-0"
        style={{ background: ink, opacity: 0, borderRadius: `${height * 0.28}px ${height / 2}px ${height / 2}px ${height * 0.28}px` }}
      />

      {/* The blocks: rounded rectangles that become pills when they're thin */}
      <div ref={layer} aria-hidden className="absolute inset-0">
        {items.map((word, i) => (
          <div
            key={`${word ?? "@bot"}${i}`}
            ref={(el) => {
              blobs.current[i] = el;
            }}
            className="absolute top-0 left-0 h-full"
            style={{ background: ink }}
          />
        ))}
      </div>

      {/* The Bot in its block, on top of the blocks */}
      {botAt >= 0 ? (
        <div ref={face} aria-hidden className="pointer-events-none absolute top-1/2">
          <Bot size={botSize} shape={bot} eyes="tall" color={paper} eyeColor={ink} poke={false} />
        </div>
      ) : null}

      {/* The words, on top of the blocks */}
      {items.map((word, i) => word === null ? null : (
        <span
          key={word + i}
          ref={(el) => {
            labels.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute top-1/2 whitespace-nowrap font-medium uppercase tracking-[-0.01em]"
          style={{ color: paper, fontSize: font, transition: "transform .22s cubic-bezier(.3,1.3,.5,1)" }}
        >
          {word}
        </span>
      ))}

      {/* Out of the ink: the Bot, smiling, and the answer */}
      <div
        ref={done}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 flex items-center gap-3"
        style={{ opacity: 0, color: paper }}
      >
        {/* Facing you while it says it */}
        <Bot size={Math.round(height * 0.42)} shape={bot} eyes="tall" color={paper} eyeColor={ink} happy={status === "done"} look={{ x: 0, y: 0 }} poke={false} />
        <span className="font-medium uppercase tracking-[-0.01em]" style={{ fontSize: font }}>{doneLabel}</span>
      </div>
    </button>
  );
}
