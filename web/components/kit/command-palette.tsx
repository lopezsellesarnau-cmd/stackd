'use client'

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Bot } from "./bot";

/**
 * Command palette · StackD Kit 12
 * The ⌘K menu: press ⌘K (Ctrl+K on Windows) anywhere, type, hit Enter.
 * Fuzzy search that forgives typos in order ("nwprj" finds "New project") and highlights the
 * letters it matched. Results in groups, the last few you ran on top, shortcuts on the right.
 * Items can open a page of their own (Theme → Light / Dark / System); Backspace or Esc goes back.
 * The panel grows and shrinks smoothly with the results, and the selection slides between rows.
 * The Bot (Kit 01) is the search icon: it looks at the row you're on, looks sad when nothing
 * matches and smiles when a command runs.
 * As a modal (the default) or inline. White and black versions, any accent colour.
 * React + Tailwind, no other dependencies (uses the Bot from Kit 01). Respects reduced motion.
 */

export type CommandItem = {
  id: string;
  label: string;
  /** The heading it's listed under. */
  group?: string;
  icon?: ReactNode;
  /** Other words that should find it ("dark" for Theme). */
  keywords?: string[];
  /** Keys shown on the right, e.g. ["⌘", "N"]. Display only. */
  shortcut?: string[];
  /** A short, quiet note after the label. */
  hint?: string;
  onSelect?: () => void;
  /** A page of its own: picking the item opens these. */
  children?: CommandItem[];
  /** The search box's placeholder on that page. */
  placeholder?: string;
};

type Props = {
  items: CommandItem[];
  /** Controlled. Leave it out and ⌘K opens and closes it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called for every command that runs (after the item's own onSelect). */
  onSelect?: (item: CommandItem) => void;
  /** A dialog over the page (default), or a panel that sits in the layout and is always open. */
  modal?: boolean;
  /** The key that goes with ⌘/Ctrl. false = no shortcut. */
  hotkey?: string | false;
  theme?: "light" | "dark";
  /** The colour of the matched letters. */
  color?: string;
  /** The Bot's body and eyes (Kit 01). Its colours follow the theme. */
  bot?: Pick<ComponentProps<typeof Bot>, "shape" | "eyes">;
  placeholder?: string;
  /** How many recent commands to show on top. 0 = none. */
  recents?: number;
  "aria-label"?: string;
};

type Hit = { item: CommandItem; hits: number[]; parent?: CommandItem; score: number };
type Row = { head: string } | Hit;

const MAX_H = 352; // the list scrolls past this
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWordStart = (t: string, i: number) => i === 0 || /[\s\-_/.]/.test(t[i - 1]);

/**
 * Fuzzy match. A plain substring wins (more if it starts a word); otherwise the letters must
 * appear in order, with points for word starts and for letters that come in a row.
 */
function fuzzy(text: string, query: string): { score: number; hits: number[] } | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return { score: 0, hits: [] };
  const at = t.indexOf(q);
  if (at >= 0) {
    const hits = Array.from({ length: q.length }, (_, k) => at + k).filter((i) => t[i] !== " ");
    return { score: 100 + (isWordStart(t, at) ? 50 : 0) - at - t.length * 0.1, hits };
  }
  const hits: number[] = [];
  let from = 0;
  let score = 0;
  for (const ch of q.replace(/\s+/g, "")) {
    let i = t.indexOf(ch, from);
    if (i < 0) return null;
    // A word start a little further on beats a letter in the middle of a word
    for (let j = i; j >= 0 && j < Math.min(t.length, i + 12); j = t.indexOf(ch, j + 1)) {
      if (isWordStart(t, j)) {
        i = j;
        break;
      }
    }
    score += i === hits[hits.length - 1] + 1 ? 6 : isWordStart(t, i) ? 8 : 1;
    hits.push(i);
    from = i + 1;
  }
  return { score: score - t.length * 0.1, hits };
}

// Every item with the page it lives on, so the search reaches inside pages too
function flatten(items: CommandItem[], parent?: CommandItem): { item: CommandItem; parent?: CommandItem }[] {
  return items.flatMap((item) => [{ item, parent }, ...(item.children ? flatten(item.children, item) : [])]);
}

export function CommandPalette({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  modal = true,
  hotkey = "k",
  theme = "light",
  color,
  bot,
  placeholder = "Search or jump to…",
  recents: maxRecents = 3,
  "aria-label": ariaLabel = "Command menu",
}: Props) {
  const dark = theme === "dark";
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = !modal || (open ?? own);
  const [mounted, setMounted] = useState(isOpen);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<CommandItem[]>([]);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [ran, setRan] = useState<string | null>(null); // the row that just ran: check mark + happy Bot
  const [typing, setTyping] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const uid = useId().replace(/:/g, "");
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const snap = useRef(true); // the next pill move jumps instead of sliding
  const typingTimer = useRef(0);
  const lastActive = useRef(-1);
  const returnFocus = useRef<HTMLElement | null>(null);

  const page = pages[pages.length - 1];

  function setOpen(v: boolean) {
    if (!modal) return;
    if (open === undefined) setOwn(v);
    onOpenChange?.(v);
  }

  // What the list shows: headings and items
  const rows = useMemo<Row[]>(() => {
    const scope = page ? page.children ?? [] : items;
    if (query.trim()) {
      const pool = page ? scope.map((item) => ({ item, parent: undefined as CommandItem | undefined })) : flatten(items);
      const found: Hit[] = [];
      for (const { item, parent } of pool) {
        const m = fuzzy(item.label, query);
        // Keywords and the page's name count too, a little less, and highlight nothing
        const k = [...(item.keywords ?? []), parent?.label ?? ""]
          .map((w) => fuzzy(w, query))
          .reduce((a, b) => (b && (!a || b.score > a.score) ? b : a), null as ReturnType<typeof fuzzy>);
        if (m) found.push({ item, parent, hits: m.hits, score: m.score - (parent ? 4 : 0) });
        else if (k) found.push({ item, parent, hits: [], score: k.score * 0.6 - (parent ? 4 : 0) });
      }
      return found.sort((a, b) => b.score - a.score).slice(0, 40);
    }
    const out: Row[] = [];
    if (!page && maxRecents > 0) {
      const all = flatten(items);
      const last = recent.map((id) => all.find((x) => x.item.id === id)).filter(Boolean) as { item: CommandItem; parent?: CommandItem }[];
      if (last.length) out.push({ head: "Recent" }, ...last.slice(0, maxRecents).map((x) => ({ ...x, hits: [], score: 0 })));
    }
    const groups: string[] = [];
    scope.forEach((i) => !groups.includes(i.group ?? "") && groups.push(i.group ?? ""));
    for (const g of groups) {
      if (g) out.push({ head: g });
      out.push(...scope.filter((i) => (i.group ?? "") === g).map((item) => ({ item, hits: [], score: 0 })));
    }
    return out;
  }, [items, page, query, recent, maxRecents]);

  const options = rows.filter((r): r is Hit => "item" in r);
  const cur = Math.min(active, Math.max(0, options.length - 1));
  const empty = options.length === 0;

  // New results or a new page: back to the top, and the selection jumps there
  useEffect(() => {
    setActive(0);
    snap.current = true;
    scroller.current?.scrollTo({ top: 0 });
  }, [query, page]);

  // ⌘K / Ctrl+K anywhere
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault();
        if (!modal) input.current?.focus();
        else setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkey, isOpen, modal, open]);

  // Opening and closing: stays mounted until the closing animation ends
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const p = panel.current;
    const s = shade.current;
    if (!p || reduced()) {
      setMounted(false);
      return;
    }
    const ease = "cubic-bezier(.4,0,1,1)";
    s?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: ease, fill: "forwards" });
    const a = p.animate(
      [
        { opacity: 1, transform: "scale(1)", filter: "blur(0)" },
        { opacity: 0, transform: "scale(.97)", filter: "blur(4px)" },
      ],
      { duration: 160, easing: ease, fill: "forwards" },
    );
    a.onfinish = () => setMounted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!mounted || !isOpen) return;
    if (modal) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      if (!reduced()) {
        shade.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
        panel.current?.animate(
          [
            { opacity: 0, transform: "scale(.96) translateY(-6px)", filter: "blur(6px)" },
            { opacity: 1, transform: "scale(1) translateY(0)", filter: "blur(0)" },
          ],
          { duration: 260, easing: "cubic-bezier(.2,.9,.3,1.15)" },
        );
      }
      input.current?.focus();
      const html = document.documentElement;
      const was = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = was;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isOpen]);

  // Reset once it's gone, and give the focus back
  useEffect(() => {
    if (mounted || !modal) return;
    setQuery("");
    setPages([]);
    setRan(null);
    returnFocus.current?.focus?.();
  }, [mounted, modal]);

  // The list's height follows its content, so the panel grows and shrinks
  useLayoutEffect(() => {
    const c = content.current;
    if (!c) return;
    const ro = new ResizeObserver(() => setHeight(Math.min(MAX_H, c.offsetHeight)));
    ro.observe(c);
    return () => ro.disconnect();
  }, [mounted]);

  // The selection: one pill that slides to the active row
  useLayoutEffect(() => {
    const el = rowEls.current[cur];
    const p = pill.current;
    if (!p) return;
    if (!el) {
      p.style.opacity = "0";
      return;
    }
    const jump = snap.current || reduced();
    p.style.transition = jump ? "none" : "";
    p.style.opacity = "1";
    p.style.transform = `translateY(${el.offsetTop}px)`;
    p.style.height = `${el.offsetHeight}px`;
    if (jump) {
      void p.offsetHeight; // apply before turning the transition back on
      p.style.transition = "";
      snap.current = false;
    }
    // Keep it in view, scrolling only the list (never the page), and only when it moved
    const sc = scroller.current;
    if (sc && lastActive.current !== cur) {
      const sr = sc.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      if (er.top < sr.top + 8) sc.scrollTop -= sr.top + 8 - er.top;
      else if (er.bottom > sr.bottom - 8) sc.scrollTop += er.bottom - sr.bottom + 8;
    }
    lastActive.current = cur;
  });

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  function run(hit: Hit) {
    const { item } = hit;
    if (item.children) {
      setPages((p) => [...p, item]);
      setQuery("");
      return;
    }
    setRecent((r) => [item.id, ...r.filter((x) => x !== item.id)].slice(0, 8));
    setRan(item.id);
    item.onSelect?.();
    onSelect?.(item);
    // A beat to see the check and the Bot smile, then close (or reset when inline)
    window.setTimeout(() => {
      setRan(null);
      if (modal) setOpen(false);
      else {
        setQuery("");
        setPages([]);
      }
    }, reduced() ? 0 : 420);
  }

  function back() {
    setPages((p) => p.slice(0, -1));
    setQuery("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const n = options.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      if (!n) return;
      e.preventDefault();
      setActive(
        e.key === "ArrowDown" ? (cur + 1) % n : e.key === "ArrowUp" ? (cur - 1 + n) % n : e.key === "Home" ? 0 : n - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[cur] && !ran) run(options[cur]);
    } else if (e.key === "Escape") {
      // Inline with nothing to undo: let Esc through (it may close a dialog around it)
      if (!query && !page && !modal) return;
      e.preventDefault();
      if (query) setQuery("");
      else if (page) back();
      else setOpen(false);
    } else if (e.key === "Backspace" && !query && page) {
      e.preventDefault();
      back();
    }
  }

  function onType(v: string) {
    setQuery(v);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 500);
  }

  if (!mounted) return null;

  const fg = dark ? "#FFFFFF" : "#141310";
  const bg = dark ? "#141310" : "#FFFFFF";
  const field = dark ? "#26241F" : "#F2F2F0";
  const accent = color ?? (dark ? "#E88A86" : "#901919");

  // Where the Bot looks: at the text while you type, down at the row you're on, down and sad on nothing
  const rowTop = rowEls.current[cur]?.offsetTop ?? 0;
  const seen = (rowTop - (scroller.current?.scrollTop ?? 0)) / MAX_H;
  const look = empty
    ? { x: 0, y: 0.6 }
    : typing
      ? { x: 0.7, y: 0.05 }
      : { x: 0.35, y: Math.max(0.15, Math.min(0.75, 0.2 + seen * 0.7)) };

  const label = (h: Hit) => {
    const t = h.item.label;
    if (!h.hits.length) return t;
    const set = new Set(h.hits);
    return Array.from(t).map((ch, i) =>
      set.has(i) ? (
        <span key={i} style={{ color: accent }}>
          {ch}
        </span>
      ) : (
        ch
      ),
    );
  };

  let o = -1; // option index while rendering rows

  const box = (
    <div
      ref={panel}
      role={modal ? "dialog" : undefined}
      aria-modal={modal || undefined}
      aria-label={ariaLabel}
      className="w-full max-w-[600px] overflow-hidden rounded-[22px]"
      style={{
        background: bg,
        color: fg,
        boxShadow: dark
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.45)"
          : "0 0 0 1px rgba(20,19,16,0.06), 0 30px 80px rgba(20,19,16,0.18)",
      }}
    >
      {/* Search: the Bot, the page you're on, the input */}
      <div className="flex h-[60px] items-center gap-3 px-4" style={{ boxShadow: `inset 0 -1px 0 ${dark ? "rgba(255,255,255,0.08)" : "rgba(20,19,16,0.07)"}` }}>
        <div className="shrink-0" style={{ transition: "transform .3s cubic-bezier(.3,1.6,.5,1)", transform: ran ? "translateY(-2px) scale(1.08)" : "none" }}>
          <Bot
            size={30}
            shape={bot?.shape ?? "circle"}
            eyes={bot?.eyes ?? "tall"}
            color={fg}
            eyeColor={bg}
            look={look}
            mood={empty ? -0.6 : 0}
            happy={!!ran}
          />
        </div>
        {page ? (
          <button
            type="button"
            onClick={back}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full pl-2 pr-2.5 text-[13px] font-medium outline-none focus-visible:shadow-[0_0_0_2px_currentColor]"
            style={{ background: field }}
            aria-label={`Back from ${page.label}`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4 6 8l4 4" />
            </svg>
            {page.label}
          </button>
        ) : null}
        <input
          ref={input}
          value={query}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={page?.placeholder ?? (page ? `Search ${page.label.toLowerCase()}…` : placeholder)}
          role="combobox"
          aria-expanded
          aria-controls={`${uid}-list`}
          aria-activedescendant={options[cur] ? `${uid}-o${cur}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-40"
          style={{ color: fg }}
        />
        {modal ? (
          <kbd className="hidden h-6 shrink-0 items-center rounded-md px-1.5 font-sans text-[11.5px] opacity-50 sm:flex" style={{ background: field }}>
            esc
          </kbd>
        ) : null}
      </div>

      {/* Results. The outer box animates to the inner one's height */}
      <div
        ref={scroller}
        id={`${uid}-list`}
        role="listbox"
        aria-label="Results"
        className="overflow-y-auto overscroll-contain transition-[height] duration-[260ms] ease-[cubic-bezier(.2,.9,.3,1)] motion-reduce:transition-none"
        style={{ height, scrollbarWidth: "thin" }}
      >
        <div ref={content} className="relative px-2 py-2">
          <div
            ref={pill}
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-0 rounded-[12px] transition-[transform,height] duration-[180ms] ease-[cubic-bezier(.25,1.25,.5,1)]"
            style={{ background: field, opacity: 0 }}
          />
          {empty ? (
            <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
              <p className="text-[14.5px] font-medium">No results</p>
              <p className="text-[13.5px] opacity-50">Nothing matches “{query.trim()}”. Try another word.</p>
            </div>
          ) : (
            rows.map((r, i) => {
              if ("head" in r)
                return (
                  <div key={`h${i}`} role="presentation" className="px-3 pb-1.5 pt-3 text-[12px] font-medium opacity-45 first:pt-1.5">
                    {r.head}
                  </div>
                );
              const k = ++o;
              const on = k === cur;
              const done = ran === r.item.id;
              return (
                <div
                  key={`${r.item.id}-${i}`}
                  id={`${uid}-o${k}`}
                  ref={(el) => {
                    rowEls.current[k] = el;
                  }}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => k !== cur && setActive(k)}
                  onClick={() => !ran && run(r)}
                  className="relative flex h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[14.5px]"
                >
                  {r.item.icon ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center transition-opacity [&_svg]:h-[18px] [&_svg]:w-[18px]" style={{ opacity: on ? 1 : 0.55 }}>
                      {r.item.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">
                    {r.parent ? <span className="opacity-45">{r.parent.label} › </span> : null}
                    {label(r)}
                    {r.item.hint ? <span className="ml-2 opacity-40">{r.item.hint}</span> : null}
                  </span>
                  {done ? (
                    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 10.5 8 14l7.5-8" pathLength={1} strokeDasharray={1} style={{ animation: reduced() ? undefined : "cp-draw .3s ease-out both" }} />
                    </svg>
                  ) : r.item.children ? (
                    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 4 4 4-4 4" />
                    </svg>
                  ) : r.item.shortcut ? (
                    <span className="flex shrink-0 gap-1">
                      {r.item.shortcut.map((s, j) => (
                        <kbd
                          key={j}
                          className="flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-sans text-[12px] transition-colors"
                          style={{ background: on ? bg : field, opacity: 0.75 }}
                        >
                          {s}
                        </kbd>
                      ))}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Key hints */}
      <div
        className="hidden h-11 items-center gap-4 px-4 text-[12px] sm:flex"
        style={{ boxShadow: `inset 0 1px 0 ${dark ? "rgba(255,255,255,0.08)" : "rgba(20,19,16,0.07)"}` }}
      >
        {[
          [["↑", "↓"], "Move"],
          [["↵"], options[cur]?.item.children ? "Open" : "Run"],
          [[page ? "⌫" : "esc"], page ? "Back" : modal ? "Close" : "Clear"],
        ].map(([keys, what]) => (
          <span key={what as string} className="flex items-center gap-1.5 opacity-50">
            {(keys as string[]).map((k) => (
              <kbd key={k} className="flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 font-sans text-[11px]" style={{ background: field }}>
                {k}
              </kbd>
            ))}
            {what as string}
          </span>
        ))}
      </div>
      <style>{`@keyframes cp-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`}</style>
    </div>
  );

  if (!modal) return box;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]">
      <div
        ref={shade}
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ background: "rgba(20,19,16,0.28)" }}
        onPointerDown={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative flex w-full justify-center">{box}</div>
    </div>
  );
}
