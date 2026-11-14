'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Bot } from "./bot";

/**
 * File drop · StackD Kit 13
 * A dropzone with the Bot (Kit 01) in the middle. Drag files over the page and it looks up and
 * opens its mouth; bring them over the zone and it opens wide and follows them. Let go and the
 * file is pulled into its mouth (faster as it gets closer, stretching as it goes), the Bot chews,
 * and the files come out below as rows that upload with a rolling percentage and a bar.
 * Images get a thumbnail, other files a coloured type badge.
 * Too big or the wrong type: the Bot shakes its head. Keep trying the same thing and it starts
 * answering back, and in the end it won't open its mouth at all.
 * Drop, click (or Enter / Space) to browse, or paste with ⌘V. `samples` adds a tray of pretend
 * files you can drag in, for demos and empty states. Plug in your backend with `upload`.
 * White and black versions. React + Tailwind, no other dependencies (uses the Bot from Kit 01).
 * Respects reduced motion.
 */

export type DropFile = {
  id: string;
  file: File;
  /** The size shown and checked (the file's own, or a sample's pretend size). */
  size: number;
  status: "uploading" | "done" | "error" | "rejected";
  /** 0 to 1 */
  progress: number;
  error?: string;
  /** A local preview URL, for images. */
  preview?: string;
};

/** A pretend file for the tray. Images get a small generated picture in `color`. */
export type SampleFile = { name: string; type: string; size: number; color?: string };

type Upload = (file: File, ctx: { onProgress: (p: number) => void; signal: AbortSignal }) => Promise<unknown>;

type Props = {
  /** Sends one file. Call onProgress with 0–1; throw (or reject) to show "Upload failed". */
  upload?: Upload;
  /** Like the input's accept: "image/*,.pdf". Empty = anything. */
  accept?: string;
  /** In bytes. Default 10 MB. */
  maxSize?: number;
  /** How many files the list holds. */
  maxFiles?: number;
  multiple?: boolean;
  /** Every change to the list. */
  onChange?: (files: DropFile[]) => void;
  theme?: "light" | "dark";
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  title?: string;
  /** The small line under the title. Default: built from accept and maxSize. */
  hint?: string;
  /** Pretend files on a tray under the zone, to drag in without having real ones. */
  samples?: SampleFile[];
  /** A smaller zone and Bot, no list: the newest upload shows inside the zone, under the Bot. For tight spaces. */
  compact?: boolean;
};

const MB = 1024 * 1024;
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// What the Bot says when you keep feeding it something it can't take (after the plain reason)
const GRUMBLE = [
  "Still too big. I checked twice.",
  "It won't fit in my mouth.",
  "Maybe zip it first?",
  "I'm not opening my mouth for that.",
  "No.",
];

// A pretend upload: uneven steps, so it reads as a network and not a timer
const fakeUpload: Upload = async (file, { onProgress, signal }) => {
  const steps = 10 + Math.round(Math.min(20, file.size / (400 * 1024)));
  for (let i = 1; i <= steps; i++) {
    await wait(70 + Math.random() * 120);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    onProgress(i / steps);
  }
};

export function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${Math.round(n / 1024)} KB`;
  return `${(n / MB).toFixed(n < 100 * MB ? 1 : 0).replace(/\.0$/, "")} MB`;
}

// Keeps the extension: "a-very-long-name-for-a.pdf" → "a-very-long-na….pdf"
function shortName(name: string, max = 30) {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 && name.length - dot <= 6 ? name.slice(dot) : "";
  return name.slice(0, max - ext.length - 1) + "…" + ext;
}

function extOf(name: string, type: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toUpperCase().slice(0, 4) : (type.split("/")[1] ?? "FILE").toUpperCase().slice(0, 4);
}

// The badge colour by kind, from the StackD colours
function badge(name: string, type: string) {
  const e = extOf(name, type);
  if (type === "application/pdf" || e === "PDF") return { bg: "#901919", fg: "#FFFFFF" };
  if (type.startsWith("image/")) return { bg: "#C9B8FF", fg: "#141310" };
  if (type.startsWith("video/") || type.startsWith("audio/")) return { bg: "#BE9344", fg: "#FFFFFF" };
  if (/ZIP|RAR|7Z|GZ|TAR/.test(e)) return { bg: "#6C8544", fg: "#FFFFFF" };
  if (/DOC|DOCX|TXT|MD|RTF|PAGE/.test(e)) return { bg: "#BE9344", fg: "#FFFFFF" };
  return null; // plain: the field colour
}

function accepts(name: string, type: string, accept: string) {
  if (!accept.trim()) return true;
  const n = name.toLowerCase();
  const t = type.toLowerCase();
  return accept.split(",").some((raw) => {
    const a = raw.trim().toLowerCase();
    if (!a) return false;
    if (a.startsWith(".")) return n.endsWith(a);
    if (a.endsWith("/*")) return t.startsWith(a.slice(0, -1));
    return t === a;
  });
}

// "Images, PDF or ZIP · up to 10 MB"
function defaultHint(accept: string, maxSize: number) {
  const kinds = accept
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => (a.endsWith("/*") ? (a === "image/*" ? "Images" : a.slice(0, -2) + " files") : a.replace(/^\./, "").replace(/^.*\//, "").toUpperCase()));
  const list = kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} or ${kinds[kinds.length - 1]}` : kinds[0];
  return `${list ? list + " · " : ""}up to ${formatSize(maxSize)}`;
}

// A small picture for an image sample, so its row gets a real thumbnail
async function samplePicture(color = "#C9B8FF") {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "#141310");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.beginPath();
    g.arc(44, 20, 7, 0, Math.PI * 2);
    g.fill();
  }
  return new Promise<Blob>((r) => c.toBlob((b) => r(b ?? new Blob()), "image/png"));
}

/** The percentage with digits that roll into place, like a counter. */
function Roll({ value }: { value: number }) {
  const s = String(Math.round(value));
  return (
    <span className="inline-flex tabular-nums" aria-label={`${s}%`}>
      {s.split("").map((d, i) => (
        // Keyed from the right, so the ones column stays the ones column as the number grows
        <span key={s.length - i} aria-hidden className="relative inline-block h-[1.25em] w-[1ch] overflow-hidden">
          <span
            className="absolute left-0 top-0 flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateY(${-Number(d) * 1.25}em)` }}
          >
            {"0123456789".split("").map((n) => (
              <span key={n} className="h-[1.25em] leading-[1.25em]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
      <span aria-hidden>%</span>
    </span>
  );
}

export function FileDrop({
  upload = fakeUpload,
  accept = "",
  maxSize = 10 * MB,
  maxFiles = 6,
  multiple = true,
  onChange,
  theme = "light",
  bot,
  title = "Drop files here",
  hint,
  samples,
  compact = false,
}: Props) {
  const dark = theme === "dark";
  const uid = useId().replace(/:/g, "");
  const [items, setItems] = useState<DropFile[]>([]);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [drag, setDrag] = useState<"none" | "page" | "zone">("none");
  const [look, setLook] = useState<{ x: number; y: number } | undefined>(undefined);
  const [mouth, setMouth] = useState(0);
  const [mood, setMood] = useState(0);
  const [happy, setHappy] = useState(false);
  const [hop, setHop] = useState(0);
  const [said, setSaid] = useState("");
  const [refuse, setRefuse] = useState<string | null>(null); // the zone's line while it says no
  const [grumpy, setGrumpy] = useState(false); // after enough tries it won't open its mouth
  const [held, setHeld] = useState<number | null>(null); // the sample being carried
  const [away, setAway] = useState<number[]>([]); // samples on their way down, hidden from the tray
  const [spot, setSpot] = useState<string | null>(null); // compact: the upload shown in the zone

  const card = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const botBox = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLDivElement | null)[]>([]);
  // k: screen pixels per CSS pixel, so a chip follows the pointer even when the card is scaled
  const carry = useRef<{ i: number; x0: number; y0: number; dx: number; dy: number; k: number } | null>(null);
  const depth = useRef(0); // dragenter/leave pairs on the window
  const timers = useRef<number[]>([]);
  const aborts = useRef(new Map<string, AbortController>());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const busy = useRef(false); // eating or saying no: drags don't change the face meanwhile
  const tries = useRef(0); // refusals in a row
  const calm = useRef(0);
  const quiet = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reduced() ? Math.min(ms, 1) : ms));
  };

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(calm.current);
      clearTimeout(quiet.current);
      aborts.current.forEach((a) => a.abort());
      itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    },
    [],
  );

  function update(next: (list: DropFile[]) => DropFile[]) {
    setItems((list) => {
      const out = next(list);
      onChange?.(out);
      return out;
    });
  }
  const patch = (id: string, p: Partial<DropFile>) => update((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i)));

  // Where the Bot should look for a point on the screen
  function lookAt(x: number, y: number) {
    const r = botBox.current?.getBoundingClientRect();
    if (!r) return;
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const far = Math.min(0.8, Math.tanh(d / 160));
    setLook({ x: (dx / d) * far, y: (dy / d) * far });
  }

  // The point the files go into: the Bot's mouth, in screen coordinates
  function mouthPoint() {
    const b = botBox.current?.getBoundingClientRect();
    return b ? { x: b.left + b.width / 2, y: b.top + b.height * 0.68 } : null;
  }

  // Files anywhere over the page: the Bot notices
  useEffect(() => {
    const hasFiles = (e: globalThis.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current++;
      setDrag((d) => (d === "none" ? "page" : d));
    };
    const leave = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDrag("none");
    };
    const over = (e: globalThis.DragEvent) => {
      if (!hasFiles(e) || busy.current) return;
      lookAt(e.clientX, e.clientY);
    };
    const end = () => {
      depth.current = 0;
      setDrag("none");
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", end);
    window.addEventListener("dragend", end);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", end);
      window.removeEventListener("dragend", end);
    };
  }, []);

  // The face follows the drag (unless it's busy eating or saying no). Grumpy: the mouth stays shut.
  useEffect(() => {
    if (busy.current) return;
    setMouth(grumpy ? 0 : drag === "zone" ? 1 : drag === "page" ? 0.3 : 0);
    setMood(grumpy && drag !== "none" ? -0.5 : 0);
    if (drag === "none") setLook(undefined);
  }, [drag, grumpy]);

  // ⌘V / Ctrl+V while the card has focus or the pointer
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const c = card.current;
      if (!c || !(c.matches(":hover") || c.contains(document.activeElement))) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (!files.length) return;
      e.preventDefault();
      take(files.map((file) => ({ file, size: file.size })));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function start(item: DropFile) {
    const ctrl = new AbortController();
    aborts.current.set(item.id, ctrl);
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    setSpot(item.id);
    upload(item.file, { onProgress: (p) => patch(item.id, { progress: Math.min(1, Math.max(0, p)) }), signal: ctrl.signal })
      .then(() => {
        if (ctrl.signal.aborted) return;
        patch(item.id, { status: "done", progress: 1 });
        setSaid(`${item.file.name} uploaded`);
        later(() => setSpot((s) => (s === item.id ? null : s)), 2200);
        // Everything in: a happy moment
        later(() => {
          if (busy.current) return;
          if (itemsRef.current.every((i) => i.status !== "uploading") && itemsRef.current.some((i) => i.status === "done")) {
            setHappy(true);
            later(() => setHappy(false), 1100);
          }
        }, 60);
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        patch(item.id, { status: "error", error: "Upload failed" });
        setSaid(`${item.file.name} failed to upload`);
        if (!busy.current) {
          setMood(-0.4);
          later(() => setMood(0), 1400);
        }
      })
      .finally(() => {
        if (aborts.current.get(item.id) === ctrl) aborts.current.delete(item.id);
      });
  }

  // Saying no: the plain reason first; keep trying and the Bot answers back, then stops opening up
  function refuseWith(reason: string) {
    const n = tries.current++;
    setRefuse(n === 0 ? reason : GRUMBLE[Math.min(n - 1, GRUMBLE.length - 1)]);
    if (!reduced())
      zone.current?.animate(
        [0, -7, 6, -4, 2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
        { duration: 420, easing: "ease-out" },
      );
    if (n >= 3) setGrumpy(true);
    // A new refusal restarts the clock, so an older one can't wipe this line early
    clearTimeout(quiet.current);
    quiet.current = window.setTimeout(() => setRefuse(null), 1900);
    // Leave it alone for a while and it's polite again
    clearTimeout(calm.current);
    calm.current = window.setTimeout(() => {
      tries.current = 0;
      setGrumpy(false);
    }, 8000);
  }

  // New files: check them, feed the Bot, then list and upload them.
  // `from`: where they were let go (the paper flies from there); `flown`: they're already on their way.
  function take(files: { file: File; size: number }[], opts: { from?: { x: number; y: number }; flown?: boolean } = {}) {
    if (!files.length) return;
    const list = multiple ? files : files.slice(0, 1);
    const room = Math.max(0, maxFiles - itemsRef.current.filter((i) => i.status !== "rejected").length);
    let n = 0;
    const fresh: DropFile[] = list.map(({ file, size }, k) => {
      const id = `${uid}-${Date.now().toString(36)}-${k}-${Math.random().toString(36).slice(2, 6)}`;
      const base = { id, file, size, progress: 0, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
      if (!accepts(file.name, file.type, accept)) return { ...base, status: "rejected", error: "This kind of file isn't allowed" };
      if (size > maxSize) return { ...base, status: "rejected", error: `Too large · max ${formatSize(maxSize)}` };
      if (n++ >= room) return { ...base, status: "rejected", error: `Only ${maxFiles} files at a time` };
      return { ...base, status: "uploading" };
    });
    const good = fresh.filter((f) => f.status === "uploading");
    const bad = fresh.filter((f) => f.status === "rejected");
    if (!multiple && good.length) {
      // One file only: the new one replaces the list
      itemsRef.current.forEach((i) => aborts.current.get(i.id)?.abort());
      update(() => []);
    }

    busy.current = true;
    const eat = good.length > 0 && !grumpy;
    if (eat && opts.from) fly(opts.from, good.length);
    setMouth(eat ? 1 : 0);
    // Chew, then swallow
    const chew = eat ? [0.15, 0.75, 0.1, 0.55, 0] : [];
    const t0 = eat && (opts.from || opts.flown) ? 380 : 80;
    chew.forEach((o, i) => later(() => setMouth(o), t0 + i * 105));
    const swallowed = t0 + chew.length * 105;
    // A grumpy Bot won't eat even a good file: it's refused like the rest
    const refusedGood = good.length > 0 && grumpy ? good.map((g) => ({ ...g, status: "rejected" as const, error: "The Bot needs a minute" })) : [];
    const accepted = grumpy ? [] : good;
    later(
      () => {
        // A file that's refused again replaces its earlier refusal, so the list doesn't fill with them
        const outs = [...bad, ...refusedGood];
        const names = new Set(outs.map((b) => b.file.name));
        update((l) => [...l.filter((i) => !(i.status === "rejected" && names.has(i.file.name))), ...accepted, ...outs]);
        accepted.forEach((g) => start(g));
        if (accepted.length) {
          tries.current = 0;
          setGrumpy(false);
          setHop((h) => h + 1);
        }
        setSaid(
          `${accepted.length ? `${accepted.length} file${accepted.length > 1 ? "s" : ""} added` : ""}${accepted.length && outs.length ? ", " : ""}${outs.length ? `${outs.length} not added` : ""}`,
        );
      },
      eat ? swallowed - 160 : 0,
    );

    if (bad.length || refusedGood.length) {
      // Shakes its head: no
      const shakeX = [-0.55, 0.55, -0.45, 0.35, 0];
      const s0 = eat ? swallowed : 0;
      later(() => {
        refuseWith(bad[0]?.error ?? "The Bot needs a minute");
        setMood(-0.7);
      }, s0);
      shakeX.forEach((x, i) => later(() => setLook({ x, y: 0.1 }), s0 + i * 120));
      later(() => {
        setMood(0);
        setLook(undefined);
        busy.current = false;
      }, s0 + shakeX.length * 120 + 500);
    } else {
      later(() => {
        setLook(undefined);
        busy.current = false;
      }, swallowed);
    }
  }

  // Pulled in: slow to leave and faster near the mouth, stretched along the way, gone at the lips
  function suck(el: HTMLElement, dx: number, dy: number, k = 1) {
    const m = mouthPoint();
    const a = el.getBoundingClientRect();
    if (!m || reduced()) return false;
    const tx = dx + (m.x - (a.left + a.width / 2)) / k;
    const ty = dy + (m.y - (a.top + a.height / 2)) / k;
    const ux = Math.abs(tx - dx);
    const uy = Math.abs(ty - dy);
    const squeeze = Math.hypot(ux, uy) < 24 ? "scale(.15)" : uy >= ux ? "scale(.14, .36)" : "scale(.36, .14)";
    el.style.transition = "transform 380ms cubic-bezier(.55,0,.85,.3), opacity 280ms ease-in 100ms";
    el.style.transform = `translate(${tx}px, ${ty}px) ${squeeze}`;
    el.style.opacity = "0";
    return true;
  }

  // The paper for files from the desktop: from the drop point to the mouth, the same pull
  function fly(from: { x: number; y: number }, count: number) {
    const el = flyer.current;
    const c = card.current?.getBoundingClientRect();
    const m = mouthPoint();
    if (!el || !c || !m || reduced()) return;
    const sx = from.x - c.left;
    const sy = from.y - c.top;
    const ex = m.x - c.left;
    const ey = m.y - c.top;
    const squeeze = Math.abs(ey - sy) >= Math.abs(ex - sx) ? "scale(.14, .36)" : "scale(.36, .14)";
    // No quotes in the <style> block (server rendering escapes them), so "no count" = no attribute
    if (count > 1) el.dataset.count = String(count);
    else delete el.dataset.count;
    el.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(1)`, opacity: 1 },
        { transform: `translate(${ex}px, ${ey}px) translate(-50%, -50%) ${squeeze}`, opacity: 0 },
      ],
      { duration: 380, easing: "cubic-bezier(.55,0,.85,.3)" },
    );
  }

  // ── The sample tray: an ordinary pointer drag inside the card ──
  function place(i: number, dx: number, dy: number, lifted: boolean) {
    const el = chips.current[i];
    if (!el) return;
    el.style.transition = lifted ? "none" : "";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${lifted ? 1.06 : 1}) rotate(${lifted ? Math.max(-6, Math.min(6, dx * 0.04)) : 0}deg)`;
  }

  const overZone = (x: number, y: number) => {
    const r = zone.current?.getBoundingClientRect();
    return !!r && x > r.left && x < r.right && y > r.top && y < r.bottom;
  };

  function onChipDown(i: number) {
    return (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || away.includes(i)) return;
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* a scripted pointer */
      }
      const el = e.currentTarget;
      const k = el.getBoundingClientRect().width / el.offsetWidth || 1;
      carry.current = { i, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, k };
      setHeld(i);
      setDrag("page");
      place(i, 0, 0, true);
    };
  }

  function onChipMove(e: PointerEvent<HTMLDivElement>) {
    const g = carry.current;
    if (!g) return;
    g.dx = (e.clientX - g.x0) / g.k;
    g.dy = (e.clientY - g.y0) / g.k;
    place(g.i, g.dx, g.dy, true);
    setDrag(overZone(e.clientX, e.clientY) ? "zone" : "page");
    if (!busy.current) lookAt(e.clientX, e.clientY);
  }

  async function onChipUp(e: PointerEvent<HTMLDivElement>) {
    const g = carry.current;
    carry.current = null;
    setHeld(null);
    setDrag("none");
    if (!g || !samples) return;
    const el = chips.current[g.i];
    const s = samples[g.i];
    if (!el || !overZone(e.clientX, e.clientY)) {
      place(g.i, 0, 0, false); // let go elsewhere: home
      return;
    }
    const fits = !grumpy && s.size <= maxSize && accepts(s.name, s.type, accept);
    if (fits && suck(el, g.dx, g.dy, g.k)) {
      setAway((a) => [...a, g.i]);
      later(() => {
        // Back on the tray unseen, then it pops back in
        el.style.transition = "none";
        el.style.transform = "scale(.6)";
        setAway((a) => a.filter((x) => x !== g.i));
        later(() => {
          el.style.transition = "opacity .25s ease-out, transform .4s cubic-bezier(.3,1.6,.5,1)";
          el.style.opacity = "";
          el.style.transform = "";
        }, 700);
      }, 400);
    } else place(g.i, 0, 0, false); // refused: it springs home while the Bot says no
    take([await sampleFile(s)], { flown: fits });
  }

  async function sampleFile(s: SampleFile) {
    const body = s.type.startsWith("image/") ? await samplePicture(s.color) : new Blob([s.name]);
    return { file: new File([body], s.name, { type: s.type }), size: s.size };
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depth.current = 0;
    setDrag("none");
    take(
      Array.from(e.dataTransfer.files).map((file) => ({ file, size: file.size })),
      { from: { x: e.clientX, y: e.clientY } },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.current?.click();
    }
  }

  function remove(id: string) {
    aborts.current.get(id)?.abort();
    aborts.current.delete(id);
    setLeaving((l) => [...l, id]);
    later(() => {
      const it = itemsRef.current.find((i) => i.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      update((l) => l.filter((i) => i.id !== id));
      setLeaving((l) => l.filter((x) => x !== id));
    }, 200);
  }

  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const field = dark ? "#26241F" : "#F2F2F0";
  const ok = dark ? "#A3BF78" : "#6C8544";
  const bad = dark ? "#E88A86" : "#901919";
  const over = drag === "zone";
  const uploading = items.some((i) => i.status === "uploading");
  const current = spot ? items.find((i) => i.id === spot && i.status !== "rejected") : undefined;

  // While uploading, it watches the list
  const botLook = look ?? (uploading && !busy.current ? { x: 0, y: 0.55 } : undefined);

  return (
    <div
      ref={card}
      data-filedrop=""
      className="relative w-full max-w-[420px] rounded-[28px] p-3"
      style={{
        background: bg,
        color: fg,
        boxShadow: dark ? "0 20px 50px rgba(20,19,16,0.3)" : "0 0 0 1px rgba(20,19,16,0.05), 0 20px 50px rgba(20,19,16,0.1)",
      }}
    >
      <style>{`
        @keyframes fd-hop{0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(2px) scale(1.08,.92)}60%{transform:translateY(-8px) scale(.97,1.03)}}
        @keyframes fd-in{from{opacity:0;transform:translateY(-10px) scale(.96);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
        @keyframes fd-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
        [data-filedrop] [data-fly]::after{content:attr(data-count);position:absolute;right:-7px;top:-7px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;font:600 11px/18px system-ui,sans-serif;text-align:center;background:${fg};color:${bg}}
        [data-filedrop] [data-fly]:not([data-count])::after{display:none}
      `}</style>

      {/* The zone */}
      <div
        ref={zone}
        role="button"
        tabIndex={0}
        aria-label={`${title}. ${hint ?? defaultHint(accept, maxSize)}. Press Enter to browse.`}
        onKeyDown={onKeyDown}
        onClick={() => input.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag("zone");
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (drag !== "zone") setDrag("zone");
        }}
        onDragLeave={(e) => {
          if (!zone.current?.contains(e.relatedTarget as Node)) setDrag(depth.current > 0 ? "page" : "none");
        }}
        onDrop={onDrop}
        className={`relative flex ${compact ? "min-h-[176px] py-5" : "min-h-[232px] py-8"} cursor-pointer flex-col items-center justify-center rounded-[20px] px-6 text-center outline-none transition-[background-color,box-shadow] duration-200 focus-visible:shadow-[0_0_0_2px_currentColor]`}
        style={{
          background: over && !grumpy ? field : drag !== "none" ? (dark ? "#1C1B18" : "#F8F8F6") : "transparent",
        }}
      >
        {/* The edge: an SVG, so the dashes are round and evenly spaced; solid while a file is over it */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <rect
            x="0.75"
            y="0.75"
            rx="19.25"
            fill="none"
            stroke={refuse ? bad : fg}
            strokeOpacity={refuse ? 0.7 : over ? 0.55 : drag === "page" ? 0.35 : 0.18}
            strokeWidth="1.5"
            strokeDasharray={over || refuse ? undefined : "6 7"}
            strokeLinecap="round"
            style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)", transition: "stroke-opacity .2s, stroke .2s" }}
          />
        </svg>
        <div
          key={hop}
          ref={botBox}
          className="origin-bottom motion-reduce:![animation:none]"
          style={{
            animation: hop ? "fd-hop .45s cubic-bezier(.3,.7,.4,1)" : undefined,
            transition: "transform .3s cubic-bezier(.3,1.5,.5,1)",
            transform: over && !grumpy ? "scale(1.08)" : "none",
          }}
        >
          <Bot
            size={compact ? 64 : 80}
            shape={bot?.shape ?? "pill"}
            eyes={bot?.eyes ?? "tall"}
            color={fg}
            eyeColor={bg}
            look={botLook}
            mood={mood}
            mouth={mouth}
            happy={happy}
            within="[data-filedrop]"
          />
        </div>
        {compact && current && !refuse ? (
          <div
            className="mt-3 flex w-full max-w-[300px] items-center gap-3 rounded-[14px] px-3 py-2.5 text-left"
            style={{ background: field, animation: reduced() ? undefined : "fd-in .3s cubic-bezier(.2,.9,.3,1.1) both" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-[9px] font-semibold"
              style={{ background: badge(current.file.name, current.file.type)?.bg ?? bg, color: badge(current.file.name, current.file.type)?.fg ?? fg }}
            >
              {current.preview ? <img src={current.preview} alt="" className="h-full w-full object-cover" /> : extOf(current.file.name, current.file.type)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{shortName(current.file.name, 24)}</p>
              <p className="flex items-center gap-1.5 text-[12px] tabular-nums">
                <span className="opacity-50">{formatSize(current.size)}</span>
                <span className="opacity-30">·</span>
                {current.status === "done" ? (
                  <span style={{ color: ok }}>Uploaded</span>
                ) : current.status === "error" ? (
                  <span style={{ color: bad }}>Failed</span>
                ) : (
                  <span className="opacity-50">
                    <Roll value={current.progress * 100} />
                  </span>
                )}
              </p>
              <div className="mt-1 h-[3px] overflow-hidden rounded-full" style={{ background: bg, opacity: current.status === "uploading" ? 1 : 0, transition: "opacity .5s" }}>
                <div className="h-full origin-left rounded-full transition-transform duration-200 ease-out" style={{ transform: `scaleX(${current.progress})`, background: fg }} />
              </div>
            </div>
            {current.status === "done" ? (
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" stroke={ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4.5 10.5 8 14l7.5-8" pathLength={1} strokeDasharray={1} style={{ animation: reduced() ? undefined : "fd-draw .3s ease-out both" }} />
              </svg>
            ) : current.status === "error" ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  start(current);
                }}
                className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium outline-none focus-visible:shadow-[0_0_0_2px_currentColor]"
                style={{ background: bg }}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : (
          <>
        <p className={`${compact ? "mt-3 text-[15px]" : "mt-4 text-[16px]"} font-semibold tracking-[-0.01em]`} style={{ color: refuse ? bad : undefined }}>
          {refuse ?? (over ? (grumpy ? "Not now" : "Let go to upload") : title)}
        </p>
        <p className="mt-1 text-[13px] opacity-50">{over && !grumpy ? "The Bot will take it from here" : hint ?? defaultHint(accept, maxSize)}</p>
        <p className={`mt-3 hidden text-[12px] opacity-40 ${compact ? "" : "[@media(hover:hover)]:block"}`}>
          or <span className="underline underline-offset-2">browse</span>
          {" · "}⌘V to paste
        </p>
          </>
        )}
        <input
          ref={input}
          type="file"
          hidden
          multiple={multiple}
          accept={accept || undefined}
          onChange={(e) => {
            const r = zone.current?.getBoundingClientRect();
            take(
              Array.from(e.target.files ?? []).map((file) => ({ file, size: file.size })),
              { from: r ? { x: r.left + r.width / 2, y: r.bottom - 10 } : undefined },
            );
            e.target.value = "";
          }}
        />
      </div>

      {/* The sample tray */}
      {samples?.length ? (
        <div className="mt-3 px-1">
          {compact ? null : <p className="mb-2 text-[12px] opacity-45">No files handy? Drag one in.</p>}
          <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
            {samples.map((s, i) => {
              const b = badge(s.name, s.type);
              return (
                <div
                  key={s.name}
                  ref={(el) => {
                    chips.current[i] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.name}, ${formatSize(s.size)}. Drag into the zone, or press Enter.`}
                  onPointerDown={onChipDown(i)}
                  onPointerMove={onChipMove}
                  onPointerUp={onChipUp}
                  onPointerCancel={() => {
                    carry.current = null;
                    setHeld(null);
                    setDrag("none");
                    place(i, 0, 0, false);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    take([await sampleFile(s)]);
                  }}
                  className={`relative flex cursor-grab touch-none select-none items-center rounded-[12px] py-1.5 pl-1.5 outline-none ${compact ? "gap-1.5 pr-2.5" : "gap-2 pr-3"} transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(.3,1.6,.4,1)] focus-visible:shadow-[0_0_0_2px_currentColor] active:cursor-grabbing`}
                  style={{
                    background: field,
                    boxShadow: held === i ? "0 12px 28px rgba(20,19,16,0.18)" : undefined,
                    zIndex: held === i ? 30 : 10,
                    visibility: away.includes(i) ? "hidden" : undefined,
                  }}
                >
                  <span
                    className={`flex items-center justify-center rounded-[8px] font-semibold ${compact ? "h-6 w-6 text-[8px]" : "h-7 w-7 text-[9px]"}`}
                    style={{ background: b?.bg ?? bg, color: b?.fg ?? fg }}
                  >
                    {extOf(s.name, s.type)}
                  </span>
                  <span className={`${compact ? "text-[12px]" : "text-[12.5px]"} font-medium`}>{s.name}</span>
                  <span className={`${compact ? "text-[11px]" : "text-[11.5px]"} tabular-nums opacity-45`}>{formatSize(s.size)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* The files */}
      {items.length && !compact ? (
        <ul className="mt-2 flex flex-col" aria-label="Files">
          {items.map((it) => {
            const b = badge(it.file.name, it.file.type);
            const gone = leaving.includes(it.id);
            const failed = it.status === "error" || it.status === "rejected";
            return (
              <li
                key={it.id}
                className="grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: gone ? "0fr" : "1fr", opacity: gone ? 0 : 1 }}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-3 rounded-[16px] px-2 py-2" style={{ animation: reduced() ? undefined : "fd-in .32s cubic-bezier(.2,.9,.3,1.1) both" }}>
                    {/* Thumbnail or type badge */}
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-[10px] font-semibold tracking-[0.02em]"
                      style={{ background: b?.bg ?? field, color: b?.fg ?? fg, opacity: it.status === "rejected" ? 0.5 : 1 }}
                    >
                      {it.preview && it.status !== "rejected" ? <img src={it.preview} alt="" className="h-full w-full object-cover" /> : extOf(it.file.name, it.file.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium" style={{ opacity: it.status === "rejected" ? 0.55 : 1 }} title={it.file.name}>
                        {shortName(it.file.name)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] tabular-nums">
                        {failed ? (
                          <span style={{ color: bad }}>{it.error}</span>
                        ) : (
                          <>
                            <span className="opacity-50">{formatSize(it.size)}</span>
                            <span className="opacity-30">·</span>
                            {it.status === "done" ? (
                              <span style={{ color: ok }}>Uploaded</span>
                            ) : (
                              <span className="opacity-50">
                                <Roll value={it.progress * 100} />
                              </span>
                            )}
                          </>
                        )}
                      </p>
                      {/* Progress: fills, then turns green and fades */}
                      <div
                        className="mt-1.5 h-[3px] overflow-hidden rounded-full transition-opacity duration-500"
                        style={{ background: field, opacity: it.status === "uploading" ? 1 : 0 }}
                        role="progressbar"
                        aria-label={`Uploading ${it.file.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(it.progress * 100)}
                        hidden={it.status === "rejected"}
                      >
                        <div
                          className="h-full origin-left rounded-full transition-[transform,background-color] duration-200 ease-out"
                          style={{ transform: `scaleX(${it.progress})`, background: it.status === "done" ? ok : fg }}
                        />
                      </div>
                    </div>

                    {/* Retry and remove / cancel */}
                    <div className="flex shrink-0 items-center gap-1">
                      {it.status === "error" ? (
                        <button
                          type="button"
                          onClick={() => start(it)}
                          className="flex h-8 items-center rounded-full px-3 text-[12.5px] font-medium outline-none transition-colors focus-visible:shadow-[0_0_0_2px_currentColor]"
                          style={{ background: field }}
                        >
                          Retry
                        </button>
                      ) : null}
                      {it.status === "done" ? (
                        <span className="flex h-8 w-8 items-center justify-center" aria-hidden>
                          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke={ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4.5 10.5 8 14l7.5-8" pathLength={1} strokeDasharray={1} style={{ animation: reduced() ? undefined : "fd-draw .3s ease-out both" }} />
                          </svg>
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        aria-label={it.status === "uploading" ? `Cancel ${it.file.name}` : `Remove ${it.file.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full opacity-45 outline-none transition-[opacity,background-color] hover:opacity-100 focus-visible:opacity-100 focus-visible:shadow-[0_0_0_2px_currentColor]"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* The paper that's pulled into the Bot's mouth (for files from the desktop) */}
      <div
        ref={flyer}
        data-fly=""
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[38px] w-[30px] rounded-[6px] opacity-0"
        style={{ background: bg, boxShadow: `0 0 0 1.5px ${fg}, 0 6px 16px rgba(20,19,16,0.18)` }}
      >
        <span className="absolute left-[6px] right-[6px] top-[9px] h-[2px] rounded-full" style={{ background: fg, opacity: 0.35 }} />
        <span className="absolute left-[6px] right-[10px] top-[15px] h-[2px] rounded-full" style={{ background: fg, opacity: 0.35 }} />
        <span className="absolute left-[6px] right-[8px] top-[21px] h-[2px] rounded-full" style={{ background: fg, opacity: 0.35 }} />
      </div>

      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
