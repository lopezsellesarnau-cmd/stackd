'use client'

import { useEffect, useId, useRef, useState } from "react";
import { Bot, type BotShape } from "./bot";

/**
 * Label maker · StackD Kit 31
 * A tag input that works like an embossing label maker, kept minimal. Type and every letter is punched
 * into the ink tape as a crisp white letter: the machine gives a little kerchunk, the Bot sitting on it
 * blinks, and the tape feeds out a step. Backspace pulls the last letter back in. Press Enter (or Cut) and
 * the tape is cut: the label drops onto the row below as a neat tag. Click a tag to peel it off.
 * One real text input underneath, so typing, paste, mobile keyboards and screen readers work.
 * React + Tailwind and the StackD Bot, no other libraries. Respects reduced motion.
 */

type Props = {
  /** The labels already stuck on. */
  defaultLabels?: string[];
  /** Called with a new label when it's cut, and with the label when one is peeled off. */
  onAdd?: (label: string) => void;
  onRemove?: (label: string) => void;
  /** Longest label, in letters. Default: as many as fit. */
  maxLength?: number;
  width?: number;
  /** "light": ink machine and tape on a light page (default). "dark": white ones on a dark page. */
  theme?: "light" | "dark";
  bot?: BotShape;
  /** What a screen reader calls the input. */
  label?: string;
};

const MACHINE = { w: 132, h: 52 }; // a slim pill
const BOT = 40; // perched on top of it
const TAPE_H = 32;
const TOP = BOT + 6; // room above the machine for the Bot, with a small gap so they don't merge
const FONT = '"SF Pro Display", -apple-system, system-ui, "Helvetica Neue", sans-serif';
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The letters a label maker's wheel has; anything else is left out
const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9 &!?.,:'\-+#@/]/g, "");

export function LabelMaker({
  defaultLabels = ["DESIGN", "REACT", "STACKD"],
  onAdd,
  onRemove,
  maxLength,
  width = 560,
  theme = "light",
  bot = "hexagon",
  label = "New label",
}: Props) {
  const dark = theme === "dark";
  const ink = dark ? "#FFFFFF" : "#141310";
  const paper = dark ? "#141310" : "#FFFFFF";
  const help = `lm-${useId().replace(/:/g, "")}`;
  const fit = Math.floor((width - MACHINE.w - 48) / 13);
  const max = Math.min(maxLength ?? fit, fit);

  const [text, setText] = useState("");
  const [labels, setLabels] = useState(defaultLabels.map((t, i) => ({ id: i, text: t })));
  const [focused, setFocused] = useState(false);
  const [blink, setBlink] = useState(false);
  const [cutting, setCutting] = useState<string | null>(null);
  const [peeling, setPeeling] = useState<number[]>([]);
  const nextId = useRef(defaultLabels.length);
  const input = useRef<HTMLInputElement>(null);
  const machine = useRef<HTMLDivElement>(null);
  const still = calm();

  // The kerchunk: the machine dips, the Bot blinks
  const punch = () => {
    if (!still) machine.current?.animate([{ transform: "translateY(0)" }, { transform: "translateY(1.5px) scaleX(.985)" }, { transform: "translateY(0)" }], { duration: 110, easing: "ease-out" });
    setBlink(true);
    setTimeout(() => setBlink(false), 130);
  };

  const change = (raw: string) => {
    const next = clean(raw).slice(0, max);
    if (next === text) return;
    if (next.length > text.length) punch();
    setText(next);
  };

  const cut = () => {
    const t = text.trim();
    if (!t || cutting) return;
    setCutting(t);
    setText("");
    setTimeout(() => {
      setLabels((ls) => [...ls, { id: nextId.current++, text: t }]);
      setCutting(null);
      onAdd?.(t);
    }, still ? 0 : 420);
  };

  const peel = (id: number, t: string) => {
    setPeeling((p) => [...p, id]);
    setTimeout(() => {
      setLabels((ls) => ls.filter((l) => l.id !== id));
      setPeeling((p) => p.filter((x) => x !== id));
      onRemove?.(t);
    }, still ? 0 : 320);
  };

  // Keep the caret at the end: one input stands in for the tape
  useEffect(() => {
    const el = input.current;
    if (el && focused) el.setSelectionRange(el.value.length, el.value.length);
  }, [text, focused]);

  const mouth = width - MACHINE.w; // where the tape comes out (its right end)
  const tapeTop = TOP + MACHINE.h / 2 - TAPE_H / 2;
  // The tape: ink with white letters; on a dark page, white with ink letters
  const tapeBg = ink;
  const letter = paper;

  return (
    <div className="relative select-none" style={{ width, color: ink, fontFamily: FONT }}>
      <style>{`
        @keyframes lm-feed{from{transform:translateX(13px)}to{transform:none}}
        @keyframes lm-letter{0%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:none}}
        @keyframes lm-cut{0%{transform:none;opacity:1}100%{transform:translateY(64px);opacity:0}}
        @keyframes lm-stick{0%{opacity:0;transform:translateY(-14px)}100%{opacity:1;transform:none}}
        @keyframes lm-peel{0%{transform:none;opacity:1}100%{transform:translateY(10px) scale(.92);opacity:0}}
        @media (prefers-reduced-motion:reduce){[data-lm] *{animation:none!important}}
      `}</style>

      <div data-lm className="relative" style={{ height: TOP + MACHINE.h + 22 }}>
        {/* The tape: grows out of the machine to the left, the newest letter at the mouth */}
        <div className="absolute" style={{ right: width - mouth + 6, top: tapeTop, height: TAPE_H }}>
          {text || cutting ? (
            <div
              key={cutting ? `cut-${cutting}` : text.length}
              className="flex h-full items-center px-3"
              style={{
                ...tagStyle(tapeBg, letter, dark, false),
                animation: cutting ? "lm-cut .42s cubic-bezier(.5,0,.6,1) forwards" : text ? "lm-feed .14s ease-out" : undefined,
              }}
            >
              {(cutting ?? text).split("").map((ch, i, all) => (
                <span key={i} className="inline-block" style={{ animation: !cutting && i === all.length - 1 ? "lm-letter .18s ease-out" : undefined }}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* The machine: a slim pill with the Bot sitting on top */}
        <div ref={machine} className="absolute right-0" style={{ top: TOP, width: MACHINE.w, height: MACHINE.h }}>
          <div className="absolute inset-0 rounded-full" style={{ background: ink }} />
          {/* The slot the tape comes out of */}
          <div className="absolute rounded-full" style={{ left: 8, top: MACHINE.h / 2 - 9, width: 3, height: 18, background: dark ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.22)" }} />
          <span className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums" style={{ color: dark ? "rgba(20,19,16,.5)" : "rgba(255,255,255,.5)" }} aria-hidden>
            {text.length}/{max}
          </span>
          <button
            type="button"
            onClick={cut}
            disabled={!text.trim()}
            className="absolute right-[8px] top-1/2 h-[36px] -translate-y-1/2 rounded-full px-4 text-[12px] font-semibold outline-none transition-opacity focus-visible:ring-2 disabled:opacity-35"
            style={{ background: paper, color: ink, ["--tw-ring-color" as string]: paper }}
          >
            Cut
          </button>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -BOT - 4 }}>
            <Bot size={BOT} shape={bot} eyes="tall" color={ink} eyeColor={paper} look={{ x: -0.6, y: 0.2 }} happy={blink || !!cutting} poke={false} />
          </div>
        </div>

        {/* The one real input, over the tape */}
        <input
          ref={input}
          value={text}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              cut();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          aria-describedby={help}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={max * 2}
          className="absolute cursor-text bg-transparent text-transparent caret-transparent outline-none"
          style={{ left: 0, top: tapeTop, width: mouth, height: TAPE_H, fontSize: 16 }}
        />
        <span id={help} className="sr-only">
          Type a label and press Enter to cut it.
        </span>
        {!text && !cutting ? (
          <div
            aria-hidden
            className="pointer-events-none absolute flex items-center gap-2 text-[13px]"
            style={{ right: width - mouth + 14, top: tapeTop, height: TAPE_H, opacity: focused ? 0.7 : 0.4 }}
          >
            {focused ? <span className="inline-block h-[16px] w-[1.5px] animate-pulse rounded-full" style={{ background: ink }} /> : null}
            <span>{focused ? "Type, then Enter" : "Click to add a label"}</span>
          </div>
        ) : null}
      </div>

      {/* The labels: neat tags in a row */}
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Labels">
        {labels.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => peel(l.id, l.text)}
              aria-label={`${l.text}, remove`}
              className="flex h-[28px] items-center px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...tagStyle(tapeBg, letter, dark, true),
                animation: peeling.includes(l.id) ? "lm-peel .32s ease-in forwards" : i >= defaultLabels.length ? "lm-stick .36s cubic-bezier(.3,1.2,.5,1)" : undefined,
                ["--tw-ring-color" as string]: ink,
              }}
            >
              {l.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ink tape with white letters (or the other way round on a dark page), a faint raise on the letters */
function tagStyle(bg: string, fg: string, dark: boolean, small: boolean): React.CSSProperties {
  return {
    background: bg,
    color: fg,
    borderRadius: small ? 6 : 8,
    fontFamily: FONT,
    fontWeight: 600,
    fontSize: small ? 12 : 15,
    letterSpacing: "0.06em",
    textShadow: dark ? "0 1px 0 rgba(255,255,255,.45)" : "0 1px 0 rgba(0,0,0,.5)",
    boxShadow: dark ? "inset 0 -1px 0 rgba(0,0,0,.08)" : "inset 0 1px 0 rgba(255,255,255,.1)",
    whiteSpace: "pre",
  };
}
