'use client'

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Bot } from "./bot";

/**
 * AI prompt bar · StackD Kit 02
 * A chat input for AI products: it grows as you write, takes files (button or drop),
 * lets you pick a model, shows a "thinking" shimmer and streams the answer in word by word.
 * While it answers, Send becomes Stop.
 * With `bot`, the Bot from Kit 01 sits in the bar as the assistant's face: it reads what you
 * type, looks up while thinking, watches the answer come in and smiles when it is done.
 * React + Tailwind, no other dependencies. Plug your AI in with `onSend`.
 */

export type PromptContext = {
  files: File[];
  model: string;
  signal: AbortSignal;
};

type Props = {
  /** Your AI. Return the answer as a string, or stream it as an async iterable of text chunks. */
  onSend?: (
    prompt: string,
    ctx: PromptContext,
  ) => Promise<string> | AsyncIterable<string>;
  models?: string[];
  placeholder?: string;
  /** Show the Bot (Kit 01) in the bar. `true`, or its options: shape, eyes, colours. */
  bot?: boolean | Omit<ComponentProps<typeof Bot>, "size" | "look" | "happy">;
  /** A small version for tight spaces: no attachments or model menu, a shorter conversation. */
  compact?: boolean;
};

type Message = {
  role: "user" | "ai";
  text: string;
  files?: string[];
  done?: boolean;
};

export function PromptBar({
  onSend = demoAnswer,
  models = ["Fast", "Smart", "Deep"],
  placeholder = "Ask anything",
  bot,
  compact = false,
}: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState(models[0]);
  const [menu, setMenu] = useState(false);
  const [drag, setDrag] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [smile, setSmile] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const stop = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  // The field grows with the text, up to a point
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  // Keep the latest words in view
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [thread]);

  // The model menu closes on a click outside or Escape
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) =>
      !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: globalThis.KeyboardEvent) =>
      e.key === "Escape" && setMenu(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const addFiles = (list: FileList | null) =>
    list && setFiles((f) => [...f, ...Array.from(list)].slice(0, 6));

  const send = async () => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    const sent = files;
    setThread((t) => [
      ...t,
      { role: "user", text: prompt, files: sent.map((f) => f.name) },
      { role: "ai", text: "" },
    ]);
    setText("");
    setFiles([]);
    setBusy(true);
    const ctrl = new AbortController();
    stop.current = ctrl;
    // Write into the last message, the answer being written
    const write = (fn: (m: Message) => Message) =>
      setThread((t) => [...t.slice(0, -1), fn(t[t.length - 1])]);
    try {
      const out = onSend(prompt, { files: sent, model, signal: ctrl.signal });
      if (typeof out === "object" && out && Symbol.asyncIterator in out) {
        for await (const chunk of out as AsyncIterable<string>) {
          if (ctrl.signal.aborted) break;
          write((m) => ({ ...m, text: m.text + chunk }));
        }
      } else {
        const full = await out;
        write((m) => ({ ...m, text: full }));
      }
    } catch {
      if (!ctrl.signal.aborted)
        write((m) => ({
          ...m,
          text: m.text || "Something went wrong. Try again.",
        }));
    }
    write((m) => ({ ...m, done: true }));
    setBusy(false);
    // A short smile when the answer is in
    setSmile(true);
    window.setTimeout(() => setSmile(false), 1600);
    input.current?.focus();
  };

  // Where the bot looks. It sits left of the bar: the text is to its right, the answers above.
  const last = thread[thread.length - 1];
  const look =
    busy && last && !last.text
      ? { x: -0.3, y: -0.75 } // thinking
      : busy
        ? { x: 0.35, y: -0.7 } // watching the answer come in
        : focused && text
          ? { x: 0.5, y: -0.1 } // reading what you type
          : undefined; // following the cursor

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`flex w-full max-w-[640px] flex-col text-ink ${compact ? "gap-3 text-[13px] leading-[1.45]" : "gap-4 text-[14px] leading-[1.5]"}`}
    >
      {/* The conversation */}
      {thread.length ? (
        <div
          className={`flex flex-col gap-3 overflow-y-auto px-1 ${compact ? "max-h-[112px]" : "max-h-[360px]"}`}
          aria-live="polite"
        >
          {thread.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="ml-auto max-w-[80%] rounded-[18px] bg-ink/[0.06] px-4 py-2.5"
              >
                {m.files?.length ? (
                  <p className="mb-1 text-[12px] text-ink/50">
                    {m.files.join(", ")}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="max-w-[90%] px-1">
                {m.text ? (
                  <p className="whitespace-pre-wrap">
                    {m.text}
                    {!m.done ? (
                      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink/60" />
                    ) : null}
                  </p>
                ) : (
                  <p className="animate-shimmer bg-[linear-gradient(90deg,rgba(17,17,17,.35)_0%,rgba(17,17,17,.9)_50%,rgba(17,17,17,.35)_100%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:text-ink/50">
                    Thinking
                  </p>
                )}
              </div>
            ),
          )}
          <div ref={end} />
        </div>
      ) : null}

      {/* The bar, with the bot beside it */}
      <div className="flex items-end gap-3">
        {bot ? (
          <span className="mb-1 shrink-0">
            <Bot
              size={compact ? 36 : 48}
              shape="pill"
              eyes="tall"
              {...(bot === true ? {} : bot)}
              look={look}
              happy={smile}
            />
          </span>
        ) : null}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`min-w-0 flex-1 rounded-[24px] bg-paper p-2 shadow-[0_0_0_1px_rgba(17,17,17,0.08),0_8px_24px_-12px_rgba(17,17,17,0.18)] transition-shadow ${
            drag
              ? "shadow-[0_0_0_2px_rgba(17,17,17,0.6)]"
              : "focus-within:shadow-[0_0_0_1px_rgba(17,17,17,0.22),0_8px_24px_-12px_rgba(17,17,17,0.18)]"
          }`}
        >
          {files.length ? (
            <ul className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 rounded-full bg-ink/[0.06] py-1 pl-3 pr-1 text-[12px]"
                >
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <span className="text-ink/40">{size(f.size)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((all) => all.filter((_, j) => j !== i))
                    }
                    aria-label={`Remove ${f.name}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <label htmlFor="prompt-input" className="sr-only">
            Message
          </label>
          <textarea
            id="prompt-input"
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={drag ? "Drop files to attach" : placeholder}
            className={`block w-full resize-none bg-transparent py-2 pl-3 outline-none placeholder:text-ink/40 ${compact ? "pr-11" : "pr-3"}`}
          />

          {/* In the compact bar, Send sits on the same line as the text */}
          <div
            className={`flex items-center justify-between gap-2 ${compact ? "pointer-events-none -mt-10 [&_button]:pointer-events-auto" : "pt-1"}`}
          >
            <div className="flex items-center gap-1">
              <input
                ref={picker}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => (
                  addFiles(e.target.files),
                  (e.target.value = "")
                )}
              />
              <button
                type="button"
                onClick={() => picker.current?.click()}
                aria-label="Attach files"
                className={`${compact ? "hidden" : "flex"} h-8 w-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink`}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </button>

              <div ref={menuRef} className={compact ? "hidden" : "relative"}>
                <button
                  type="button"
                  onClick={() => setMenu((m) => !m)}
                  aria-haspopup="listbox"
                  aria-expanded={menu}
                  className="flex h-8 items-center gap-1 rounded-full px-3 text-[13px] text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  {model}
                  <svg
                    viewBox="0 0 12 12"
                    className={`h-3 w-3 transition-transform ${menu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                </button>
                {menu ? (
                  <ul
                    role="listbox"
                    aria-label="Model"
                    className="absolute bottom-full left-0 mb-2 min-w-[140px] rounded-[14px] bg-paper p-1 shadow-[0_0_0_1px_rgba(17,17,17,0.08),0_12px_32px_-12px_rgba(17,17,17,0.25)]"
                  >
                    {models.map((m) => (
                      <li key={m}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={m === model}
                          onClick={() => {
                            setModel(m);
                            setMenu(false);
                          }}
                          className="flex w-full items-center justify-between rounded-[10px] px-3 py-1.5 text-left text-[13px] hover:bg-ink/[0.05]"
                        >
                          {m}
                          {m === model ? (
                            <span className="text-ink/50">✓</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {busy ? (
              <button
                type="button"
                onClick={() => stop.current?.abort()}
                aria-label="Stop"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85"
              >
                <span className="h-2.5 w-2.5 rounded-[2px] bg-paper" />
              </button>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={!text.trim()}
                aria-label="Send"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85 disabled:opacity-20"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 16V4M5 9l5-5 5 5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const size = (b: number) =>
  b < 1024
    ? `${b} B`
    : b < 1024 ** 2
      ? `${Math.round(b / 1024)} KB`
      : `${(b / 1024 ** 2).toFixed(1)} MB`;

/* ── The demo answer: made up, streamed word by word. Replace with your AI via onSend. ── */
const ANSWERS = [
  "Here is a short plan. Start with the smallest version that works, show it to five people, and only then add the second feature. Most of what slows a launch down is building things nobody asked for yet.",
  "Good question. The quick answer is yes, but it depends on how often the data changes. If it changes every few seconds, keep it in memory. If it changes once a day, a simple cache is enough.",
  "I read it. The idea is clear, but the first paragraph tries to say three things at once. Pick the one that matters most, put it first, and move the other two further down.",
];
let turn = 0;

async function* demoAnswer(
  _: string,
  { signal, files }: PromptContext,
): AsyncIterable<string> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await wait(1100); // thinking
  const intro = files.length
    ? `I looked at ${files.length === 1 ? "your file" : `your ${files.length} files`}. `
    : "";
  const words = (intro + ANSWERS[turn++ % ANSWERS.length]).split(" ");
  for (const w of words) {
    if (signal.aborted) return;
    yield (w === words[0] ? "" : " ") + w;
    await wait(35 + Math.random() * 45);
  }
}
