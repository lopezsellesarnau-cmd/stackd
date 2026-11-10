'use client'

import { useRef, useState, type PointerEvent } from "react";

/**
 * Slide to pay · StackD Kit 03
 * Drag the handle to the end to confirm. Let go early and it springs back.
 * Past the end it locks, shows a spinner while `onConfirm` runs, then a check.
 * If `onConfirm` throws, the bar shakes and resets. Enter on the handle works too.
 * React + Tailwind, no other dependencies.
 */

type Status = "idle" | "drag" | "processing" | "done" | "error";

type Props = {
  /** Shown in the label, e.g. "€24.00". */
  amount?: string;
  /** Your payment. Resolve when paid, throw to show the error state. */
  onConfirm?: () => Promise<unknown>;
  /** Bar colour. The handle and text use `fg`. */
  color?: string;
  fg?: string;
};

const PAD = 6; // gap between handle and track edge
const KNOB = 52;
const THRESHOLD = 0.9;

export function SlideToPay({
  amount = "€24.00",
  onConfirm = () => new Promise((r) => setTimeout(r, 1600)),
  color = "#111111",
  fg = "#FFFFFF",
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [x, setX] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const start = useRef(0);
  const [maxX, setMaxX] = useState(1);

  const max = () => (track.current?.offsetWidth ?? 0) - KNOB - PAD * 2;
  const locked = status === "processing" || status === "done";
  const progress = x / maxX;

  async function confirm() {
    setX(max());
    setStatus("processing");
    try {
      await onConfirm();
      setStatus("done");
    } catch {
      setStatus("error");
      setX(0);
      setTimeout(() => setStatus("idle"), 600);
    }
  }

  function down(e: PointerEvent<HTMLButtonElement>) {
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setMaxX(max());
    start.current = e.clientX - x;
    setStatus("drag");
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    if (status !== "drag") return;
    setX(Math.min(maxX, Math.max(0, e.clientX - start.current)));
  }

  function up() {
    if (status !== "drag") return;
    if (progress >= THRESHOLD) confirm();
    else {
      setX(0);
      setStatus("idle");
    }
  }

  const label =
    status === "processing"
      ? "Processing"
      : status === "done"
        ? "Paid"
        : status === "error"
          ? "Payment failed"
          : `Slide to pay ${amount}`;

  return (
    <div
      ref={track}
      className={`relative h-16 w-full max-w-sm select-none overflow-hidden rounded-full ${
        status === "error" ? "animate-[stp-shake_0.4s]" : ""
      }`}
      style={{ background: color, color: fg }}
    >
      <style>{`
        @keyframes stp-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes stp-shine{from{background-position:150% 0}to{background-position:-50% 0}}
      `}</style>

      {/* Trail behind the handle */}
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: status === "done" ? "100%" : x + KNOB + PAD * 2,
          background: fg,
          opacity: status === "done" ? 1 : 0.12,
          transition: status === "drag" ? "none" : "all 0.45s cubic-bezier(.2,.8,.2,1)",
        }}
      />

      <span
        aria-live="polite"
        className="absolute inset-0 flex items-center justify-center pl-12 text-[15px] font-medium"
        style={{
          opacity: status === "drag" ? 1 - progress * 1.4 : 1,
          color: status === "done" ? color : fg,
          paddingLeft: locked ? 0 : undefined,
          transition: "color .3s",
          ...(status === "idle" && {
            backgroundImage: `linear-gradient(90deg, ${fg}66 30%, ${fg} 50%, ${fg}66 70%)`,
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "stp-shine 2.4s linear infinite",
          }),
        }}
      >
        {label}
      </span>

      <button
        type="button"
        aria-label={`Slide to pay ${amount}`}
        disabled={locked}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={(e) => e.key === "Enter" && !locked && confirm()}
        className="absolute flex touch-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          top: PAD,
          left: PAD,
          width: KNOB,
          height: KNOB,
          background: fg,
          color,
          transform: `translateX(${x}px)`,
          opacity: status === "done" ? 0 : 1,
          cursor: locked ? "default" : status === "drag" ? "grabbing" : "grab",
          transition:
            status === "drag" ? "none" : "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity .2s",
        }}
      >
        {status === "processing" ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      {status === "done" && (
        <svg
          className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "stp-draw .4s .15s forwards" }} />
          <style>{`@keyframes stp-draw{to{stroke-dashoffset:0}}`}</style>
        </svg>
      )}
    </div>
  );
}
