'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Bot, type BotEyes, type BotShape } from './bot'

/**
 * Bot chat · StackD Kit
 * A small chat where the Bot is the one you talk to, and you can see it listen. While you type it watches the field,
 * following your words along. Send, and it looks up while it thinks (three dots bounce like jelly), then its mouth
 * moves as the answer comes in word by word, and its face takes the answer's mood: glad, sorry or curious.
 * The bubbles spring in from their corner. Suggestions to start with, Enter to send.
 *
 * Plug in your own answers with onSend (a string, or { text, mood }, or a Promise of either): an LLM, a FAQ, anything.
 * React + Tailwind, needs the Bot (Kit 01). Respects reduced motion.
 */

export type BotReply = string | { text: string; mood?: number }
export type ChatMessage = { id: number; from: 'you' | 'bot'; text: string; at?: number }

type Props = {
  /** Your answers. Gets the message and the chat so far; return a reply or a Promise of one. */
  onSend?: (text: string, history: ChatMessage[]) => BotReply | Promise<BotReply>
  /** The Bot's name, in the header. */
  name?: string
  /** The line under the name when it's waiting. */
  status?: string
  /** The Bot's first message. */
  greeting?: string
  /** A conversation to start from (after the greeting), for a saved chat or a mock-up. */
  initial?: { from: 'you' | 'bot'; text: string }[]
  /** Text already in the field, as if someone were typing. */
  draft?: string
  /** Chips to start with; they go once you've written. */
  suggestions?: string[]
  placeholder?: string
  shape?: BotShape
  eyes?: BotEyes
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  className?: string
}

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif'
const THEMES = {
  light: { card: '#FFFFFF', ink: '#141310', soft: '#F3F2F0', line: 'rgba(20,19,16,0.09)', mute: 'rgba(20,19,16,0.45)', live: '#6C8544' },
  dark: { card: '#141310', ink: '#F2F0EC', soft: '#22211E', line: 'rgba(242,240,236,0.11)', mute: 'rgba(242,240,236,0.45)', live: '#8FAE5E' },
}

// A guess at how an answer feels, when it doesn't say: glad, sorry, or in between
const moodOf = (text: string) => {
  const t = text.toLowerCase()
  if (/\b(sorry|unfortunately|can't|cannot|afraid|not able)\b/.test(t)) return -0.6
  if (/!|\b(great|love|glad|happy|awesome|perfect|yes|sure|of course)\b/.test(t)) return 0.9
  return 0.25
}

// The demo's answers, when there's no onSend
const DEMO: Record<string, BotReply> = {
  hello: { text: "Hi! I'm the Bot. Ask me anything about this chat, I'm all eyes.", mood: 1 },
  price: { text: "I'm free! Copy me into your project and plug your own answers into onSend.", mood: 0.9 },
  weather: { text: "Sorry, I can't see outside this card. But I can watch you type!", mood: -0.5 },
  how: { text: 'I watch the field while you write, look up while I think, and my face follows the mood of what I say.', mood: 0.4 },
}
const demoReply = (text: string): BotReply => {
  const t = text.toLowerCase()
  if (/\b(hi|hello|hey|hola)\b/.test(t)) return DEMO.hello
  if (/price|cost|free|pay/.test(t)) return DEMO.price
  if (/weather|rain|sun/.test(t)) return DEMO.weather
  if (/how|work|what/.test(t)) return DEMO.how
  return { text: 'Good question! Plug me into your own answers and I will have a better one.', mood: 0.7 }
}

export function BotChat({
  onSend,
  name = 'Bot',
  status = 'Here to help',
  greeting = "Hi, I'm the Bot. What can I do for you?",
  initial = [],
  draft: startDraft = '',
  suggestions = ['How do you work?', 'Is it free?', "What's the weather?"],
  placeholder = 'Write a message',
  shape = 'hexagon',
  eyes = 'round',
  theme = 'light',
  width = 380,
  height = 560,
  className = '',
}: Props) {
  const c = THEMES[theme]
  const uid = useId().replace(/:/g, '')
  const [msgs, setMsgs] = useState<ChatMessage[]>(() => [{ id: 0, from: 'bot', text: greeting }, ...initial.map((m, i) => ({ id: i + 1, at: Date.now(), ...m }))])
  const [draft, setDraft] = useState(startDraft)
  const [phase, setPhase] = useState<'idle' | 'typing' | 'thinking' | 'talking'>(startDraft ? 'typing' : 'idle')
  const [mood, setMood] = useState(0.3)
  const [mouth, setMouth] = useState(0)
  const [focus, setFocus] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const nextId = useRef(initial.length + 1)
  const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // keep the newest message in view
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: still ? 'auto' : 'smooth' })
  }, [msgs, phase, still])

  // its mouth moves while the answer comes in
  useEffect(() => {
    if (phase !== 'talking' || still) { setMouth(0); return }
    const t = setInterval(() => setMouth(0.15 + Math.random() * 0.55), 110)
    return () => clearInterval(t)
  }, [phase, still])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || phase === 'thinking' || phase === 'talking') return
    const mine: ChatMessage = { id: nextId.current++, from: 'you', text, at: Date.now() }
    const history = [...msgs, mine]
    setMsgs(history)
    setDraft('')
    setPhase('thinking'); setMood(0.1)
    const started = performance.now()
    let reply: BotReply
    try { reply = await (onSend ? onSend(text, history) : demoReply(text)) }
    catch { reply = { text: "Sorry, something went wrong. Try again?", mood: -0.6 } }
    // think for a moment at least, so you see it
    const wait = Math.max(0, (still ? 0 : 900) - (performance.now() - started))
    await new Promise((r) => setTimeout(r, wait))
    const answer = typeof reply === 'string' ? reply : reply.text
    setMood(typeof reply === 'string' || reply.mood == null ? moodOf(answer) : reply.mood)
    const id = nextId.current++
    setPhase('talking')
    if (still) {
      setMsgs((m) => [...m, { id, from: 'bot', text: answer }])
    } else {
      // word by word
      const words = answer.split(/(\s+)/)
      setMsgs((m) => [...m, { id, from: 'bot', text: '' }])
      for (let i = 1; i <= words.length; i++) {
        await new Promise((r) => setTimeout(r, words[i - 1].trim() ? 55 : 0))
        const part = words.slice(0, i).join('')
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, text: part } : x)))
      }
    }
    setPhase('idle')
  }

  // where it looks: at the field as you type (following your words), up while it thinks, else at the cursor
  const progress = Math.min(1, draft.length / 34)
  const look = phase === 'thinking' ? { x: 0.35, y: -0.45 } : draft ? { x: -0.35 + progress * 0.7, y: 0.4 } : focus ? { x: -0.2, y: 0.35 } : undefined
  const busy = phase === 'thinking' || phase === 'talking'
  const line = phase === 'thinking' ? 'Thinking…' : phase === 'talking' ? 'Answering…' : draft ? 'Listening…' : status

  const lastYou = [...msgs].reverse().find((m) => m.from === 'you')
  const time = (t?: number) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
  const spring = (d = 0) => `botchat-in-${uid} .55s ${d}s cubic-bezier(.3,.7,.4,1) both`

  return (
    <div
      data-bot-chat={uid}
      className={`flex flex-col overflow-hidden rounded-[28px] ${className}`}
      style={{ width, height, background: c.card, color: c.ink, fontFamily: FONT, boxShadow: `0 0 0 1px ${c.line}, 0 18px 40px -24px rgba(0,0,0,0.18)` }}
    >
      {/* written raw, so the server and the browser render the same text */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes botchat-in-${uid} { 0% { transform: translateY(6px) scale(.7); opacity: 0 } 55% { transform: translateY(0) scale(1.03); opacity: 1 } 78% { transform: scale(.992) } 100% { transform: scale(1) } }
        @keyframes botchat-dot-${uid} { 0%, 60%, 100% { transform: translateY(0) scale(1, 1) } 30% { transform: translateY(-4px) scale(.88, 1.14) } 45% { transform: translateY(0) scale(1.16, .84) } }
        @keyframes botchat-live-${uid} { 0% { box-shadow: 0 0 0 0 ${c.live}66 } 70%, 100% { box-shadow: 0 0 0 5px ${c.live}00 } }
        @keyframes botchat-fade-${uid} { from { opacity: 0; transform: translateY(2px) } to { opacity: 1; transform: none } }
        [data-bot-chat="${uid}"] ::placeholder { color: ${c.mute} }
        @media (prefers-reduced-motion: reduce) { [data-bot-chat="${uid}"] * { animation: none !important } }
      ` }} />

      {/* the Bot, its name, and a live line of how it's doing */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-5">
        <Bot size={44} shape={shape} eyes={eyes} color={c.ink} eyeColor={c.card} look={look} within={`[data-bot-chat="${uid}"]`} mood={mood * 0.45} mouth={mouth} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">{name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-tight" style={{ color: c.mute }}>
            <span className="h-[6px] w-[6px] rounded-full" style={{ background: c.live, animation: `botchat-live-${uid} 2s infinite` }} />
            <span key={line} style={{ animation: `botchat-fade-${uid} .3s both` }}>{line}</span>
          </p>
        </div>
      </header>

      {/* the messages: the Bot's as plain text, yours in a soft bubble; they fade out at the top as they scroll */}
      <div
        ref={list}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 pt-5"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 28px)', maskImage: 'linear-gradient(to bottom, transparent, #000 28px)' }}
        role="log"
        aria-live="polite"
        aria-label={`Chat with ${name}`}
      >
        {msgs.map((m) => {
          const you = m.from === 'you'
          return you ? (
            <div key={m.id} className="flex flex-col items-end gap-1 self-end" style={{ maxWidth: '82%' }}>
              <div
                className="whitespace-pre-wrap rounded-[18px] rounded-br-[6px] px-3.5 py-2 text-[14px] leading-[1.45]"
                style={{ background: c.soft, transformOrigin: '100% 100%', animation: spring() }}
              >
                {m.text}
              </div>
              {m === lastYou ? <span className="pr-1 text-[11px]" style={{ color: c.mute, animation: `botchat-fade-${uid} .4s .25s both` }}>{m.at ? `Sent · ${time(m.at)}` : 'Sent'}</span> : null}
            </div>
          ) : (
            <p key={m.id} className="max-w-[88%] whitespace-pre-wrap self-start text-[14px] leading-[1.55]" style={{ transformOrigin: '0% 0%', animation: spring() }}>
              {m.text || ' '}
            </p>
          )
        })}
        {phase === 'thinking' ? (
          <div className="flex h-6 items-center gap-1 self-start" style={{ transformOrigin: '0% 50%', animation: spring() }} aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[6px] w-[6px] rounded-full" style={{ background: c.ink, opacity: 0.55, animation: `botchat-dot-${uid} 1s ${i * 0.14}s infinite` }} />
            ))}
          </div>
        ) : null}
      </div>

      {/* suggestions, until you've written */}
      {msgs.length === 1 && suggestions.length ? (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full px-3 py-1.5 text-[12.5px] transition-[transform,background-color] hover:scale-[1.03] active:scale-95"
              style={{ boxShadow: `inset 0 0 0 1px ${c.line}`, animation: spring(0.12 + i * 0.06) }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.soft }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* the field, with the send button inside */}
      <form onSubmit={(e) => { e.preventDefault(); send(draft) }} className="px-4 pb-4">
        <div className="flex h-12 items-center rounded-full pl-5 pr-1.5 transition-shadow" style={{ boxShadow: `inset 0 0 0 1px ${focus ? c.mute : c.line}` }}>
          <input
            value={draft}
            onChange={(e) => { setDraft(e.target.value); if (phase === 'idle' || phase === 'typing') setPhase(e.target.value ? 'typing' : 'idle') }}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: c.ink }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            aria-label="Send"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-300 hover:scale-105 active:scale-90"
            style={{ background: draft.trim() && !busy ? c.ink : c.soft, color: draft.trim() && !busy ? c.card : c.mute, transitionTimingFunction: 'cubic-bezier(.3,1.5,.5,1)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 3.5c.4 0 .8.16 1.08.45l6.5 6.5a1.5 1.5 0 0 1-2.12 2.12l-3.96-3.96V19a1.5 1.5 0 0 1-3 0V8.6l-3.96 3.97a1.5 1.5 0 1 1-2.12-2.12l6.5-6.5c.28-.29.68-.45 1.08-.45Z" /></svg>
          </button>
        </div>
      </form>
    </div>
  )
}
