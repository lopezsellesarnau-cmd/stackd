'use client'

/**
 * StackD Components: the shop (10 nov 2026).
 * Full screen: a filter panel on the left, and a 4-column grid of rounded tiles with empty
 * cells between them (Flow reference). Each tile is a live component you can try before
 * opening it. On a phone: the filters scroll across the top and the tiles are a full-width list.
 * Its own type, system sans in sentence case, not the editorial mono of the old studio page.
 * Since 10 nov 2026 this shop is the whole of stackd.codes; the developer side lives on arnau-lopez.com.
 * The dark tiles are stand-ins until there are more components.
 */

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bot, EYES, SHAPES, type BotEyes, type BotShape } from './kit/bot'
import { PromptBar } from './kit/prompt-bar'
import { SlideToPay } from './kit/slide-to-pay'
import { useLanguage } from './language-context'

const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif'

const COPY = {
  en: {
    title: 'Components',
    intro: 'Interface components with the Figma file and the React code. Try them right here.',
    categories: 'Categories',
    all: 'All',
    free: 'Free',
    soon: 'Coming soon',
    by: 'Made by Arnau López',
    open: 'Open',
    close: 'Close',
    shape: 'Shape',
    eyes: 'Eyes',
    color: 'Colour',
    botAbout: 'A bot whose eyes follow the cursor. The eyes sit on a sphere, so it looks round as it turns. Four shapes, four kinds of eyes, any colour.',
    includes: ['Figma file with every pose', 'React + Tailwind code, no other libraries', 'Respects reduced motion'],
    promptAbout: 'A chat input for AI products. It grows as you write, takes files, lets you pick a model, shows a thinking shimmer and streams the answer. The Bot can sit beside it as the assistant\'s face. Try it here.',
    promptIncludes: ['Figma file, desktop and mobile', 'React + Tailwind code, with the Bot', 'Works with any AI: Claude, GPT, your own', 'A ready /api/chat route for Next.js'],
    payAbout: 'A slide-to-confirm button for checkouts. Drag the handle to the end: it locks, shows a spinner while your payment runs, then fills and ticks. Let go early and it springs back. If the payment fails it shakes and resets.',
    payIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Works with mouse, touch and keyboard', 'Plug in any payment with one promise'],
    bot: 'Bot',
    on: 'On',
    off: 'Off',
    soonGet: 'Coming soon',
    get: 'Get it free',
    emailNote: 'Checkout on Gumroad. The Figma file and the code arrive in your inbox.',
    cats: { ai: 'AI', characters: 'Characters', buttons: 'Buttons', inputs: 'Inputs', loaders: 'Loaders', cards: 'Cards' },
  },
  es: {
    title: 'Componentes',
    intro: 'Componentes de interfaz con el archivo de Figma y el código en React. Pruébalos aquí mismo.',
    categories: 'Categorías',
    all: 'Todos',
    free: 'Gratis',
    soon: 'Próximamente',
    by: 'Hecho por Arnau López',
    open: 'Abrir',
    close: 'Cerrar',
    shape: 'Forma',
    eyes: 'Ojos',
    color: 'Color',
    botAbout: 'Un bot cuyos ojos siguen al cursor. Los ojos van sobre una esfera, así que se ve redondo al girar. Cuatro formas, cuatro tipos de ojos y cualquier color.',
    includes: ['Archivo de Figma con todas las poses', 'Código en React + Tailwind, sin otras librerías', 'Respeta el movimiento reducido'],
    promptAbout: 'Un campo de chat para productos con IA. Crece al escribir, acepta archivos, deja elegir el modelo, muestra un brillo mientras piensa y escribe la respuesta palabra a palabra. El Bot puede ir al lado como la cara del asistente. Pruébalo aquí.',
    promptIncludes: ['Archivo de Figma, escritorio y móvil', 'Código en React + Tailwind, con el Bot', 'Funciona con cualquier IA: Claude, GPT o la tuya', 'Una ruta /api/chat lista para Next.js'],
    payAbout: 'Un botón de deslizar para confirmar el pago. Arrastra el asa hasta el final: se bloquea, muestra un spinner mientras se procesa el pago y luego se llena con un check. Si lo sueltas antes, vuelve atrás. Si el pago falla, tiembla y se reinicia.',
    payIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Funciona con ratón, táctil y teclado', 'Conecta cualquier pago con una promesa'],
    bot: 'Bot',
    on: 'Sí',
    off: 'No',
    soonGet: 'Próximamente',
    get: 'Consíguelo gratis',
    emailNote: 'Se consigue a través de Gumroad. El archivo de Figma y el código llegan a tu correo.',
    cats: { ai: 'IA', characters: 'Personajes', buttons: 'Botones', inputs: 'Campos', loaders: 'Cargas', cards: 'Tarjetas' },
  },
}

type Cat = keyof (typeof COPY)['en']['cats']
const CATS = Object.keys(COPY.en.cats) as Cat[]

// The live components, with their category
type Id = 'bot' | 'prompt' | 'pay'
const ITEMS: { id: Id; cat: Cat }[] = [
  { id: 'bot', cat: 'characters' },
  { id: 'prompt', cat: 'ai' },
  { id: 'pay', cat: 'buttons' },
]

// The desktop grid, row by row: 1 = a tile, 0 = an empty cell
const PATTERN = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1]

// Body colour, and the eye colour that reads on it
const COLORS = [
  { name: 'White', body: '#FFFFFF', eyes: '#141310' },
  { name: 'Ink', body: '#141310', eyes: '#FFFFFF' },
  { name: 'Wine', body: '#901919', eyes: '#FFFFFF' },
  { name: 'Olive', body: '#6C8544', eyes: '#FFFFFF' },
  { name: 'Ochre', body: '#BE9344', eyes: '#FFFFFF' },
  { name: 'Lilac', body: '#C9B8FF', eyes: '#141310' },
]

// Where each component is delivered
const GUMROAD: Record<Id, string> = {
  bot: 'https://arnolop.gumroad.com/l/stackd?wanted=true',
  prompt: 'https://arnolop.gumroad.com/l/prompt_bar?wanted=true',
  pay: 'https://arnolop.gumroad.com/l/slide_to_pay?wanted=true',
}

const tile = 'relative aspect-square overflow-hidden rounded-[18px]'

export function Shop() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang]
  const [cat, setCat] = useState<Cat | 'all'>('all')

  const shown = ITEMS.filter((i) => cat === 'all' || i.cat === cat)
  // Fill the pattern: real components first, stand-ins after (only under "All")
  let next = 0
  const cells = PATTERN.map((on, i) => {
    if (!on) return { key: `void-${i}`, kind: 'void' as const }
    const item = shown[next]
    const n = next++
    if (item) return { key: item.id, kind: 'item' as const, item }
    return cat === 'all' ? { key: `soon-${n}`, kind: 'soon' as const } : { key: `void-${i}`, kind: 'void' as const }
  })

  const filters: [Cat | 'all', string, number][] = [
    ['all', t.all, ITEMS.length],
    ...CATS.map((c) => [c, t.cats[c], ITEMS.filter((i) => i.cat === c).length] as [Cat, string, number]),
  ]

  return (
    <div className="min-h-screen bg-card p-3 text-[13px] leading-[1.45] tracking-[-0.005em] text-ink" style={{ fontFamily: SANS }}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* The panel: on the left on a big screen, across the top on a phone */}
        <aside className="flex flex-col rounded-[18px] bg-paper p-4 lg:sticky lg:top-3 lg:h-[calc(100svh-24px)]">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" />
            StackD
          </Link>
          <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">{t.title}</h1>
          <p className="mt-1 max-w-[30ch] text-fg-dim">{t.intro}</p>

          <p className="mt-6 hidden text-fg-faint lg:block">{t.categories}</p>
          <nav aria-label={t.categories} className="-mx-1 mt-4 flex gap-1 overflow-x-auto lg:mt-2 lg:flex-col lg:overflow-visible">
            {filters.map(([id, label, count]) => (
              <button
                key={id}
                onClick={() => setCat(id)}
                aria-pressed={cat === id}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-[10px] px-3 py-1.5 text-left transition-colors ${
                  cat === id ? 'bg-card text-ink' : 'text-fg-muted hover:bg-card/60 hover:text-ink'
                }`}
              >
                {label}
                <span className="text-fg-faint">{count}</span>
              </button>
            ))}
          </nav>

          {/* Who is behind it: the portfolio and LinkedIn carry the developer side */}
          <div className="mt-5 flex items-end justify-between gap-4 text-fg-dim lg:mt-auto lg:pt-6">
            <div>
              <p className="text-fg-faint">{t.by}</p>
              <p className="mt-0.5 flex gap-3">
                <a href="https://arnau-lopez.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  Portfolio ↗
                </a>
                <a href="https://www.linkedin.com/in/arnau-lopez-selles/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  LinkedIn ↗
                </a>
              </p>
            </div>
            <span className="flex gap-2">
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`uppercase transition-colors hover:text-ink ${lang === l ? 'text-ink' : 'text-fg-ghost'}`}
                >
                  {l}
                </button>
              ))}
            </span>
          </div>
        </aside>

        <main id="contenido">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cells.map((c) =>
              c.kind === 'item' ? (
                <li key={c.key}>
                  {c.item.id === 'bot' ? <BotTile t={t} /> : c.item.id === 'prompt' ? <PromptTile t={t} /> : <PayTile t={t} />}
                </li>
              ) : c.kind === 'soon' ? (
                <li key={c.key} aria-hidden className={`${tile} bg-ink`}>
                  <span className="absolute bottom-4 left-4 text-paper/35">{t.soon}</span>
                </li>
              ) : (
                // Empty cells only on a big screen; on a phone it is a plain list
                <li key={c.key} aria-hidden className="hidden aspect-square lg:block" />
              ),
            )}
          </ul>
        </main>
      </div>
    </div>
  )
}

type Config = { shape: BotShape; eyes: BotEyes; color: (typeof COLORS)[number] }
type T = (typeof COPY)['en'] | (typeof COPY)['es']

const shapes = Object.keys(SHAPES) as BotShape[]
const eyeKinds = Object.keys(EYES) as BotEyes[]
const step = <V,>(list: readonly V[], now: V) => list[(list.indexOf(now) + 1) % list.length]

/** The Bot, live. Three small buttons step through its shape, eyes and colour; the tile opens the details. */
function BotTile({ t }: { t: T }) {
  const [cfg, setCfg] = useState<Config>({ shape: 'pill', eyes: 'tall', color: COLORS[0] })
  const [open, setOpen] = useState(false)
  const { shape, eyes, color } = cfg
  // A white bot sits on a dark tile
  const dark = color.name === 'White'

  return (
    <>
      <article className={`kit-tile group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        {/* The whole tile opens the details; the small buttons sit above it */}
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Bot`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Bot size={112} shape={shape} eyes={eyes} color={color.body} eyeColor={color.eyes} within=".kit-tile" />
        </div>
        <span
          className={`pointer-events-none absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] ${dark ? 'bg-paper/10 text-paper/70' : 'bg-card text-fg-dim'}`}
        >
          {t.free}
        </span>

        {/* Always there on a phone, on hover with a mouse */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Shape: ${shape}`} onClick={() => setCfg({ ...cfg, shape: step(shapes, shape) })}>
              <ShapeIcon shape={shape} />
            </Step>
            <Step label={`Eyes: ${eyes}`} onClick={() => setCfg({ ...cfg, eyes: step(eyeKinds, eyes) })}>
              <EyesIcon eyes={eyes} />
            </Step>
            <Step label={`Colour: ${color.name}`} onClick={() => setCfg({ ...cfg, color: step(COLORS, color) })}>
              <Swatch color={color.body} />
            </Step>
          </div>
        </div>
      </article>

      {open ? <BotDetail t={t} cfg={cfg} setCfg={setCfg} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

/** The big pop-up: the live component on the left; details, options, code and the Gumroad button on the right. */
function Detail({
  t,
  cat,
  name,
  about,
  includes,
  usage,
  href,
  stage,
  dark,
  options,
  onClose,
}: {
  t: T
  cat: string
  name: string
  about: string
  includes: string[]
  usage: string
  href: string
  stage: React.ReactNode
  dark?: boolean
  options: React.ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  // A native dialog: it traps focus, closes on Escape, and the page behind stops scrolling
  useEffect(() => {
    ref.current?.showModal()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-0 h-[100svh] max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:h-[min(640px,calc(100svh-48px))] sm:w-[min(1040px,calc(100vw-48px))]"
      style={{ fontFamily: SANS }}
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] overflow-y-auto bg-card p-3 text-[13px] leading-[1.45] text-ink sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:grid-rows-1 sm:gap-3 sm:overflow-hidden sm:rounded-[24px]">
        {/* The stage */}
        <div
          className={`kit-stage relative flex min-h-[360px] items-center justify-center rounded-[18px] p-5 transition-colors duration-300 sm:min-h-0 ${dark ? 'bg-ink' : 'bg-paper'}`}
        >
          {stage}
          {/* On a phone the details scroll away, so the close button also sits on the stage */}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={t.close}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-ink sm:hidden"
          >
            ✕
          </button>
        </div>

        {/* The details */}
        <div className="mt-3 flex flex-col rounded-[18px] bg-paper p-5 sm:mt-0 sm:overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-fg-faint">{cat}</p>
              <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em]">{name}</h2>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={t.close}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-card text-fg-dim transition-colors hover:text-ink sm:flex"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 max-w-[44ch] text-fg-muted">{about}</p>

          <div className="mt-5 space-y-3">{options}</div>

          <pre className="mt-5 overflow-x-auto rounded-[12px] bg-card px-3 py-2.5 text-[11px] leading-[1.6] text-fg-muted">
            <code>{usage}</code>
          </pre>

          <ul className="mt-5 space-y-1 text-fg-muted">
            {includes.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="text-fg-ghost">✓</span>
                {i}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            {/* Gumroad asks for the email and sends the files; it is also where paid components will sell */}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center rounded-full bg-ink px-4 font-medium text-paper transition-opacity hover:opacity-85"
              >
                {t.get}
              </a>
            ) : (
              <span className="flex h-10 w-full items-center justify-center rounded-full bg-card px-4 text-fg-dim">{t.soonGet}</span>
            )}
            <p className="mt-2 text-[11px] text-fg-faint">{t.emailNote}</p>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function BotDetail({ t, cfg, setCfg, onClose }: { t: T; cfg: Config; setCfg: (c: Config) => void; onClose: () => void }) {
  const { shape, eyes, color } = cfg
  return (
    <Detail
      t={t}
      cat={t.cats.characters}
      name="Bot"
      about={t.botAbout}
      includes={t.includes}
      usage={`<Bot shape="${shape}" eyes="${eyes}" color="${color.body}" eyeColor="${color.eyes}" />`}
      href={GUMROAD.bot}
      dark={color.name === 'White'}
      onClose={onClose}
      stage={<Bot size={200} shape={shape} eyes={eyes} color={color.body} eyeColor={color.eyes} within=".kit-stage" />}
      options={<BotOptions t={t} cfg={cfg} setCfg={setCfg} />}
    />
  )
}

/** Shape, eyes and colour: in the Bot's pop-up, and for the bot in the prompt bar's */
function BotOptions({ t, cfg, setCfg, eyesToo = true }: { t: T; cfg: Config; setCfg: (c: Config) => void; eyesToo?: boolean }) {
  const { shape, eyes, color } = cfg
  return (
    <>
      <Choice label={t.shape}>
        {shapes.map((s) => (
          <Pick key={s} on={shape === s} label={s} onClick={() => setCfg({ ...cfg, shape: s })}>
            <ShapeIcon shape={s} />
          </Pick>
        ))}
      </Choice>
      {eyesToo ? (
        <Choice label={t.eyes}>
          {eyeKinds.map((e) => (
            <Pick key={e} on={eyes === e} label={e} onClick={() => setCfg({ ...cfg, eyes: e })}>
              <EyesIcon eyes={e} />
            </Pick>
          ))}
        </Choice>
      ) : null}
      <Choice label={t.color}>
        {COLORS.map((c) => (
          <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setCfg({ ...cfg, color: c })}>
            <Swatch color={c.body} />
          </Pick>
        ))}
      </Choice>
    </>
  )
}

/** 02 · AI prompt bar, live and small in the tile; the empty part of the tile opens the details */
function PromptTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [withBot, setWithBot] = useState(true)
  const [cfg, setCfg] = useState<Config>({ shape: 'pill', eyes: 'tall', color: COLORS[1] })
  // The bar rests in the middle of the tile and slides down once you start using it
  const [focused, setFocused] = useState(false)
  const [used, setUsed] = useState(false)
  const down = focused || used
  const botProps = { shape: cfg.shape, eyes: cfg.eyes, color: cfg.color.body, eyeColor: cfg.color.eyes }

  return (
    <>
      <article className={`group ${tile} bg-paper [container-type:size]`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} AI prompt bar`} className="absolute inset-0 cursor-pointer" />
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-card px-2 py-0.5 text-[11px] text-fg-dim">{t.free}</span>
        <div
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
          onKeyDownCapture={(e) => e.key === 'Enter' && !e.shiftKey && setUsed(true)}
          onClickCapture={(e) => (e.target as HTMLElement).closest('button[aria-label="Send"]') && setUsed(true)}
          // From the bottom of the tile up to its middle: half the tile, minus the 12px gap, plus half the bar
          style={{ transform: down ? 'translateY(0)' : 'translateY(calc(-50cqh + 12px + 50%))' }}
          className="absolute inset-x-3 bottom-3 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        >
          <PromptBar compact bot={withBot ? botProps : false} placeholder="Ask anything" />
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.ai}
          name="AI prompt bar"
          about={t.promptAbout}
          includes={t.promptIncludes}
          usage={withBot ? `<PromptBar bot={{ shape: "${cfg.shape}", color: "${cfg.color.body}" }} onSend={yourAI} />` : '<PromptBar onSend={yourAI} />'}
          href={GUMROAD.prompt}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex h-full w-full items-end justify-center">
              <PromptBar bot={withBot ? botProps : false} />
            </div>
          }
          options={
            <>
              <Choice label={t.bot}>
                <Pick on={withBot} label={t.on} onClick={() => setWithBot(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!withBot} label={t.off} onClick={() => setWithBot(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
              {withBot ? <BotOptions t={t} cfg={cfg} setCfg={setCfg} eyesToo={false} /> : null}
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 03 · Slide to pay, live in the tile. It resets a moment after paying so it can be tried again. */
function PayTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const [round, setRound] = useState(0)
  const pay = () =>
    new Promise<void>((ok) => setTimeout(ok, 1600)).then(() => {
      setTimeout(() => setRound((n) => n + 1), 2200)
    })
  const dark = color.name === 'White'
  const slider = <SlideToPay key={`${round}-${color.name}`} color={color.body} fg={color.eyes} onConfirm={pay} />

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Slide to pay`} className="absolute inset-0 cursor-pointer" />
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-card px-2 py-0.5 text-[11px] text-fg-dim">{t.free}</span>
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">{slider}</div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Colour: ${color.name}`} onClick={() => setColor(step(COLORS, color))}>
              <Swatch color={color.body} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.buttons}
          name="Slide to pay"
          about={t.payAbout}
          includes={t.payIncludes}
          usage={`<SlideToPay amount="€24.00" color="${color.body}" fg="${color.eyes}" onConfirm={yourPayment} />`}
          href={GUMROAD.pay}
          dark={dark}
          onClose={() => setOpen(false)}
          stage={<div className="flex w-full justify-center">{slider}</div>}
          options={
            <Choice label={t.color}>
              {COLORS.map((c) => (
                <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                  <Swatch color={c.body} />
                </Pick>
              ))}
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

function Choice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-fg-faint">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

function Pick({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`flex h-8 w-9 items-center justify-center rounded-[10px] transition-colors ${on ? 'bg-card text-ink' : 'text-fg-ghost hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

function ShapeIcon({ shape }: { shape: BotShape }) {
  return (
    <svg viewBox="0 0 100 100" className="h-3.5 w-3.5">
      <path d={SHAPES[shape].d} fill="currentColor" />
    </svg>
  )
}

function EyesIcon({ eyes }: { eyes: BotEyes }) {
  const { w, h, r } = EYES[eyes]
  return (
    <svg viewBox="0 0 60 30" className="h-3.5 w-5">
      {[17, 43].map((x) => (
        <rect key={x} x={x - w / 2} y={15 - h / 2} width={w} height={h} rx={r} fill="currentColor" />
      ))}
    </svg>
  )
}

function Swatch({ color }: { color: string }) {
  return <span className="block h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(20,19,16,0.15)]" style={{ background: color }} />
}

function Step({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-card"
    >
      {children}
    </button>
  )
}
