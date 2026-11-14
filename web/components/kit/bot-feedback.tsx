'use client'

import { useState, type ComponentProps, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Bot } from "./bot";

/**
 * Bot feedback · StackD Kit 11
 * A rating card with the Bot (Kit 01) on top. Move along the 1–5 scale and the Bot's face changes
 * with you: droopy lids on a 1, neutral on a 3, smiling eyes on a 4, happy and bouncing on a 5.
 * The scale fills in a colour that goes from Wine to Olive. Pick a number and a comment box opens
 * with a question that fits (what went wrong / what did you like); send it and the Bot thanks you.
 * Plug in your backend with `onSubmit`. White and black versions.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

type Props = {
  /** Where the rating goes. Return or resolve when it's saved. */
  onSubmit?: (rating: number, comment: string) => void | Promise<void>;
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  title?: string;
  /** The words for 1 to 5. */
  labels?: [string, string, string, string, string];
  /** One colour for the whole scale, instead of Wine → Olive. */
  color?: string;
  /** A tighter card for small spaces: smaller Bot, no comment box. */
  compact?: boolean;
  /** Start with a number already picked, 1 to 5. */
  defaultRating?: number;
};

// How the Bot feels and where it looks, for 1 to 5
const FACE = [
  { mood: -1, look: { x: 0, y: 0.55 } },
  { mood: -0.5, look: { x: -0.35, y: 0.4 } },
  { mood: 0, look: { x: 0, y: 0.35 } },
  { mood: 0.7, look: { x: 0, y: 0.05 } },
  { mood: 0, look: { x: 0, y: -0.1 } }, // 5 uses the happy eyes
];

// The scale's colours, from bad to great. Lighter on black so they read.
const SCALE = {
  light: ["#901919", "#A4542F", "#BE9344", "#8E8C44", "#6C8544"],
  dark: ["#E88A86", "#E3A67A", "#D9B26E", "#B8C07C", "#A3BF78"],
};

export function BotFeedback({
  onSubmit = () => new Promise((r) => setTimeout(r, 900)),
  theme = "light",
  bot,
  title = "How was it?",
  labels = ["Bad", "Not great", "Okay", "Good", "Love it"],
  color,
  compact = false,
  defaultRating = 0,
}: Props) {
  const dark = theme === "dark";
  const [hover, setHover] = useState(0); // 0 = not over the scale
  const [rating, setRating] = useState(Math.min(5, Math.max(0, Math.round(defaultRating))));
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"rating" | "sending" | "done">("rating");
  const [bounce, setBounce] = useState(0);

  const shown = hover || rating; // what the Bot and the scale show right now
  const done = state === "done";
  const face = shown ? FACE[shown - 1] : null;

  function pick(n: number) {
    if (state !== "rating") return;
    setRating(n);
    if (n === 5) setBounce((b) => b + 1);
    if (compact) send(n, ""); // no comment box: the number is the answer
  }

  async function send(n: number, text: string) {
    setState("sending");
    await onSubmit(n, text);
    setState("done");
    if (n >= 4) setBounce((b) => b + 1);
  }

  // Dragging a finger along the scale previews each number
  function along(e: PointerEvent<HTMLDivElement>) {
    if (state !== "rating") return;
    const r = e.currentTarget.getBoundingClientRect();
    const n = Math.min(5, Math.max(1, Math.ceil(((e.clientX - r.left) / r.width) * 5)));
    if (n !== hover) {
      setHover(n);
      if (n === 5 && rating !== 5) setBounce((b) => b + 1);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const n =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(5, (rating || 0) + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(1, (rating || 2) - 1)
      : /^[1-5]$/.test(e.key) ? Number(e.key)
      : 0;
    if (!n) return;
    e.preventDefault();
    pick(n);
    (e.currentTarget.querySelectorAll("button")[n - 1] as HTMLButtonElement | undefined)?.focus();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating || state !== "rating") return;
    await send(rating, comment.trim());
  }

  const fg = dark ? "#FFFFFF" : "#141310";
  const field = dark ? "#1E1D1A" : "#F2F2F0";
  const tone = (n: number) => color ?? SCALE[theme][n - 1];
  const low = rating > 0 && rating <= 2;

  // The Bot after sending: happy for a good rating, a soft, sorry look for a bad one
  const botMood = done ? (rating >= 3 ? 0 : -0.25) : face?.mood ?? 0;
  const botLook = done ? { x: 0, y: rating >= 3 ? -0.05 : 0.2 } : face?.look;
  const botHappy = done ? rating >= 3 : shown === 5;

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-[360px] rounded-[28px] p-7"
      style={{
        background: dark ? "#141310" : "#FFFFFF",
        color: fg,
        boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)",
      }}
    >
      <style>{`
        @keyframes bf-hop{0%,100%{transform:translateY(0) scale(1,1)}25%{transform:translateY(2px) scale(1.06,.94)}50%{transform:translateY(-12px) scale(.97,1.03)}75%{transform:translateY(1px) scale(1.03,.97)}}
        @keyframes bf-spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* The Bot; hops on a 5 */}
      <div className="flex justify-center">
        <div
          key={bounce}
          className="origin-bottom motion-reduce:![animation:none]"
          style={{ animation: bounce ? "bf-hop .55s cubic-bezier(.3,.7,.4,1)" : undefined }}
        >
          <Bot
            size={compact ? 64 : 88}
            shape={bot?.shape ?? "pill"}
            eyes={bot?.eyes ?? "tall"}
            color={fg}
            eyeColor={dark ? "#141310" : "#FFFFFF"}
            look={botLook}
            mood={botMood}
            happy={botHappy}
          />
        </div>
      </div>

      <div className={`${compact ? "mt-4" : "mt-5"} text-center`}>
        <h2 className={`${compact ? "text-[17px]" : "text-[20px]"} font-semibold tracking-[-0.02em]`}>{done ? "Thank you" : title}</h2>
        {/* The word for the number you're on; fixed height so nothing jumps */}
        <p className="mt-1 h-5 text-[14px] transition-colors duration-200" style={{ color: shown && !done ? tone(shown) : undefined, opacity: shown && !done ? 1 : 0.55 }}>
          {done ? (low ? "Sorry about that. We'll look into it." : "Glad to hear it.") : shown ? labels[shown - 1] : "Tap a number"}
        </p>
      </div>

      {/* The scale: it fills up to the number you're on */}
      <div
        role="radiogroup"
        aria-label={title}
        onKeyDown={onKeyDown}
        onPointerMove={along}
        onPointerLeave={() => setHover(0)}
        className={`${compact ? "mt-4" : "mt-5"} flex touch-none gap-1.5 transition-opacity duration-300`}
        style={{ opacity: done ? 0.5 : 1, pointerEvents: state === "rating" ? "auto" : "none" }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= shown;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}, ${labels[n - 1]}`}
              tabIndex={n === (rating || 1) ? 0 : -1}
              onClick={() => pick(n)}
              onPointerUp={(e) => e.pointerType !== "mouse" && setHover(0)}
              className="relative h-12 flex-1 rounded-[14px] text-[15px] font-medium tabular-nums outline-none transition-[background-color,color,transform] duration-200 ease-out focus-visible:shadow-[0_0_0_2px_currentColor] active:scale-95 motion-reduce:transition-none"
              style={{
                background: on ? tone(shown) : field,
                color: on ? (dark && !color ? "#141310" : "#FFFFFF") : fg,
                transitionDelay: on ? `${(n - 1) * 25}ms` : "0ms", // fills left to right
                opacity: on ? 1 : 0.85,
              }}
            >
              <span style={{ opacity: on ? 1 : 0.5 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* The comment box opens once you've picked */}
      {compact ? null : (
        <div
          className="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: rating && !done ? "1fr" : "0fr", opacity: rating && !done ? 1 : 0 }}
          aria-hidden={!rating || done}
        >
          <div className="overflow-hidden">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={low ? "What went wrong?" : rating === 3 ? "What would make it better?" : "What did you like?"}
              aria-label="Comment"
              tabIndex={rating && !done ? 0 : -1}
              rows={3}
              className="mt-4 block w-full resize-none rounded-[14px] px-4 py-3 text-[16px] outline-none transition-shadow placeholder:opacity-40 focus:shadow-[0_0_0_2px_currentColor] sm:text-[15px]"
              style={{ background: field, color: fg }}
            />
            <button
              type="submit"
              tabIndex={rating && !done ? 0 : -1}
              disabled={state === "sending"}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium transition-[transform,opacity] active:scale-[0.98] disabled:opacity-80"
              style={{ background: fg, color: dark ? "#141310" : "#FFFFFF" }}
            >
              {state === "sending" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ animation: "bf-spin .8s linear infinite" }}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
