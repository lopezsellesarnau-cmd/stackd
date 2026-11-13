'use client'

import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { Bot } from "./bot";

/**
 * Bot login · StackD Kit 09
 * A sign-in card with the Bot (Kit 01) on top. It follows your cursor, reads along as you type your
 * email (looking at the exact spot you're typing), turns away while you type the password and peeks
 * if you show it. While it checks, it glances side to side; it smiles when you're in and shakes its
 * head when the password is wrong.
 * Plug in your auth with `onSubmit`. White and black versions.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

type Mode = "idle" | "email" | "password" | "loading" | "success" | "error";
type Look = { x: number; y: number };

type Props = {
  /** Your sign-in. Return (or resolve) true when it worked. */
  onSubmit?: (email: string, password: string) => boolean | Promise<boolean>;
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  title?: string;
  subtitle?: string;
  /** A tighter card for small spaces: smaller Bot, no title. */
  compact?: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function BotLogin({
  onSubmit = async (_e, p) => {
    await new Promise((r) => setTimeout(r, 1200));
    return p === "stackd";
  },
  theme = "light",
  bot,
  title = "Welcome back",
  subtitle = "Sign in to continue",
  compact = false,
}: Props) {
  const dark = theme === "dark";
  const [mode, setMode] = useState<Mode>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [look, setLook] = useState<Look | undefined>(undefined);
  const [shake, setShake] = useState(0);

  const botBox = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  // A direction from the Bot towards a point on the screen, gentler the closer it is
  function towards(px: number, py: number): Look {
    const r = botBox.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const far = Math.min(0.8, Math.tanh(d / 220));
    return { x: (dx / d) * far, y: (dy / d) * far };
  }

  // Where the caret is in a field, measured with the field's own font
  function caret(input: HTMLInputElement | null, length: number): Look {
    if (!input) return { x: 0, y: 0 };
    const r = input.getBoundingClientRect();
    const cs = getComputedStyle(input);
    const ctx = document.createElement("canvas").getContext("2d");
    let w = 0;
    if (ctx) {
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const shown = input.type === "password" ? "•".repeat(length) : input.value.slice(0, length);
      w = ctx.measureText(shown).width;
    }
    const left = r.left + parseFloat(cs.paddingLeft);
    const x = clamp(left + w - input.scrollLeft, left, r.right - parseFloat(cs.paddingRight));
    return towards(x, r.top + r.height / 2);
  }

  // What the Bot looks at, by mode. Undefined = it follows the cursor by itself.
  useEffect(() => {
    if (mode === "email") setLook(caret(emailRef.current, email.length));
    else if (mode === "password") setLook(show ? caret(passRef.current, password.length) : { x: -0.75, y: -0.4 });
    else if (mode === "success") setLook({ x: 0, y: 0 });
    else if (mode === "error") setLook({ x: 0, y: 0.6 });
    else if (mode === "idle") setLook(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, email, password, show]);

  // Thinking: glances from one side to the other while it checks
  useEffect(() => {
    if (mode !== "loading") return;
    let side = 1;
    setLook({ x: 0.5, y: -0.45 });
    const t = setInterval(() => {
      side = -side;
      setLook({ x: 0.5 * side, y: -0.45 });
    }, 650);
    return () => clearInterval(t);
  }, [mode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "loading" || mode === "success") return;
    setMode("loading");
    const ok = await onSubmit(email, password);
    if (ok) setMode("success");
    else {
      setMode("error");
      setShake((n) => n + 1);
    }
  }

  const fg = dark ? "#FFFFFF" : "#141310";
  const field = dark ? "#1E1D1A" : "#F2F2F0";
  const busy = mode === "loading";
  const done = mode === "success";

  const input =
    "h-12 w-full rounded-[14px] px-4 text-[16px] outline-none transition-shadow placeholder:opacity-40 focus:shadow-[0_0_0_2px_currentColor] sm:text-[15px]";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="w-full max-w-[360px] rounded-[28px] p-7"
      style={{
        background: dark ? "#141310" : "#FFFFFF",
        color: fg,
        boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)",
      }}
    >
      <style>{`
        @keyframes bl-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
        @keyframes bl-spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* The Bot; shakes its head on a wrong password */}
      <div className="flex justify-center">
        <div
          key={shake}
          ref={botBox}
          className="motion-reduce:![animation:none]"
          style={{ animation: shake ? "bl-shake .5s ease-in-out" : undefined }}
        >
          <Bot size={compact ? 64 : 88} shape={bot?.shape ?? "pill"} eyes={bot?.eyes ?? "tall"} color={fg} eyeColor={dark ? "#141310" : "#FFFFFF"} look={look} happy={done} />
        </div>
      </div>

      {compact ? null : (
        <div className="mt-5 text-center">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{done ? "You're in" : title}</h2>
          <p className="mt-1 text-[14px] opacity-55">{done ? `Signed in as ${email || "you"}` : subtitle}</p>
        </div>
      )}

      <div className={`${compact ? "mt-5" : "mt-6"} space-y-2.5`} style={{ opacity: done ? 0.4 : 1, pointerEvents: done ? "none" : "auto" }}>
        <input
          ref={emailRef}
          type="email"
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onFocus={() => setMode("email")}
          onBlur={() => setMode((m) => (m === "email" ? "idle" : m))}
          onChange={(e) => {
            setEmail(e.target.value);
            if (mode === "error") setMode("email");
          }}
          onKeyUp={() => setLook(caret(emailRef.current, emailRef.current?.selectionStart ?? email.length))}
          className={input}
          style={{ background: field, color: fg }}
        />
        <div className="relative">
          <input
            ref={passRef}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            aria-invalid={mode === "error"}
            value={password}
            onFocus={() => setMode("password")}
            onBlur={() => setMode((m) => (m === "password" ? "idle" : m))}
            onChange={(e) => {
              setPassword(e.target.value);
              if (mode === "error") setMode("password");
            }}
            className={`${input} pr-12`}
            style={{ background: field, color: fg, boxShadow: mode === "error" ? "0 0 0 2px #901919" : undefined }}
          />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            onMouseDown={(e) => e.preventDefault()} // keep the focus in the field
            onClick={() => {
              setShow(!show);
              passRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {show ? null : <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>

        <p role="alert" className="h-4 px-1 text-[12.5px]" style={{ color: dark ? "#E88A86" : "#901919" }}>
          {mode === "error" ? "Wrong email or password" : ""}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium transition-[transform,opacity] active:scale-[0.98] disabled:opacity-80"
          style={{ background: fg, color: dark ? "#141310" : "#FFFFFF" }}
        >
          {busy ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ animation: "bl-spin .8s linear infinite" }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
    </form>
  );
}
