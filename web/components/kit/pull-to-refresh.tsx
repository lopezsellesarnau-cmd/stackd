'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bot } from "./bot";

/**
 * Pull to refresh · StackD Kit 21
 * Pull the list down and a strand of ink stretches between the top and the list, right under your
 * finger. It follows you left and right and gets thinner as you pull. Past the line it snaps: the ends
 * spring back and the middle rolls into a drop that opens its eyes. That's the Bot. Right there, it
 * turns round while `onRefresh` runs (face, back, face again), smiles when it's done, and gets
 * sucked back up as the list springs home.
 * Trackpad (two-finger scroll), mouse drag and touch. The pull gets heavier the further it goes.
 * React + Tailwind and the StackD Bot, no other dependencies. Respects reduced motion.
 */

type Props = {
  /** Your refresh. The Bot waits until it resolves. */
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  /** How far to pull, in px, before it snaps and letting go refreshes. Default 84. */
  threshold?: number;
  /** "light": white, with an ink strand and Bot (default). "dark": the other way round. */
  theme?: "light" | "dark";
  /** What screen readers hear at each step. The Bot says it for everyone else. */
  labels?: { pull?: string; release?: string; loading?: string; done?: string };
  /** Classes for the box: give it a height (here or in `style`). */
  className?: string;
  style?: CSSProperties;
};

/** The Bot, kept apart so turning it every frame doesn't redraw the list. */
function Turning({ set, ...bot }: { set: (f: (deg: number) => void) => void } & Omit<React.ComponentProps<typeof Bot>, "turn" | "size" | "eyes">) {
  const [deg, setDeg] = useState(0);
  useEffect(() => set((d) => setDeg((o) => (Math.abs(o - d) < 0.5 ? o : d))), [set]);
  return <Bot size={BOT} eyes="tall" turn={deg} {...bot} />;
}

type Phase = "idle" | "pull" | "loading" | "done";
const MAX = 170; // the most the list can come down, px
const REST = 104; // where the list waits while loading
const BOT = 52;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 84,
  theme = "light",
  labels = {},
  className = "h-[480px]",
  style,
}: Props) {
  const dark = theme === "dark";
  const ink = "#141310";
  // One background for the card and the gap; the strand and the Bot are the ink
  const sheet = dark ? ink : "#FFFFFF";
  const gapBg = sheet;
  const strand = dark ? "#FFFFFF" : ink;
  const words = { pull: "Pull to refresh", release: "Let go to refresh", loading: "Refreshing", done: "Up to date", ...labels };
  const goo = useId().replace(/:/g, "");

  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const face = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ready, setReady] = useState(false);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;

  // Everything that moves, read and written every frame
  const s = useRef({
    y: 0, vy: 0, ty: 0, // the list: where it is, how fast, where it's going
    fx: 0, bx: 0, vbx: 0, // the finger's x, and the drop's x trailing it
    snap: 0, vsnap: 0, // 0 = one strand, 1 = snapped into a drop
    gone: 1, vgone: 0, // 0 = the drop is here, 1 = sucked back up
    held: false, from: 0, pulled: 0, phase: "idle" as Phase, ready: false, raf: 0, last: 0, t: 0, spun: 0,
    wake: () => {},
    turnTo: (_deg: number) => {},
  });

  const rubber = (d: number) => MAX * (1 - Math.exp(-Math.max(0, d) / MAX));
  const go = (p: Phase) => { s.current.phase = p; setPhase(p); };

  // The loop: springs for the list, the drop and the snap; then draw
  useEffect(() => {
    const st = s.current;
    const spring = (x: number, v: number, to: number, k: number, c: number, dt: number): [number, number] => {
      v += (k * (to - x) - c * v) * dt;
      return [x + v * dt, v];
    };
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, (now - st.last) / 1000 || 1 / 60);
      st.last = now;
      st.t += dt;
      const still = calm();
      if (st.held || still) { st.y = st.ty; st.vy = 0; } else [st.y, st.vy] = spring(st.y, st.vy, st.ty, 170, 17, dt);
      const snapped = st.phase === "loading" || st.phase === "done" || (st.phase === "pull" && st.y >= threshold);
      // The drop trails the finger and stays where it snapped
      if (still) st.bx = st.fx; else [st.bx, st.vbx] = spring(st.bx, st.vbx, st.fx, 110, 11, dt);
      if (snapped !== st.ready) { st.ready = snapped; setReady(snapped); }
      if (still) st.snap = snapped ? 1 : 0; else [st.snap, st.vsnap] = spring(st.snap, st.vsnap, snapped ? 1 : 0, 260, 20, dt);
      // The drop is sucked back up once the refresh is over (or never formed)
      const away = st.phase === "idle" || (st.phase === "pull" && !snapped);
      if (still) st.gone = away ? 1 : 0; else [st.gone, st.vgone] = spring(st.gone, st.vgone, away ? 1 : 0, 140, 18, dt);

      // The list
      const y = Math.max(0, st.y);
      if (box.current) box.current.style.transform = `translateY(${y}px)`;

      // The strand, in circles that a blur-and-threshold filter melts together:
      // a cap on the top edge, a cap on the list, two in the neck and the drop in the middle
      const k = clamp(y / threshold, 0, 1);
      const sn = clamp(st.snap, 0, 1);
      const g = clamp(st.gone, 0, 1);
      const fx = st.fx, bx = st.bx;
      const dy = mix(y / 2, -BOT, st.phase === "idle" ? g : 0);
      // While loading it turns round: face, back, face again, easing in and out of each turn
      if (st.phase === "loading" && !still) st.spun += dt / 1.1;
      else st.spun = Math.ceil(st.spun - 0.001);
      const u = st.spun, f = u - Math.floor(u);
      const turn = 360 * (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);
      st.turnTo(turn % 360);
      const dr = st.phase === "pull" && !snapped ? 8 + 6 * k : mix(mix(8 + 6 * k, BOT / 2, sn), 6, st.phase === "idle" ? g : 0);
      const cap = mix(18 + 10 * k, 10, sn);
      const neck = Math.max(0, (1 - sn) * (12 - 5 * k));
      const c = dots.current;
      const put = (i: number, x: number, yy: number, r: number) => {
        const e = c[i];
        if (!e) return;
        e.setAttribute("cx", x.toFixed(1));
        e.setAttribute("cy", yy.toFixed(1));
        e.setAttribute("r", Math.max(0, r).toFixed(1));
      };
      const open = y > 1;
      put(0, fx, -cap * 0.4, open ? cap : 0);
      put(1, fx, y + cap * 0.4, open ? cap : 0);
      put(2, mix(fx, bx, 0.5), y * 0.27, open ? neck : 0);
      put(3, mix(fx, bx, 0.5), y * 0.73, open ? neck : 0);
      put(4, bx, dy, open || g < 0.95 ? dr : 0);
      if (svg.current) svg.current.style.height = `${y + 40}px`;

      // The Bot rides the drop: its eyes appear once the strand has snapped
      if (face.current) {
        const show = clamp((sn - 0.7) / 0.3, 0, 1) * (1 - clamp(g * 1.6, 0, 1));
        const sc = dr / (BOT / 2);
        face.current.style.opacity = String(show);
        face.current.style.transform = `translate(${bx - BOT / 2}px, ${dy - BOT / 2}px) scale(${sc})`;
      }

      const moving = st.held || st.phase !== "idle" || Math.abs(st.y) > 0.3 || Math.abs(st.vy) > 1 || st.snap > 0.01 || st.gone < 0.99;
      if (moving) st.raf = requestAnimationFrame(frame);
      else st.raf = 0;
    };
    st.wake = () => { if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(frame); } };
    st.wake();
    return () => { cancelAnimationFrame(st.raf); st.raf = 0; };
  }, [threshold]);

  // Input: trackpad, mouse and touch
  useEffect(() => {
    const el = box.current, r = root.current;
    if (!el || !r) return;
    const st = s.current;
    const xOf = (clientX: number) => {
      const b = r.getBoundingClientRect();
      const k = b.width / (r.offsetWidth || 1) || 1;
      return clamp((clientX - b.left) / k, 36, r.offsetWidth - 36);
    };
    const busy = () => st.phase === "loading" || st.phase === "done";
    const pull = (d: number) => {
      // No text selection while pulling with the mouse
      if (st.phase !== "pull") { window.getSelection()?.removeAllRanges(); el.style.userSelect = "none"; }
      st.pulled = Math.max(0, d);
      st.ty = rubber(st.pulled);
      if (st.phase !== "pull") go("pull");
      st.wake();
    };
    const release = () => {
      if (!st.held) return;
      st.held = false;
      el.style.userSelect = "";
      if (st.phase !== "pull") return;
      if (st.y >= threshold) {
        go("loading");
        st.ty = REST;
        Promise.resolve()
          .then(() => refresh.current())
          .catch(() => {})
          .then(() => {
            go("done");
            setTimeout(() => { go("idle"); st.ty = 0; st.wake(); }, calm() ? 0 : 700);
          });
      } else {
        go("idle");
        st.ty = 0;
      }
      st.wake();
    };

    // Trackpad: scrolling up past the top pulls; a short pause counts as letting go
    let idle = 0;
    const wheel = (e: WheelEvent) => {
      if (busy() || el.scrollTop > 0) return;
      if (e.deltaY >= 0 && !st.held) return;
      e.preventDefault();
      if (!st.held) { st.held = true; st.pulled = 0; st.bx = xOf(e.clientX); }
      st.fx = xOf(e.clientX);
      pull(st.pulled - e.deltaY * 0.6);
      clearTimeout(idle);
      idle = window.setTimeout(release, 170);
    };
    const begin = (x: number, y: number) => {
      if (busy() || el.scrollTop > 0) return;
      st.held = true; st.from = y; st.pulled = 0;
      st.fx = st.bx = xOf(x);
    };
    const drag = (x: number, y: number, e?: Event) => {
      if (!st.held) return;
      const d = y - st.from;
      if (d <= 0 && st.phase !== "pull") { if (el.scrollTop > 0) st.held = false; return; }
      if (e && e.cancelable) e.preventDefault();
      st.fx = xOf(x);
      pull(d);
    };
    const ts = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY);
    const tm = (e: TouchEvent) => drag(e.touches[0].clientX, e.touches[0].clientY, e);
    const md = (e: MouseEvent) => { if (e.button === 0) begin(e.clientX, e.clientY); };
    const mm = (e: MouseEvent) => drag(e.clientX, e.clientY);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", release);
    el.addEventListener("touchcancel", release);
    el.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", release);
    return () => {
      clearTimeout(idle);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", release);
      el.removeEventListener("touchcancel", release);
      el.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", release);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  return (
    <div ref={root} className={`relative overflow-hidden ${className}`} style={{ ...style, background: gapBg }}>
      {/* The strand: plain circles, melted together by the filter */}
      <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full overflow-visible" style={{ height: 40 }}>
        <defs>
          <filter id={goo} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
          </filter>
        </defs>
        <g filter={`url(#${goo})`} fill={strand}>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} ref={(e) => { dots.current[i] = e; }} cx="0" cy="0" r="0" />
          ))}
        </g>
      </svg>

      {/* The Bot, riding the drop */}
      <div ref={face} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: BOT, height: BOT, opacity: 0, transformOrigin: "50% 50%" }}>
        <Turning
          set={(f) => { s.current.turnTo = f; }}
          color={strand}
          eyeColor={sheet}
          look={phase === "loading" ? { x: 0, y: 0 } : phase === "done" ? { x: 0, y: -0.4 } : { x: 0, y: 0.7 }}
          happy={phase === "done"}
        />
      </div>

      <span className="sr-only" aria-live="polite">
        {phase === "loading" ? words.loading : phase === "done" ? words.done : phase === "pull" ? (ready ? words.release : words.pull) : ""}
      </span>

      {/* The list */}
      <div ref={box} className="relative h-full overflow-y-auto overscroll-contain" style={{ background: sheet }}>
        {children}
      </div>
    </div>
  );
}
