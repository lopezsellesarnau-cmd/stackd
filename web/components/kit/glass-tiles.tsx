'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type PointerEvent as ReactPointerEvent } from "react";
import { Bot } from "./bot";

/**
 * Glass tiles · StackD Kit 16
 * Drag over a picture to cover parts of it with tiles of glass. Each tile is its own little lens:
 * some frosted, some magnifying a nearby spot, some mirrored or smeared, so the covered part reads
 * as glass, not as a grey box. Tiles pop in on a spring as you drag; start a drag on glass and it
 * clears instead. Hold "Peek" to see the picture underneath, and save the result as a PNG.
 * The Bot in the toolbar watches the brush and is pleased when you finish a stroke.
 * Keyboard: arrows move, Enter or Space toggles a tile. White and black toolbars.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

type Lens = { zoom: number; dx: number; dy: number; blur: number; flip: boolean; stretch: number; tint: number };

type Props = {
  src: string;
  alt?: string;
  /** The frame's shape, width / height (1 = square). The picture fills it, cropped from the centre. Default: the picture's own shape. */
  aspect?: number;
  /** Tiles across. The rows follow the frame's shape. Default 8. */
  columns?: number;
  /** Covered tiles (row * columns + column), if you control them. */
  value?: number[];
  defaultValue?: number[];
  onChange?: (tiles: number[]) => void;
  /** How strong the glass is, 0 (clear) to 1 (thick frost). Default 0.6. */
  strength?: number;
  /** A number that reshuffles the lenses. */
  seed?: number;
  /** Show the toolbar (Bot, count, Peek, Clear, Save). Default true. */
  toolbar?: boolean;
  /** File name for Save, or false to hide the button. Saving needs a same-origin (or CORS) image. */
  download?: string | false;
  /** Passed to the <img>, for images on another domain that allow CORS (needed to save). */
  crossOrigin?: "anonymous" | "use-credentials";
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  className?: string;
};

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// A small seeded random, so every tile keeps the same lens on the server and in the browser
function rand(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Four kinds of glass, mixed: frosted, a magnifying lens, a mirrored pane, a smear
function lensFor(i: number, seed: number): Lens {
  const r = rand(i * 9973 + seed * 7919 + 1);
  const k = r();
  const j = () => r() * 2 - 1;
  if (k < 0.34) return { zoom: 1.12 + r() * 0.1, dx: j() * 0.25, dy: j() * 0.25, blur: 9 + r() * 4, flip: false, stretch: 1, tint: 0.14 };
  if (k < 0.66) return { zoom: 1.5 + r() * 0.7, dx: j() * 0.7, dy: j() * 0.7, blur: 0.4, flip: false, stretch: 1, tint: 0.06 };
  if (k < 0.82) return { zoom: 1.2 + r() * 0.2, dx: j() * 1.1, dy: j() * 0.4, blur: 2.5, flip: true, stretch: 1, tint: 0.1 };
  return { zoom: 1.1, dx: j() * 0.3, dy: j() * 0.5, blur: 3.5, flip: false, stretch: 2 + r() * 0.8, tint: 0.1 };
}

export function GlassTiles({
  src,
  alt = "",
  aspect,
  columns = 8,
  value,
  defaultValue,
  onChange,
  strength = 0.6,
  seed = 1,
  toolbar = true,
  download = "glass.png",
  crossOrigin,
  theme = "light",
  bot,
  className = "",
}: Props) {
  const dark = theme === "dark";
  const [own, setOwn] = useState<number[]>(defaultValue ?? []);
  const tiles = value ?? own;
  const on = useMemo(() => new Set(tiles), [tiles]);
  const [size, setSize] = useState({ w: 0, h: 0 }); // the frame, in px
  const [nat, setNat] = useState({ w: 4, h: 5 }); // the picture's own size
  const [leaving, setLeaving] = useState<number[]>([]);
  const [peek, setPeek] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [keys, setKeys] = useState(false); // show the keyboard cursor
  const [glad, setGlad] = useState(false);
  const [note, setNote] = useState("");

  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const stroke = useRef<{ mode: "add" | "remove"; last: [number, number] | null; changed: boolean } | null>(null);
  const live = useRef(tiles);
  live.current = tiles;

  const ratio = aspect ?? nat.w / nat.h;
  const rows = Math.max(1, Math.round(columns / ratio));
  // Where the picture sits in the frame (it covers it, centred, like object-fit: cover)
  const fill = Math.max(size.w / nat.w, size.h / nat.h) || 1;
  const dw = nat.w * fill, dh = nat.h * fill;
  const ox = (size.w - dw) / 2, oy = (size.h - dh) / 2;
  const tw = size.w / columns;
  const th = size.h / rows;
  const lenses = useMemo(() => Array.from({ length: columns * rows }, (_, i) => lensFor(i, seed)), [columns, rows, seed]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The image may already be loaded (cache) before React attaches onLoad
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth) setNat({ w: el.naturalWidth, h: el.naturalHeight });
  }, [src]);

  const commit = useCallback(
    (next: number[]) => {
      if (value === undefined) setOwn(next);
      live.current = next;
      onChange?.(next);
    },
    [value, onChange],
  );

  // Removed tiles stay a moment so they can shrink away
  const drop = (gone: number[]) => {
    if (!gone.length || reduced()) return;
    setLeaving((l) => [...l, ...gone]);
    window.setTimeout(() => setLeaving((l) => l.filter((x) => !gone.includes(x))), 260);
  };

  const apply = (idx: number[], mode: "add" | "remove") => {
    const cur = new Set(live.current);
    const changed: number[] = [];
    for (const i of idx) {
      if (mode === "add" && !cur.has(i)) { cur.add(i); changed.push(i); }
      if (mode === "remove" && cur.has(i)) { cur.delete(i); changed.push(i); }
    }
    if (!changed.length) return false;
    if (mode === "remove") drop(changed);
    commit(Array.from(cur).sort((a, b) => a - b));
    return true;
  };

  const tileAt = (x: number, y: number) => {
    const c = Math.min(columns - 1, Math.max(0, Math.floor(x / tw)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor(y / th)));
    return r * columns + c;
  };

  // The pointer in frame pixels (works inside scaled parents too)
  const local = (e: ReactPointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    const k = r.width / (frame.current!.offsetWidth || 1);
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k] as [number, number];
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !tw || !th) return;
    e.preventDefault();
    frame.current?.setPointerCapture(e.pointerId);
    const [x, y] = local(e);
    const i = tileAt(x, y);
    const mode = on.has(i) ? "remove" : "add";
    stroke.current = { mode, last: [x, y], changed: apply([i], mode) };
    setKeys(false);
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = stroke.current;
    if (!s || !s.last) return;
    const [x, y] = local(e);
    // Every tile the pointer crossed since the last event, so a fast drag leaves no gaps
    const [lx, ly] = s.last;
    const steps = Math.ceil(Math.hypot(x - lx, y - ly) / (Math.min(tw, th) / 3)) || 1;
    const hit = new Set<number>();
    for (let k = 1; k <= steps; k++) hit.add(tileAt(lx + ((x - lx) * k) / steps, ly + ((y - ly) * k) / steps));
    if (apply(Array.from(hit), s.mode)) s.changed = true;
    s.last = [x, y];
  };

  const up = () => {
    const s = stroke.current;
    stroke.current = null;
    if (!s?.changed) return;
    const n = live.current.length;
    setNote(n ? `${n} ${n === 1 ? "tile" : "tiles"} of glass` : "No glass");
    if (s.mode === "add") {
      setGlad(true);
      window.setTimeout(() => setGlad(false), 700);
    }
  };

  const key = (e: React.KeyboardEvent) => {
    const c = cursor % columns, r = Math.floor(cursor / columns);
    const go = (nc: number, nr: number) => {
      e.preventDefault();
      setKeys(true);
      setCursor(Math.min(rows - 1, Math.max(0, nr)) * columns + Math.min(columns - 1, Math.max(0, nc)));
    };
    if (e.key === "ArrowRight") go(c + 1, r);
    else if (e.key === "ArrowLeft") go(c - 1, r);
    else if (e.key === "ArrowDown") go(c, r + 1);
    else if (e.key === "ArrowUp") go(c, r - 1);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setKeys(true);
      const had = on.has(cursor);
      apply([cursor], had ? "remove" : "add");
      setNote(had ? "Glass removed" : "Glass added");
    }
  };

  const clear = () => {
    drop(live.current);
    commit([]);
    setNote("No glass");
  };

  // Draws the picture with its glass at full size, the same way the tiles are drawn on screen
  const save = async () => {
    const el = img.current;
    if (!el || !download) return;
    if (!size.w) return;
    // Image pixels per frame pixel: the PNG keeps the picture's full detail, cropped like the frame
    const k = nat.w / dw;
    const cv = document.createElement("canvas");
    cv.width = Math.round(size.w * k);
    cv.height = Math.round(size.h * k);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, ox * k, oy * k, nat.w, nat.h);
    const sw = tw * k, sh = th * k, unit = k;
    for (const i of live.current) {
      const L = lenses[i];
      if (!L) continue;
      const c = i % columns, r = Math.floor(i / columns);
      const x = c * sw, y = r * sh;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, sw, sh);
      ctx.clip();
      ctx.filter = `blur(${L.blur * strength * unit}px) saturate(1.15)`;
      const px = ((c + 0.5 + L.dx) * tw - ox) * k, py = ((r + 0.5 + L.dy) * th - oy) * k;
      ctx.translate(x + sw / 2, y + sh / 2);
      ctx.scale(L.flip ? -L.zoom : L.zoom, L.zoom * L.stretch);
      ctx.drawImage(el, -px, -py, nat.w, nat.h);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${L.tint})`;
      ctx.fillRect(x, y, sw, sh);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = Math.max(1, unit);
      ctx.strokeRect(x + 0.5, y + 0.5, sw - 1, sh - 1);
      ctx.restore();
    }
    try {
      const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, "image/png"));
      if (!blob) throw new Error("empty");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = download;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setNote("Saved");
    } catch {
      setNote("Can't save this picture (it's on another domain without CORS)");
    }
  };

  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const field = dark ? "#26241F" : "#F2F2F0";
  const shown = new Set([...tiles, ...leaving]);
  const count = tiles.length;

  return (
    <div
      data-glass
      className={`w-full overflow-hidden rounded-[32px] ${className}`}
      style={{ background: bg, color: fg, boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)" }}
    >
      <style>{`
        @keyframes gt-in{0%{transform:scale(.35);opacity:0;filter:blur(6px)}55%{transform:scale(1.08);opacity:1;filter:blur(0)}100%{transform:scale(1)}}
        @keyframes gt-out{to{transform:scale(.4);opacity:0}}
        @media (prefers-reduced-motion:reduce){[data-glass] [data-tile]{animation:none!important}}
      `}</style>

      <div
        ref={frame}
        tabIndex={0}
        role="application"
        aria-roledescription="glass editor"
        aria-label={`${alt ? alt + ". " : ""}Drag over the picture to cover parts with glass; start on glass to clear it. Arrow keys move, Enter toggles a tile.`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        onBlur={() => setKeys(false)}
        className="relative w-full touch-none select-none overflow-hidden outline-none"
        style={{ aspectRatio: String(ratio), cursor: "crosshair" }}
      >
        <img
          ref={img}
          src={src}
          alt={alt}
          crossOrigin={crossOrigin}
          draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        {/* The glass */}
        {tw > 0 ? (
          <div className="pointer-events-none absolute inset-0" style={{ opacity: peek ? 0 : 1, transition: "opacity .18s ease" }}>
            {Array.from(shown).map((i) => {
              const L = lenses[i];
              if (!L) return null;
              const c = i % columns, r = Math.floor(i / columns);
              const out = !on.has(i);
              const m = Math.ceil(L.blur * strength * 2) + 2; // room so the blur doesn't fade at the edges
              // The point of the picture this lens looks at, magnified around the tile's centre
              const px = (c + 0.5 + L.dx) * tw, py = (r + 0.5 + L.dy) * th;
              const bw = dw * L.zoom, bh = dh * L.zoom * L.stretch;
              return (
                <div
                  key={i}
                  data-tile
                  className="absolute overflow-hidden"
                  style={{
                    left: c * tw,
                    top: r * th,
                    width: tw + 0.5,
                    height: th + 0.5,
                    animation: out ? "gt-out .24s ease-in forwards" : "gt-in .42s cubic-bezier(.3,1.4,.5,1) both",
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: -m,
                      top: -m,
                      width: tw + 2 * m,
                      height: th + 2 * m,
                      backgroundImage: `url("${src}")`,
                      backgroundSize: `${bw}px ${bh}px`,
                      backgroundPosition: `${tw / 2 + m - (px - ox) * L.zoom}px ${th / 2 + m - (py - oy) * L.zoom * L.stretch}px`,
                      filter: `blur(${(L.blur * strength).toFixed(2)}px) saturate(1.15)`,
                      transform: L.flip ? "scaleX(-1)" : undefined,
                    }}
                  />
                  {/* The pane: a little white, a sheen from the top left, and a thin bright edge */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,${0.22 + L.tint}) 0%, rgba(255,255,255,${L.tint}) 38%, rgba(255,255,255,${L.tint * 0.6}) 100%)`,
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4), inset 0 -1px 0 rgba(20,19,16,0.08)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {/* The keyboard cursor */}
        {keys && tw > 0 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-[4px]"
            style={{ left: (cursor % columns) * tw, top: Math.floor(cursor / columns) * th, width: tw, height: th, boxShadow: "inset 0 0 0 2px #FFFFFF, 0 0 0 2px #141310" }}
          />
        ) : null}
      </div>

      <p className="sr-only" role="status">
        {note}
      </p>

      {toolbar ? (
        <div className="flex items-center gap-3 px-3 py-3">
          <Bot size={34} shape={bot?.shape ?? "pill"} eyes={bot?.eyes ?? "tall"} color={fg} eyeColor={bg} happy={glad} within="[data-glass]" follow={0.9} />
          <p className="min-w-0 flex-1 truncate text-[13px]">
            {count ? (
              <>
                <span className="font-medium tabular-nums">{count}</span>
                <span className="opacity-55"> {count === 1 ? "tile" : "tiles"} of glass</span>
              </>
            ) : (
              <span className="opacity-55">Drag over the picture</span>
            )}
          </p>
          <button
            type="button"
            disabled={!count}
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setPeek(true)}
            onKeyUp={() => setPeek(false)}
            aria-pressed={peek}
            className="h-8 rounded-full px-3 text-[13px] font-medium transition-opacity disabled:opacity-35"
            style={{ background: field }}
          >
            Peek
          </button>
          <button type="button" disabled={!count} onClick={clear} className="h-8 rounded-full px-3 text-[13px] font-medium transition-opacity disabled:opacity-35" style={{ background: field }}>
            Clear
          </button>
          {download ? (
            <button type="button" disabled={!count} onClick={save} className="h-8 rounded-full px-3.5 text-[13px] font-medium transition-opacity disabled:opacity-35" style={{ background: fg, color: bg }}>
              Save
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
