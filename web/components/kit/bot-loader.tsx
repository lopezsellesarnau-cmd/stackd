'use client'

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Bot } from "./bot";

/**
 * Bot loader · StackD Kit 14
 * A loader where the Bot (Kit 01) does the work you're waiting for. Give it the steps of a long task
 * and say what each one is: the Bot reads (its eyes scan line by line), thinks (it looks up and
 * drifts), works (it looks down and chews) or waits. The current step's name shimmers, a segmented
 * bar fills step by step (exactly, if you pass `progress`), a list ticks the steps off, and a clock
 * counts the seconds. Done: happy eyes and a hop. Error: it frowns, the step turns red, and Retry.
 * Two versions: a card, and an inline pill for buttons, toasts and chat rows. White and black.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

export type LoaderStep = {
  label: string;
  /** What the Bot does during this step. Default "wait". */
  activity?: "read" | "think" | "work" | "wait";
};

type Props = {
  steps: LoaderStep[];
  /** The step running now (0-based). Steps before it are done. */
  current: number;
  /** "done" when everything finished, "error" when the current step failed. */
  status?: "loading" | "done" | "error";
  /** 0–1 within the current step, if you know it. Leave it out for a moving sheen. */
  progress?: number;
  /** Shown instead of the step's name when status is "error". */
  error?: string;
  /** Shown with status "error". */
  onRetry?: () => void;
  /** What it says when done. */
  doneLabel?: string;
  variant?: "card" | "inline";
  /** List the steps under the bar (card only). */
  showSteps?: boolean;
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
};

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// What the Bot's face does, step by step. Small jumps, not a smooth glide: eyes move in saccades.
function useActivity(activity: LoaderStep["activity"], on: boolean) {
  const [face, setFace] = useState<{ look?: { x: number; y: number }; mouth: number }>({ mouth: 0 });
  useEffect(() => {
    if (!on || reduced()) {
      setFace({ look: on ? { x: 0, y: 0.15 } : undefined, mouth: 0 });
      return;
    }
    let i = 0;
    const tick = () => {
      i++;
      if (activity === "read") {
        // Left to right in four jumps, then back to the start of the next line (three lines)
        const col = i % 5;
        const line = Math.floor(i / 5) % 3;
        setFace({ look: { x: col === 4 ? -0.5 : -0.5 + col * 0.33, y: 0.05 + line * 0.14 + (col === 4 ? 0.14 : 0) }, mouth: 0 });
      } else if (activity === "think") {
        const spots = [{ x: 0.4, y: -0.45 }, { x: 0.25, y: -0.55 }, { x: 0.45, y: -0.35 }, { x: -0.3, y: -0.5 }];
        setFace({ look: spots[i % spots.length], mouth: 0 });
      } else if (activity === "work") {
        setFace({ look: { x: (i % 6 < 3 ? -0.08 : 0.08), y: 0.45 }, mouth: i % 2 ? 0.4 : 0.06 });
      } else {
        setFace({ look: { x: i % 2 ? 0.3 : -0.3, y: 0.05 }, mouth: 0 });
      }
    };
    tick();
    const every = activity === "read" ? 260 : activity === "think" ? 1100 : activity === "work" ? 210 : 900;
    const id = window.setInterval(tick, every);
    return () => window.clearInterval(id);
  }, [activity, on]);
  return face;
}

export function BotLoader({
  steps,
  current,
  status = "loading",
  progress,
  error = "Something went wrong",
  onRetry,
  doneLabel = "Done",
  variant = "card",
  showSteps = true,
  theme = "light",
  bot,
}: Props) {
  const dark = theme === "dark";
  const inline = variant === "inline";
  const n = steps.length;
  const at = Math.min(Math.max(0, current), n - 1);
  const loading = status === "loading";
  const done = status === "done";
  const failed = status === "error";
  const step = steps[at];
  const face = useActivity(step?.activity ?? "wait", loading);

  // The clock: seconds since this run started (a new run = back to step 0 while loading)
  const [secs, setSecs] = useState(0);
  const started = useRef(Date.now());
  useEffect(() => {
    if (current === 0 && loading) {
      started.current = Date.now();
      setSecs(0);
    }
  }, [current, loading]);
  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => setSecs(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [loading]);

  // A hop when it finishes
  const [hop, setHop] = useState(0);
  useEffect(() => {
    if (done) setHop((h) => h + 1);
  }, [done]);

  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const field = dark ? "#26241F" : "#F2F2F0";
  const ok = dark ? "#A3BF78" : "#6C8544";
  const bad = dark ? "#E88A86" : "#901919";
  const label = done ? doneLabel : failed ? error : step?.label ?? "";
  const clock = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${String(secs % 60).padStart(2, "0")}s`;

  // How full each segment is: done ones full, the current one by progress (or a sheen), the rest empty
  // (a failed step without a known progress shows full, in red, so the bar says where it stopped)
  const fill = (i: number) =>
    done || i < at ? 1 : i > at ? 0 : progress === undefined ? (failed ? 1 : 0) : Math.min(1, Math.max(0, progress));
  const segColor = (i: number) => (done ? ok : failed && i === at ? bad : fg);

  const css = `
    @keyframes bl-shine{from{background-position:120% 0}to{background-position:-20% 0}}
    @keyframes bl-sweep{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
    @keyframes bl-up{from{opacity:0;transform:translateY(8px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
    @keyframes bl-hop{0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(2px) scale(1.08,.92)}60%{transform:translateY(-8px) scale(.97,1.03)}}
    @keyframes bl-spin{to{transform:rotate(360deg)}}
    @keyframes bl-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  `;

  // The step's name: shimmers while loading, slides in when it changes
  const name = (size: string) => (
    <span
      key={`${label}-${status}`}
      className={`block truncate ${size}`}
      style={{
        animation: reduced() ? undefined : "bl-up .35s cubic-bezier(.2,.9,.3,1) both",
        color: done ? ok : failed ? bad : undefined,
      }}
    >
      {loading && !reduced() ? (
        <span
          style={{
            backgroundImage: `linear-gradient(90deg, ${fg} 0%, ${fg} 40%, ${dark ? "rgba(255,255,255,0.35)" : "rgba(20,19,16,0.3)"} 50%, ${fg} 60%, ${fg} 100%)`,
            backgroundSize: "250% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "bl-shine 1.8s linear infinite",
          }}
        >
          {label}
        </span>
      ) : (
        label
      )}
    </span>
  );

  // The bar: one segment per step
  const bar = (h: number) => (
    <div className="flex w-full gap-1" aria-hidden>
      {steps.map((_, i) => (
        <span key={i} className="relative flex-1 overflow-hidden rounded-full" style={{ height: h, background: field }}>
          <span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${fill(i)})`, background: segColor(i), transitionDelay: done ? `${i * 60}ms` : "0ms" }}
          />
          {/* No progress known: a sheen moves through the current segment */}
          {loading && i === at && progress === undefined && !reduced() ? (
            <span
              className="absolute inset-y-0 left-0 w-2/5 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${fg}, transparent)`, opacity: 0.55, animation: "bl-sweep 1.3s cubic-bezier(.45,0,.55,1) infinite" }}
            />
          ) : null}
        </span>
      ))}
    </div>
  );

  const theBot = (size: number) => (
    <div
      key={hop}
      className="origin-bottom motion-reduce:![animation:none]"
      style={{ animation: hop && done ? "bl-hop .45s cubic-bezier(.3,.7,.4,1)" : failed ? "bl-shake .35s ease-in-out 2" : undefined }}
    >
      <Bot
        size={size}
        shape={bot?.shape ?? "pill"}
        eyes={bot?.eyes ?? "tall"}
        color={fg}
        eyeColor={bg}
        look={loading ? face.look : done ? { x: 0, y: -0.05 } : { x: 0, y: 0.3 }}
        mouth={loading ? face.mouth : 0}
        mood={failed ? -0.6 : 0}
        happy={done}
      />
    </div>
  );

  const live = done ? doneLabel : failed ? error : `${step?.label ?? ""} (step ${at + 1} of ${n})`;

  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex h-12 max-w-full items-center gap-3 rounded-full py-1 pl-2 pr-4"
        style={{ background: bg, color: fg, boxShadow: dark ? "0 10px 30px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.06), 0 10px 30px rgba(20,19,16,0.08)" }}
      >
        <style>{css}</style>
        <span className="sr-only">{live}</span>
        <span aria-hidden className="shrink-0">{theBot(34)}</span>
        <span aria-hidden className="min-w-0 max-w-[220px] text-[14px] font-medium">{name("")}</span>
        <span aria-hidden className="w-16 shrink-0">{bar(4)}</span>
        {failed && onRetry ? (
          <button type="button" onClick={onRetry} className="shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-medium outline-none focus-visible:shadow-[0_0_0_2px_currentColor]" style={{ background: field }}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-[360px] rounded-[28px] p-7"
      style={{
        background: bg,
        color: fg,
        boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)",
      }}
    >
      <style>{css}</style>
      <span className="sr-only">{live}</span>

      <div aria-hidden className="flex justify-center">{theBot(80)}</div>

      <div aria-hidden className="mt-5 text-center">
        {name("text-[17px] font-semibold tracking-[-0.01em]")}
        <p className="mt-1 text-[13px] tabular-nums opacity-50">
          {done ? `${n} of ${n} · ${clock}` : failed ? `Stopped at step ${at + 1} of ${n}` : `Step ${at + 1} of ${n} · ${clock}`}
        </p>
      </div>

      <div className="mt-5">{bar(5)}</div>

      {showSteps ? (
        <ul aria-hidden className="mt-5 flex flex-col gap-2.5">
          {steps.map((s, i) => {
            const state = done || i < at ? "done" : i === at ? (failed ? "failed" : "now") : "later";
            return (
              <li key={i} className="flex items-center gap-3 text-[14px]" style={{ opacity: state === "later" ? 0.4 : 1 }}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {state === "done" ? (
                    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke={ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 10.5 8 14l7.5-8" />
                    </svg>
                  ) : state === "now" ? (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" style={{ animation: reduced() ? undefined : "bl-spin .9s linear infinite" }}>
                      <circle cx="10" cy="10" r="7" stroke={fg} strokeOpacity=".2" strokeWidth="2.2" />
                      <path d="M17 10a7 7 0 0 0-7-7" stroke={fg} strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  ) : state === "failed" ? (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={bad} strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: fg }} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate" style={{ color: state === "failed" ? bad : undefined, fontWeight: state === "now" ? 500 : 400 }}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {failed && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full text-[14.5px] font-medium outline-none transition-transform focus-visible:shadow-[0_0_0_2px_currentColor] active:scale-[0.98]"
          style={{ background: fg, color: bg }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
