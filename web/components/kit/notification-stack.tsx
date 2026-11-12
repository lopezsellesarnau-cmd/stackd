'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

/**
 * Notification stack · StackD Kit 05
 * Notifications pile up with the newest in front and the older ones peeking out behind.
 * Hover (or tap, or tab in) and the pile fans out into a list. Swipe one sideways to dismiss it;
 * let go early and it springs back. Each one closes by itself after `duration`, paused while open.
 * You own the list: pass `notes` and remove the one `onDismiss` gives you.
 * White and black versions. React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type Note = {
  id: string | number;
  title: string;
  body?: string;
  time?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
};

type Props = {
  /** Oldest first, newest last. */
  notes: Note[];
  onDismiss: (id: Note["id"]) => void;
  theme?: "light" | "dark";
  /** Milliseconds before a note closes by itself. 0 keeps them until dismissed. */
  duration?: number;
  /** How many show in the pile when it's folded. */
  visible?: number;
};

const GAP = 8; // between notes when open
const PEEK = 10; // how much each older note shows above the one in front
const SHRINK = 0.05; // each older note is this much smaller
const EASE = "cubic-bezier(.2,.8,.2,1)";

export function NotificationStack({ notes, onDismiss, theme = "light", duration = 5000, visible = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [leaving, setLeaving] = useState<Record<string, number>>({}); // id → direction it leaves in
  const box = useRef<HTMLDivElement>(null);

  // Newest first
  const list = [...notes].reverse();
  const staying = list.filter((n) => !(n.id in leaving));
  const h = (n: Note) => heights[String(n.id)] ?? 64;
  const frontH = staying[0] ? h(staying[0]) : 0;

  function leave(id: Note["id"], dir = 1) {
    setLeaving((l) => ({ ...l, [id]: dir }));
    setTimeout(() => {
      onDismiss(id);
      setLeaving((l) => {
        const next = { ...l };
        delete next[String(id)];
        return next;
      });
    }, 260);
  }

  // Where each note sits, from the bottom of the stack
  let below = 0;
  const place = new Map<Note["id"], { y: number; scale: number; shown: boolean; i: number }>();
  staying.forEach((n, i) => {
    place.set(n.id, open ? { y: -below, scale: 1, shown: true, i } : { y: -i * PEEK, scale: 1 - i * SHRINK, shown: i < visible, i });
    below += h(n) + GAP;
  });
  const height = open ? Math.max(0, below - GAP) : frontH + PEEK * (Math.min(staying.length, visible) - 1 || 0);

  return (
    <div
      ref={box}
      role="region"
      aria-label="Notifications"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onClick={() => setOpen(true)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => !box.current?.contains(e.relatedTarget as Node) && setOpen(false)}
      className="relative w-full max-w-[360px] transition-[height] duration-300 motion-reduce:transition-none"
      style={{ height, transitionTimingFunction: EASE }}
    >
      {list.map((n) => {
        const out = leaving[String(n.id)];
        const p = place.get(n.id);
        return (
          <Item
            key={n.id}
            note={n}
            theme={theme}
            y={p?.y ?? 0}
            scale={p?.scale ?? 1}
            shown={p ? p.shown : true}
            front={p?.i === 0}
            depth={p?.i ?? 0}
            total={list.length}
            clip={!open && p && p.i > 0 ? frontH : null}
            open={open}
            out={out}
            paused={open || duration === 0}
            duration={duration}
            onHeight={(v) => setHeights((s) => (s[String(n.id)] === v ? s : { ...s, [String(n.id)]: v }))}
            onLeave={(dir) => leave(n.id, dir)}
          />
        );
      })}
    </div>
  );
}

function Item({
  note,
  theme,
  y,
  scale,
  shown,
  front,
  depth,
  total,
  clip,
  open,
  out,
  paused,
  duration,
  onHeight,
  onLeave,
}: {
  note: Note;
  theme: "light" | "dark";
  y: number;
  scale: number;
  shown: boolean;
  front: boolean;
  depth: number;
  total: number;
  clip: number | null;
  open: boolean;
  out?: number;
  paused: boolean;
  duration: number;
  onHeight: (h: number) => void;
  onLeave: (dir: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const grab = useRef<{ x: number; t: number } | null>(null);
  const left = useRef(duration);
  const dark = theme === "dark";
  const canDrag = open || front;

  // Measure the note's natural height (not the clipped one) so the open list can stack them
  const report = useRef(onHeight);
  useLayoutEffect(() => {
    report.current = onHeight;
  });
  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    const ro = new ResizeObserver(() => report.current(node.offsetHeight));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Slide in from below on the next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Close by itself; the clock stops while the stack is open
  useEffect(() => {
    if (paused || out !== undefined) return;
    const start = Date.now();
    const t = setTimeout(() => onLeave(1), Math.max(0, left.current));
    return () => {
      clearTimeout(t);
      left.current -= Date.now() - start;
    };
  }, [paused, out, onLeave]);

  function down(e: PointerEvent<HTMLDivElement>) {
    if (!canDrag || (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { x: e.clientX, t: performance.now() };
    setDragging(true);
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (!grab.current) return;
    setDx(e.clientX - grab.current.x);
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const g = grab.current;
    if (!g) return;
    grab.current = null;
    setDragging(false);
    const d = e.clientX - g.x;
    const speed = Math.abs(d) / Math.max(1, performance.now() - g.t); // px per ms
    // Far enough, or a quick flick: it goes. Otherwise it springs back.
    if (Math.abs(d) > 80 || (speed > 0.6 && Math.abs(d) > 20)) onLeave(Math.sign(d) || 1);
    else setDx(0);
  }

  function keys(e: KeyboardEvent) {
    if (e.key === "Escape" || e.key === "Delete" || e.key === "Backspace") {
      e.stopPropagation();
      onLeave(1);
    }
  }

  const gone = out !== undefined;
  const x = gone ? `${out * 115}%` : `${dx}px`;
  const fade = gone || !entered || !shown ? 0 : dragging ? 1 - Math.min(0.6, Math.abs(dx) / 300) : 1;

  return (
    <div
      ref={el}
      tabIndex={0}
      role="status"
      aria-label={`${note.title}${note.body ? `. ${note.body}` : ""}`}
      onKeyDown={keys}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="absolute inset-x-0 bottom-0 touch-pan-y select-none overflow-hidden rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#888]/40 motion-reduce:!transition-none"
      style={{
        zIndex: total - depth,
        height: clip ?? undefined,
        background: dark ? "#141310" : "#FFFFFF",
        color: dark ? "#FFFFFF" : "#141310",
        boxShadow: dark
          ? "0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)"
          : "0 0 0 1px rgba(20,19,16,0.06), 0 8px 24px rgba(20,19,16,0.08)",
        transform: `translate(${x}, ${entered ? y : 40}px) scale(${entered ? scale : 0.96})`,
        transformOrigin: "top center",
        opacity: fade,
        pointerEvents: shown && !gone ? "auto" : "none",
        cursor: canDrag ? (dragging ? "grabbing" : "grab") : "default",
        transition: dragging
          ? "none"
          : `transform .45s ${EASE}, opacity .3s ease, height .3s ${EASE}`,
      }}
    >
      <div ref={inner} className="group flex gap-3 p-3.5" style={{ opacity: clip !== null ? 0 : 1, transition: "opacity .2s ease" }}>
        {note.icon ? <div className="shrink-0">{note.icon}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[14px] font-medium">{note.title}</p>
            {note.time ? <span className="shrink-0 text-[11px] opacity-45">{note.time}</span> : null}
          </div>
          {note.body ? <p className="mt-0.5 text-[13px] leading-snug opacity-60">{note.body}</p> : null}
          {note.action ? (
            <button
              type="button"
              onClick={note.action.onClick}
              className="mt-2 rounded-full px-3 py-1 text-[12px] font-medium transition-opacity hover:opacity-80"
              style={{ background: dark ? "#FFFFFF" : "#141310", color: dark ? "#141310" : "#FFFFFF" }}
            >
              {note.action.label}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onLeave(1);
          }}
          className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] opacity-0 transition-opacity hover:!opacity-100 focus-visible:opacity-100 group-hover:opacity-50 [@media(hover:none)]:opacity-50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
