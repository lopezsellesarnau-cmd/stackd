'use client'

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Bot } from "./bot";

/**
 * OTP input · StackD Kit 15
 * A one-time-code card with the Bot (Kit 01) on top. Its eyes follow the box you're typing in;
 * pasting a code (or the phone's SMS/email autofill) drops the digits in one after another. When the
 * last digit lands it checks by itself: the boxes ripple while the Bot glances side to side. Right
 * code: the boxes turn green one by one and the Bot is happy. Wrong code: the row shakes, the Bot
 * looks down sadder with every miss, and the next digit you type starts over. Resend with a countdown.
 * One real input underneath, so autofill (`one-time-code`), paste, screen readers and mobile
 * keyboards all work. White and black versions.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

type Status = "idle" | "checking" | "success" | "error";
type Look = { x: number; y: number };

type Props = {
  /** Check the code. Return (or resolve) true when it's right. Called as soon as every box is filled. */
  onComplete?: (code: string) => boolean | Promise<boolean>;
  /** Send a new code. The countdown starts again. */
  onResend?: () => void;
  /** How many characters. Default 6. */
  length?: number;
  /** "numeric" (default) or "alphanumeric" (letters are uppercased). */
  type?: "numeric" | "alphanumeric";
  /** Seconds before Resend is available. 0 = always. */
  resendIn?: number;
  /** Shown in the subtitle: "We sent a code to …". */
  sentTo?: string;
  title?: string;
  /** Shown when the code was right. */
  doneTitle?: string;
  /** Show dots instead of the characters. */
  mask?: boolean;
  /** A gap in the middle (6 → 3 · 3). Default true for even lengths of 6 or more. */
  split?: boolean;
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  /** No title or subtitle and a smaller Bot, for tight spaces. */
  compact?: boolean;
};

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const SHAKE = [0, -8, 7, -5, 3, 0].map((x) => ({ transform: `translateX(${x}px)` }));

export function OtpInput({
  onComplete = async (code) => {
    await new Promise((r) => setTimeout(r, 1100));
    return code === "482913";
  },
  onResend,
  length = 6,
  type = "numeric",
  resendIn = 30,
  sentTo,
  title = "Check your email",
  doneTitle = "You're verified",
  mask = false,
  split,
  theme = "light",
  bot,
  compact = false,
}: Props) {
  const dark = theme === "dark";
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [focused, setFocused] = useState(false);
  const [tries, setTries] = useState(0);
  const [left, setLeft] = useState(resendIn);
  const [sent, setSent] = useState(false);
  const [glance, setGlance] = useState<Look | undefined>(undefined);
  // Digits that arrive together (paste, autofill) drop in one after another from here
  const [from, setFrom] = useState(0);

  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const botBox = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const [look, setLook] = useState<Look | undefined>(undefined);

  const done = status === "success";
  const busy = status === "checking";
  const active = Math.min(value.length, length - 1);
  const gap = split ?? (length >= 6 && length % 2 === 0);

  // A direction from the Bot towards a point on the screen
  function towards(px: number, py: number): Look {
    const r = botBox.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const far = Math.min(0.85, Math.tanh(d / 160));
    return { x: (dx / d) * far, y: (dy / d) * far };
  }

  // What the Bot looks at: the box you're on while typing; the cursor when you're elsewhere
  useEffect(() => {
    if (done) return setLook({ x: 0, y: 0 });
    if (status === "error") return setLook({ x: 0, y: 0.6 });
    if (busy) return setLook(glance);
    if (!focused) return setLook(undefined);
    const b = boxes.current[active]?.getBoundingClientRect();
    if (b) setLook(towards(b.left + b.width / 2, b.top + b.height / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, status, glance]);

  // Checking: it glances from one end of the row to the other
  useEffect(() => {
    if (!busy) return;
    let side = 1;
    setGlance({ x: 0.45, y: 0.35 });
    const t = setInterval(() => {
      side = -side;
      setGlance({ x: 0.45 * side, y: 0.35 });
    }, 520);
    return () => clearInterval(t);
  }, [busy]);

  // Resend countdown
  useEffect(() => {
    if (left <= 0 || done) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  async function check(code: string) {
    setStatus("checking");
    let ok = false;
    try {
      ok = await onComplete(code);
    } catch {
      ok = false;
    }
    if (ok) {
      setStatus("success");
      input.current?.blur();
      // A little hop once the boxes have turned green
      if (!reduced()) botBox.current?.animate([0, -10, 1, 0].map((y) => ({ transform: `translateY(${y}px)` })), { duration: 600, delay: 250, easing: "ease-out" });
      return;
    }
    setStatus("error");
    setTries((n) => n + 1);
    if (!reduced()) {
      row.current?.animate(SHAKE, { duration: 420, easing: "ease-in-out" });
      botBox.current?.animate(SHAKE.map((k) => ({ transform: k.transform.replace("X(", "X(-") })), { duration: 420, easing: "ease-in-out" });
    }
    // The whole code is selected: the next character you type starts over
    requestAnimationFrame(() => input.current?.select());
  }

  function change(raw: string) {
    if (busy || done) return;
    let next = type === "numeric" ? raw.replace(/\D/g, "") : raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
    next = next.slice(0, length);
    setFrom(status === "error" ? 0 : value.length);
    if (status === "error") setStatus("idle");
    setSent(false);
    setValue(next);
    if (next.length === length) check(next);
  }

  function resend() {
    onResend?.();
    setLeft(resendIn);
    setValue("");
    setFrom(0);
    setStatus("idle");
    setSent(true);
    input.current?.focus();
  }

  // Keep the caret at the end: one input stands in for all the boxes
  function pin() {
    const el = input.current;
    if (!el || status === "error") return;
    const n = el.value.length;
    if (el.selectionStart !== n || el.selectionEnd !== n) el.setSelectionRange(n, n);
  }

  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const field = dark ? "#26241F" : "#F2F2F0";
  const red = dark ? "#E88A86" : "#901919";
  const green = dark ? "#A3BF78" : "#6C8544";
  const wrong = status === "error";

  const message = busy
    ? "Checking…"
    : wrong
      ? tries >= 3
        ? "Still not it. Try the newest code"
        : "That code didn't work"
      : sent
        ? "New code sent"
        : "";

  return (
    <div
      className="w-full max-w-[360px] rounded-[28px] p-7"
      style={{
        background: bg,
        color: fg,
        boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)",
      }}
    >
      <style>{`
        @keyframes otp-pop{0%{opacity:0;transform:translateY(10px) scale(.6);filter:blur(4px)}60%{opacity:1;transform:translateY(-2px) scale(1.08);filter:blur(0)}100%{opacity:1;transform:none}}
        @keyframes otp-wave{0%,55%,100%{transform:translateY(0)}25%{transform:translateY(-6px)}}
        @keyframes otp-caret{0%,45%{opacity:1}50%,95%{opacity:0}}
        @media (prefers-reduced-motion:reduce){[data-otp] *{animation-duration:1ms!important;animation-iteration-count:1!important}}
      `}</style>

      <div className="flex justify-center" data-otp>
        <div ref={botBox}>
          <Bot
            size={compact ? 64 : 88}
            shape={bot?.shape ?? "pill"}
            eyes={bot?.eyes ?? "tall"}
            color={fg}
            eyeColor={bg}
            look={look}
            happy={done}
            mood={wrong ? -Math.min(1, 0.4 + 0.2 * (tries - 1)) : 0}
          />
        </div>
      </div>

      {compact ? null : (
        <div className="mt-5 text-center">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{done ? doneTitle : title}</h2>
          <p className="mt-1 text-[14px] opacity-55">
            {done ? "Taking you in" : sentTo ? <>We sent a {length}-digit code to <span className="font-medium">{sentTo}</span></> : `Enter the ${length}-digit code we sent you`}
          </p>
        </div>
      )}

      <div data-otp className={`${compact ? "mt-5" : "mt-6"} relative`}>
        <div ref={row} className="flex justify-center gap-[7px]">
          {Array.from({ length }, (_, i) => {
            const ch = value[i];
            const on = focused && !busy && !done && !wrong && i === active;
            const late = Math.max(0, i - from);
            return (
              <div key={i} className="contents">
                {gap && i === length / 2 ? <div aria-hidden className="mx-[3px] h-[2px] w-[8px] self-center rounded-full" style={{ background: fg, opacity: 0.25 }} /> : null}
                <div
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  aria-hidden
                  className="relative flex h-[52px] w-[40px] items-center justify-center rounded-[13px] text-[22px] font-semibold tabular-nums"
                  style={{
                    background: done ? green : field,
                    color: done ? bg : fg,
                    boxShadow: on ? `0 0 0 2px ${fg}` : wrong && ch ? `0 0 0 2px ${red}` : "0 0 0 0 transparent",
                    transition: `background .35s ease ${done ? i * 60 : 0}ms, color .35s ease ${done ? i * 60 : 0}ms, box-shadow .18s ease`,
                    animation: busy ? `otp-wave .9s ease-in-out ${i * 70}ms infinite` : undefined,
                  }}
                >
                  {ch ? (
                    <span style={{ animation: `otp-pop .34s cubic-bezier(.2,.8,.3,1.2) ${late * 55}ms both` }}>
                      {mask && !done ? <span className="block h-[10px] w-[10px] rounded-full" style={{ background: "currentColor" }} /> : ch}
                    </span>
                  ) : on ? (
                    <span className="h-[22px] w-[2px] rounded-full" style={{ background: fg, animation: "otp-caret 1s step-end infinite" }} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* The one real input, invisible, over the boxes */}
        <input
          ref={input}
          value={value}
          onChange={(e) => change(e.target.value)}
          onFocus={() => {
            setFocused(true);
            requestAnimationFrame(pin);
          }}
          onBlur={() => setFocused(false)}
          onSelect={pin}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.length === length && !busy && !done) check(value);
          }}
          readOnly={busy || done}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={length * 4}
          aria-label={`Verification code, ${length} ${type === "numeric" ? "digits" : "characters"}`}
          aria-invalid={wrong}
          aria-describedby={id}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none selection:bg-transparent"
        />
      </div>

      <p id={id} role="status" className="mt-3 h-4 text-center text-[12.5px]" style={{ color: wrong ? red : fg, opacity: wrong ? 1 : 0.55 }}>
        {message}
      </p>

      <div className="mt-3 flex h-6 items-center justify-center text-[13px]" style={{ opacity: done ? 0 : 1, transition: "opacity .3s" }}>
        {left > 0 ? (
          <span className="opacity-55 tabular-nums">
            Didn't get it? Resend in {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        ) : (
          <button type="button" disabled={done} onClick={resend} className="rounded-full px-2 font-medium underline decoration-from-font underline-offset-[3px] opacity-80 transition-opacity hover:opacity-100">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
