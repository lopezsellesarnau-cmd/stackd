'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot } from "./bot";

/**
 * Voice memo · StackD Kit 19
 * A voice note you trim. Drag the two handles of the cut: the bars you leave out shrink into dots, and
 * when you let go near a pause the handle glides into it, so you never cut a word in half.
 * Press play and the Bot says the memo: its mouth follows the voice and its eyes follow the playhead.
 * Save sends a ring of light out of the button and through the waveform, and the Bot smiles.
 * Press the waveform to move the playhead. Keyboard: Space plays, ← → move a focused handle 0.1 s
 * (Shift: 1 s). React + Tailwind and the StackD Bot, no other dependencies. Respects reduced motion.
 */

type Cut = { start: number; end: number };

type Props = {
  /** The audio file. It is read once to draw the waveform and find the pauses. */
  src: string;
  title?: string;
  /** A second line under the title, like a date. Default: how long the cut is. */
  subtitle?: string;
  /** Where the cut starts and ends, in seconds. Default: the whole memo. */
  defaultStart?: number;
  defaultEnd?: number;
  /** Called when a handle moves, in seconds. */
  onChange?: (cut: Cut) => void;
  /** Shows a Save button that hands you the cut, in seconds. */
  onSave?: (cut: Cut) => void;
  /** Width in px, or any CSS length. Default 400. */
  width?: number | string;
  theme?: "light" | "dark";
  /** Colour of the part already played. Default: the ink. */
  color?: string;
  /** Show the Bot. Default true. */
  bot?: boolean;
  className?: string;
};

const BAR = 3, GAP = 2.5, H = 56, DOT = 3;
const STEP = 0.02; // the loudness is kept every 20 ms
const MIN = 0.5; // shortest cut, in s
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fine = (s: number) => `${fmt(s)}.${Math.floor((s % 1) * 10)}`;
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Loudness every 20 ms (0–1), and the pauses: quiet stretches of 150 ms or more. */
async function readAudio(src: string) {
  const buf = await (await fetch(src)).arrayBuffer();
  const ctx = new AudioContext();
  const audio = await ctx.decodeAudioData(buf);
  ctx.close();
  const data = audio.getChannelData(0);
  const per = Math.max(1, Math.round(audio.sampleRate * STEP));
  const loud: number[] = [];
  for (let i = 0; i < data.length; i += per) {
    let sum = 0;
    const end = Math.min(data.length, i + per);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    loud.push(Math.sqrt(sum / (end - i)));
  }
  const top = Math.max(...loud) || 1;
  const level = loud.map((v) => Math.min(1, v / top));
  const pauses: [number, number][] = [];
  let from = -1;
  level.forEach((v, i) => {
    const quiet = v < 0.06;
    if (quiet && from < 0) from = i;
    if ((!quiet || i === level.length - 1) && from >= 0) {
      if ((i - from) * STEP >= 0.15) pauses.push([from * STEP, i * STEP]);
      from = -1;
    }
  });
  return { level, pauses, duration: audio.duration };
}

type Face = { m: number; x: number | null; y: number; happy: boolean };

/** The Bot, kept apart so the 60 fps mouth doesn't redraw the whole card. */
function Speaker({ set, color, eyeColor }: { set: (f: (f: Partial<Face>) => void) => void; color: string; eyeColor: string }) {
  const [f, setF] = useState<Face>({ m: 0, x: null, y: 0, happy: false });
  useEffect(() => set((p) => setF((o) => ({ ...o, ...p }))), [set]);
  return (
    <Bot
      size={40}
      eyes="tall"
      color={color}
      eyeColor={eyeColor}
      mouth={f.m}
      happy={f.happy}
      look={f.x === null ? undefined : { x: f.x, y: f.y }}
      within="[data-voice-memo]"
    />
  );
}

export function VoiceMemo({
  src,
  title = "Voice memo",
  subtitle,
  defaultStart,
  defaultEnd,
  onChange,
  onSave,
  width = 400,
  theme = "light",
  color,
  bot = true,
  className = "",
}: Props) {
  const dark = theme === "dark";
  const ink = "#141310";
  const bg = dark ? ink : "#FFFFFF";
  const fg = dark ? "#FFFFFF" : ink;
  const played = color ?? fg;
  const dim = dark ? "rgba(255,255,255,.5)" : "rgba(20,19,16,.5)";
  const lens = dark ? "rgba(255,255,255,.07)" : "#F2F2F0";

  const [info, setInfo] = useState<Awaited<ReturnType<typeof readAudio>> | null>(null);
  const [w, setW] = useState(0);
  const [cut, setCut] = useState<Cut>({ start: 0, end: 0 });
  const [playing, setPlaying] = useState(false);
  const [drag, setDrag] = useState<"start" | "end" | null>(null);
  const [saved, setSaved] = useState(false);

  const card = useRef<HTMLDivElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const head = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const saveBtn = useRef<HTMLButtonElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const at = useRef(0); // playhead, s
  const face = useRef<(f: Partial<Face>) => void>(() => {});
  const setFace = useMemo(() => (f: (f: Partial<Face>) => void) => { face.current = f; }, []);
  const changed = useRef(onChange);
  changed.current = onChange;

  // Read the file once
  useEffect(() => {
    let live = true;
    readAudio(src).then((r) => {
      if (!live) return;
      setInfo(r);
      const start = clamp(defaultStart ?? 0, 0, r.duration);
      const end = clamp(defaultEnd ?? r.duration, start, r.duration);
      setCut({ start, end });
      at.current = start;
    }).catch(() => {});
    const a = new Audio(src);
    a.preload = "auto";
    audio.current = a;
    return () => { live = false; a.pause(); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const el = wave.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dur = info?.duration ?? 0;
  const n = Math.max(1, Math.floor((w + GAP) / (BAR + GAP)));
  // One height per bar: mostly the average of its slice, a little of its peak
  const peaks = useMemo(() => {
    if (!info) return Array(n).fill(0.04);
    const L = info.level;
    return Array.from({ length: n }, (_, i) => {
      const a = Math.floor((i / n) * L.length), b = Math.max(a + 1, Math.floor(((i + 1) / n) * L.length));
      let sum = 0, top = 0;
      for (let j = a; j < b; j++) { sum += L[j]; top = Math.max(top, L[j]); }
      return Math.pow((sum / (b - a)) * 0.6 + top * 0.4, 1.15);
    });
  }, [info, n]);

  const xOf = (t: number) => (dur ? (t / dur) * w : 0);
  const tOf = (x: number) => clamp((x / (w || 1)) * dur, 0, dur);

  // Paint the playhead, the clock and the bars already played, straight on the DOM
  const paint = () => {
    const t = at.current;
    const on = t > cut.start + 0.01 && t < cut.end;
    if (head.current) {
      head.current.style.transform = `translateX(${xOf(t)}px)`;
      head.current.style.opacity = on ? "1" : "0";
    }
    if (clock.current) clock.current.textContent = fine(Math.max(0, t - cut.start));
    bars.current.forEach((b, i) => {
      if (!b) return;
      const mid = ((i + 0.5) / n) * dur;
      const inside = mid >= cut.start && mid <= cut.end;
      b.style.background = inside && on && mid <= t ? played : fg;
      b.style.opacity = !inside ? "0.2" : on && mid <= t ? "1" : "0.35";
    });
  };
  useEffect(paint);

  const level = (t: number) => (info ? info.level[clamp(Math.floor(t / STEP), 0, info.level.length - 1)] : 0);

  const stop = () => {
    audio.current?.pause();
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    face.current({ m: 0, x: null });
  };
  const loop = () => {
    const a = audio.current!;
    at.current = a.currentTime;
    if (a.currentTime >= cut.end || a.ended) {
      stop();
      at.current = cut.start;
      paint();
      return;
    }
    const k = clamp((a.currentTime - cut.start) / (cut.end - cut.start || 1), 0, 1);
    face.current({ m: clamp(level(a.currentTime) * 1.5, 0, 1), x: k * 1.4 - 0.2, y: 0.35 });
    paint();
    raf.current = requestAnimationFrame(loop);
  };
  const play = () => {
    const a = audio.current;
    if (!a || !info) return;
    if (playing) return stop();
    if (at.current < cut.start || at.current >= cut.end - 0.05) at.current = cut.start;
    a.currentTime = at.current;
    a.play().then(() => { setPlaying(true); raf.current = requestAnimationFrame(loop); }).catch(() => {});
  };
  // A moved handle while playing: keep the loop reading the new cut
  useEffect(() => {
    if (!playing) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut]);

  const set = (which: "start" | "end", t: number) => {
    setCut((c) => {
      const next = which === "start"
        ? { start: clamp(t, 0, c.end - MIN), end: c.end }
        : { start: c.start, end: clamp(t, c.start + MIN, dur) };
      changed.current?.(next);
      if (at.current < next.start || at.current > next.end) at.current = next.start;
      return next;
    });
  };
  // On release: if the handle is near a pause, it glides into the middle of it
  const settle = (which: "start" | "end") => {
    if (!info) return;
    const t = which === "start" ? cut.start : cut.end;
    const reach = (14 / (w || 1)) * dur;
    const p = info.pauses.find(([a, b]) => t > a - reach && t < b + reach);
    if (p) set(which, (p[0] + p[1]) / 2);
  };

  const xIn = (e: React.PointerEvent) => {
    const r = wave.current!.getBoundingClientRect();
    const k = r.width / (wave.current!.offsetWidth || 1) || 1;
    return (e.clientX - r.left) / k;
  };

  // Save: a ring of light leaves the button and runs through the card; every bar jumps as it passes
  const save = () => {
    if (!info || saved) return;
    onSave?.({ ...cut });
    setSaved(true);
    face.current({ happy: true, x: 0.6, y: 0.2 });
    setTimeout(() => { setSaved(false); face.current({ happy: false, x: null }); }, 2200);
    if (calm()) return;
    const c = card.current!, b = saveBtn.current!;
    const cr = c.getBoundingClientRect(), br = b.getBoundingClientRect();
    const k = cr.width / (c.offsetWidth || 1) || 1;
    const ox = (br.left + br.width / 2 - cr.left) / k, oy = (br.top + br.height / 2 - cr.top) / k;
    const far = Math.hypot(Math.max(ox, c.offsetWidth - ox), Math.max(oy, c.offsetHeight - oy));
    const ring = c.querySelector<HTMLDivElement>("[data-ring]")!;
    ring.style.left = `${ox}px`;
    ring.style.top = `${oy}px`;
    const T = 1300;
    ring.animate(
      [
        { width: "0px", height: "0px", opacity: 1 },
        { width: `${far * 1.4}px`, height: `${far * 1.4}px`, opacity: 1, offset: 0.55 },
        { width: `${far * 2.3}px`, height: `${far * 2.3}px`, opacity: 0 },
      ],
      { duration: T, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
    // The card gives a little, like two phones touching
    c.animate([{ transform: "scale(1)" }, { transform: "scale(.985)" }, { transform: "scale(1.008)" }, { transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
    const wr = wave.current!.getBoundingClientRect();
    bars.current.forEach((bar, i) => {
      if (!bar) return;
      const x = (wr.left - cr.left) / k + (i + 0.5) * (BAR + GAP), y = (wr.top - cr.top) / k + H / 2 + 8;
      const d = Math.hypot(x - ox, y - oy) / far;
      // the ring's easing reaches a distance d at roughly this share of its time
      const when = (1 - Math.pow(1 - d, 0.55)) * T * 0.45;
      bar.animate(
        [{ transform: "scaleY(1)" }, { transform: "scaleY(1.9)" }, { transform: "scaleY(.7)" }, { transform: "scaleY(1)" }],
        { duration: 520, delay: when, easing: "cubic-bezier(.3,1.4,.5,1)" },
      );
    });
  };

  const handle = (which: "start" | "end") => {
    const t = which === "start" ? cut.start : cut.end;
    const held = drag === which;
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={which === "start" ? "Start of the cut" : "End of the cut"}
        aria-valuemin={0}
        aria-valuemax={Math.round(dur * 10) / 10}
        aria-valuenow={Math.round(t * 10) / 10}
        aria-valuetext={fmt(t)}
        className="group absolute top-0 z-10 flex h-full w-7 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center outline-none"
        style={{ left: xOf(t), transition: held || calm() ? "none" : "left 260ms cubic-bezier(.3,1.3,.5,1)" }}
        onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); setDrag(which); }}
        onPointerMove={(e) => { if (held) set(which, tOf(xIn(e))); }}
        onPointerUp={() => { setDrag(null); settle(which); }}
        onPointerCancel={() => { setDrag(null); settle(which); }}
        onKeyDown={(e) => {
          const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
          if (!d) return;
          e.preventDefault();
          set(which, t + d * (e.shiftKey ? 1 : 0.1));
        }}
      >
        {/* The grip: a pill with a ring of the card colour, so it reads over the bars */}
        <span
          className="block w-[6px] rounded-full motion-safe:transition-[height,transform] motion-safe:duration-200 group-focus-visible:ring-2"
          style={{
            height: held ? 44 : 32,
            background: fg,
            boxShadow: `0 0 0 3px ${bg}`,
            transform: held ? "scaleX(1.2)" : "none",
            ["--tw-ring-color" as string]: dim,
          }}
        />
      </div>
    );
  };

  const len = Math.max(0, cut.end - cut.start);

  return (
    <div
      ref={card}
      data-voice-memo
      className={`relative select-none overflow-hidden rounded-[28px] p-5 ${className}`}
      style={{
        width,
        background: bg,
        color: fg,
        boxShadow: dark ? "0 24px 48px rgba(20,19,16,0.28)" : "0 24px 48px rgba(20,19,16,0.07), 0 0 0 1px rgba(20,19,16,0.05)",
      }}
      onKeyDown={(e) => {
        if (e.key === " " && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); play(); }
      }}
    >
      {/* The ring of light that Save sends out: cool outside, warm inside */}
      <div
        data-ring
        aria-hidden
        className="pointer-events-none absolute z-20 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{
          boxShadow: dark
            ? "0 0 0 2px rgba(255,255,255,.95), 0 0 28px 10px rgba(150,175,255,.7), inset 0 0 22px 8px rgba(255,200,150,.6)"
            : "0 0 0 2px rgba(255,255,255,1), 0 0 28px 10px rgba(120,150,255,.6), inset 0 0 22px 8px rgba(255,170,120,.55)",
        }}
      />

      {/* Header: the Bot, the title, the clock and play */}
      <div className="flex items-center gap-3">
        {bot ? <Speaker set={setFace} color={fg} eyeColor={bg} /> : null}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-medium">{title}</p>
          <p className="mt-0.5 text-[12px] tabular-nums" style={{ color: dim }}>
            {subtitle ?? (info ? `${fine(len)} selected` : "Reading…")}
          </p>
        </div>
        <span ref={clock} className="text-[20px] font-light tabular-nums tracking-tight" style={{ color: dim }}>
          0:00.0
        </span>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={play}
          disabled={!info}
          className="flex h-10 w-10 items-center justify-center rounded-full motion-safe:transition-transform motion-safe:active:scale-90 disabled:opacity-40"
          style={{ background: fg, color: bg }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5Z" /></svg>
          )}
        </button>
      </div>

      {/* The waveform. The soft area is the cut; press anywhere in it to move the playhead */}
      <div
        ref={wave}
        className="relative mt-5 flex cursor-pointer items-center justify-between"
        style={{ height: H + 16 }}
        onPointerDown={(e) => {
          if (!info) return;
          const t = clamp(tOf(xIn(e)), cut.start, cut.end);
          at.current = t;
          if (audio.current && playing) audio.current.currentTime = t;
          paint();
        }}
      >
        {info ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 rounded-[16px]"
            style={{
              left: xOf(cut.start) - 6,
              width: xOf(cut.end) - xOf(cut.start) + 12,
              background: lens,
              transition: drag || calm() ? "none" : "left 260ms cubic-bezier(.3,1.3,.5,1), width 260ms cubic-bezier(.3,1.3,.5,1)",
            }}
          />
        ) : null}
        {peaks.map((p, i) => {
          const mid = ((i + 0.5) / n) * dur;
          const inside = !dur || (mid >= cut.start && mid <= cut.end);
          return (
            <div
              key={i}
              ref={(el) => { bars.current[i] = el; }}
              className="relative shrink-0 rounded-full motion-safe:transition-[height] motion-safe:duration-300"
              style={{
                width: BAR,
                height: inside ? Math.max(DOT, p * H) : DOT,
                background: fg,
                opacity: inside ? 0.35 : 0.2,
                transitionTimingFunction: "cubic-bezier(.3,1.5,.5,1)",
              }}
            />
          );
        })}
        {/* Playhead */}
        <div ref={head} aria-hidden className="pointer-events-none absolute left-0 top-2 bottom-2 -ml-px w-[2px] rounded-full opacity-0" style={{ background: played }} />
        {info ? handle("start") : null}
        {info ? handle("end") : null}
      </div>

      {/* Footer: the cut in time, and Save */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] tabular-nums" style={{ color: dim }}>
          {fmt(cut.start)} → {fmt(cut.end)}
        </span>
        {onSave ? (
          <button
            ref={saveBtn}
            type="button"
            onClick={save}
            disabled={!info}
            className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium motion-safe:transition-[transform,background-color] motion-safe:duration-300 motion-safe:active:scale-95"
            style={{ background: saved ? fg : dark ? "rgba(255,255,255,.1)" : "rgba(20,19,16,.06)", color: saved ? bg : fg }}
          >
            {saved ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m2.5 6.3 2.3 2.2 4.7-5" /></svg>
                Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
