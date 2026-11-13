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
import { StatCard } from './kit/stat-card'
import { NotificationStack, type Note } from './kit/notification-stack'
import { SplitFlap } from './kit/split-flap'
import { RotaryDial } from './kit/rotary-dial'
import { FocusTimer } from './kit/focus-timer'
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
    statAbout: 'A stat card for dashboards. The number counts up and the line draws itself in. Run along the line and the number follows you. In live mode a new point arrives and the old line flows into the new one.',
    statIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Works with mouse, touch and keyboard', 'Plug in your own data, or a live feed'],
    live: 'Live',
    notifyAbout: 'A stack of notifications. The newest sits in front and the older ones peek out behind. Hover and the pile opens into a list. Swipe one sideways to dismiss it, or let it close by itself.',
    notifyIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Swipe, tap, mouse and keyboard', 'White and black versions'],
    notify: 'Notify',
    flapAbout: 'Text on little tiles that flip like an old departure board. Each tile runs through the letters on its way to the new one, and the change rolls across the board. For prices, counters, launch dates and headlines. Type to try it.',
    flapIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Letters, numbers, €, $, £ and punctuation', 'White and black versions'],
    typeHere: 'Type something',
    timerAbout: 'A focus timer with the Bot. A small pill that opens into a panel as one smooth object: the Bot grows into the corner, the time travels beside it and the ticks arrive last. The Bot watches the time, follows your cursor and smiles when you are done. Comes as a phone island and as a laptop notch that opens on hover.',
    timerIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Island and laptop notch versions', 'Mouse, touch and keyboard'],
    shapeLabel: 'Shape',
    hoverNotch: 'Hover the notch',
    notch: 'Notch',
    island: 'Island',
    dialAbout: 'A knob you turn by dragging in a circle. It follows your finger smoothly while the value and the ring of ticks move in steps, then clicks into place with a small bounce. Past either end it gives a little, like rubber. Turn it.',
    dialIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Mouse, touch and keyboard, works with screen readers', 'Any range, step, label and colour'],
    buy: 'Buy',
    autoClose: 'Auto-close',
    theme: 'Card',
    light: 'White',
    darkT: 'Black',
    bot: 'Bot',
    on: 'On',
    off: 'Off',
    soonGet: 'Coming soon',
    get: 'Get it free',
    emailNote: 'Checkout on Gumroad. The Figma file and the code arrive in your inbox.',
    cats: { ai: 'AI', characters: 'Characters', buttons: 'Buttons', inputs: 'Inputs', loaders: 'Loaders', cards: 'Cards', notifications: 'Notifications', text: 'Text', widgets: 'Widgets' },
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
    statAbout: 'Una tarjeta de estadística para dashboards. El número sube y la línea se dibuja sola. Recorre la línea y el número te sigue. En modo en directo llega un punto nuevo y la línea vieja se transforma en la nueva.',
    statIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Funciona con ratón, táctil y teclado', 'Conecta tus datos o un feed en directo'],
    live: 'En directo',
    notifyAbout: 'Una pila de notificaciones. La más nueva va delante y las anteriores asoman detrás. Pasa el ratón y la pila se abre en una lista. Desliza una hacia un lado para descartarla, o deja que se cierre sola.',
    notifyIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Deslizar, tocar, ratón y teclado', 'Versión blanca y negra'],
    notify: 'Notificar',
    flapAbout: 'Texto en pequeñas fichas que giran como un panel de salidas antiguo. Cada ficha pasa por las letras hasta llegar a la nueva, y el cambio recorre el panel. Para precios, contadores, fechas de lanzamiento y titulares. Escribe para probarlo.',
    flapIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Letras, números, €, $, £ y puntuación', 'Versión blanca y negra'],
    typeHere: 'Escribe algo',
    timerAbout: 'Un temporizador de concentración con el Bot. Una pequeña píldora que se abre en un panel como un solo objeto: el Bot crece hasta la esquina, la hora viaja a su lado y las marcas llegan al final. El Bot mira la hora, sigue tu cursor y sonríe al terminar. Viene como isla para móvil y como notch de portátil que se abre al pasar el ratón.',
    timerIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Versión isla y notch de portátil', 'Ratón, táctil y teclado'],
    shapeLabel: 'Forma',
    hoverNotch: 'Pasa el ratón por el notch',
    notch: 'Notch',
    island: 'Isla',
    dialAbout: 'Un mando que se gira arrastrando en círculo. Sigue tu dedo con suavidad mientras el valor y el anillo de marcas avanzan a pasos, y al soltar encaja con un pequeño rebote. En los extremos cede un poco, como goma. Gíralo.',
    dialIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Ratón, táctil y teclado, compatible con lectores de pantalla', 'Cualquier rango, paso, etiqueta y color'],
    buy: 'Comprar',
    autoClose: 'Cierre automático',
    theme: 'Tarjeta',
    light: 'Blanca',
    darkT: 'Negra',
    bot: 'Bot',
    on: 'Sí',
    off: 'No',
    soonGet: 'Próximamente',
    get: 'Consíguelo gratis',
    emailNote: 'Se consigue a través de Gumroad. El archivo de Figma y el código llegan a tu correo.',
    cats: { ai: 'IA', characters: 'Personajes', buttons: 'Botones', inputs: 'Campos', loaders: 'Cargas', cards: 'Tarjetas', notifications: 'Notificaciones', text: 'Texto', widgets: 'Widgets' },
  },
}

type Cat = keyof (typeof COPY)['en']['cats']
const CATS = Object.keys(COPY.en.cats) as Cat[]

// The live components, with their category
type Id = 'bot' | 'prompt' | 'pay' | 'stat' | 'notify' | 'flap' | 'dial' | 'timer'
const ITEMS: { id: Id; cat: Cat }[] = [
  { id: 'bot', cat: 'characters' },
  { id: 'prompt', cat: 'ai' },
  { id: 'pay', cat: 'buttons' },
  { id: 'stat', cat: 'cards' },
  { id: 'notify', cat: 'notifications' },
  { id: 'flap', cat: 'text' },
  { id: 'dial', cat: 'inputs' },
  { id: 'timer', cat: 'widgets' },
]

// The paid ones; everything else is free
const PRICE: Partial<Record<Id, string>> = { flap: '€7', dial: '€7', timer: '€7' }

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
  stat: 'https://arnolop.gumroad.com/l/stat_card?wanted=true',
  notify: 'https://arnolop.gumroad.com/l/notification_stack?wanted=true',
  flap: 'https://arnolop.gumroad.com/l/split_flap?wanted=true',
  dial: 'https://arnolop.gumroad.com/l/rotary_dial?wanted=true',
  timer: '', // TODO: Gumroad link once the product is up
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
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cells.map((c) =>
              c.kind === 'item' ? (
                <li key={c.key}>
                  {c.item.id === 'bot' ? <BotTile t={t} /> : c.item.id === 'prompt' ? <PromptTile t={t} /> : c.item.id === 'pay' ? <PayTile t={t} /> : c.item.id === 'stat' ? <StatTile t={t} /> : c.item.id === 'notify' ? <NotifyTile t={t} /> : c.item.id === 'flap' ? <FlapTile t={t} /> : c.item.id === 'dial' ? <DialTile t={t} /> : <TimerTile t={t} />}
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
  price,
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
  price?: string
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
      className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-card sm:m-auto sm:backdrop:bg-ink/40 sm:backdrop:backdrop-blur-[2px] sm:h-[min(640px,calc(100svh-48px))] sm:w-[min(1040px,calc(100vw-48px))]"
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
                {price ? `${t.buy} · ${price}` : t.get}
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

// The line can't be the card's own colour: no white line on the white card, no ink on the black one
const lineColors = (dark: boolean) => COLORS.filter((c) => c.name !== (dark ? 'Ink' : 'White'))

/** 04 · Live stat card, on a dark tile so the white card stands out */
function StatTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const [live, setLive] = useState(true)
  const colors = lineColors(dark)
  // Switching the card keeps the colour if it still reads, otherwise the card's default (ink or white)
  const setTheme = (d: boolean) => {
    setDark(d)
    if (!lineColors(d).includes(color)) setColor(d ? COLORS[0] : COLORS[1])
  }
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Live stat card`} className="absolute inset-0 cursor-pointer" />
        <span className={`pointer-events-none absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-[11px] ${dark ? 'bg-card text-fg-dim' : 'bg-paper/10 text-paper/70'}`}>{t.free}</span>
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">
          <StatCard live theme={theme} color={color.body} />
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Card: ${dark ? 'black' : 'white'}`} onClick={() => setTheme(!dark)}>
              <span className="block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: 'linear-gradient(90deg,#141310 50%,#fff 50%)' }} />
            </Step>
            <Step label={`Colour: ${color.name}`} onClick={() => setColor(step(colors, color))}>
              <Swatch color={color.body} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.cards}
          name="Live stat card"
          about={t.statAbout}
          includes={t.statIncludes}
          usage={`<StatCard label="Revenue" data={points}${dark ? ' theme="dark"' : ''} color="${color.body}"${live ? ' live' : ''} />`}
          href={GUMROAD.stat}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={<StatCard key={String(live)} live={live} theme={theme} color={color.body} />}
          options={
            <>
              <Choice label={t.live}>
                <Pick on={live} label={t.on} onClick={() => setLive(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!live} label={t.off} onClick={() => setLive(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setTheme(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setTheme(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.color}>
                {colors.map((c) => (
                  <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                    <Swatch color={c.body} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 05 · Notification stack: sample notes, cycled by the Notify button */
const NOTES: Omit<Note, 'id'>[] = [
  { title: 'Payment received', body: 'Lena paid €240.00 for order #1042.', time: 'now', icon: <Dot c="#6C8544" /> },
  { title: 'New comment', body: 'Marc: "Can we move the call to 4?"', time: 'now', icon: <Dot c="#C9B8FF" /> },
  { title: 'Deploy finished', body: 'stackd.codes is live. Built in 42 s.', time: 'now', icon: <Dot c="currentColor" /> },
  { title: 'Invoice overdue', body: 'Invoice #318 is 3 days late.', time: 'now', icon: <Dot c="#901919" />, action: { label: 'Send reminder', onClick: () => {} } },
  { title: 'Low stock', body: 'Only 4 left of Oak desk, large.', time: 'now', icon: <Dot c="#BE9344" /> },
]

function Dot({ c }: { c: string }) {
  return <span className="mt-1 block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
}

/** The stack with its own list and a Notify button. `max` keeps the tile from overflowing. */
function NotifyPlay({ t, dark, auto, max }: { t: T; dark: boolean; auto: boolean; max: number }) {
  const [n, setN] = useState(3)
  const [notes, setNotes] = useState<Note[]>(() => NOTES.slice(0, 3).map((x, i) => ({ ...x, id: i })))
  const notify = () => {
    setNotes((l) => [...l, { ...NOTES[n % NOTES.length], id: n }].slice(-max))
    setN(n + 1)
  }
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <NotificationStack
        notes={notes}
        onDismiss={(id) => setNotes((l) => l.filter((x) => x.id !== id))}
        theme={dark ? 'dark' : 'light'}
        duration={auto ? 5000 : 0}
      />
      <button
        type="button"
        onClick={notify}
        className={`relative rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-85 ${dark ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}
      >
        {t.notify}
      </button>
    </div>
  )
}

/** 05 · Notification stack. White notes on a dark tile; black notes on a white one. */
function NotifyTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [auto, setAuto] = useState(false)

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Notification stack`} className="absolute inset-0 cursor-pointer" />
        <span className={`pointer-events-none absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] ${dark ? 'bg-card text-fg-dim' : 'bg-paper/10 text-paper/70'}`}>{t.free}</span>
        <div className="absolute inset-x-3 bottom-12">
          <NotifyPlay t={t} dark={dark} auto={false} max={3} />
        </div>
        <div className="absolute left-3 top-3 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Card: ${dark ? 'black' : 'white'}`} onClick={() => setDark(!dark)}>
              <span className="block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: 'linear-gradient(90deg,#141310 50%,#fff 50%)' }} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.notifications}
          name="Notification stack"
          about={t.notifyAbout}
          includes={t.notifyIncludes}
          usage={`<NotificationStack notes={notes} onDismiss={remove}${dark ? ' theme="dark"' : ''}${auto ? '' : ' duration={0}'} />`}
          href={GUMROAD.notify}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex h-full w-full items-end justify-center pb-4">
              <NotifyPlay key={String(auto)} t={t} dark={dark} auto={auto} max={6} />
            </div>
          }
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.autoClose}>
                <Pick on={auto} label={t.on} onClick={() => setAuto(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!auto} label={t.off} onClick={() => setAuto(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

const FLAP_WORDS = ['STACKD', 'HELLO', '€24.00', 'GATE B', 'ON TIME']

/** The board with its words cycling, until someone types their own */
function FlapPlay({ t, dark, size, length, input }: { t: T; dark: boolean; size: number; length: number; input?: boolean }) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (typed) return
    const id = setInterval(() => setI((n) => n + 1), 3500)
    return () => clearInterval(id)
  }, [typed])
  return (
    <div className="flex flex-col items-center gap-6">
      <SplitFlap value={typed || FLAP_WORDS[i % FLAP_WORDS.length]} length={length} align="center" theme={dark ? 'dark' : 'light'} size={size} />
      {input ? (
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value.slice(0, length))}
          placeholder={t.typeHere}
          className="w-56 rounded-full bg-card px-4 py-2 text-center text-[16px] uppercase text-ink outline-none placeholder:normal-case placeholder:text-fg-faint sm:text-[14px]"
        />
      ) : null}
    </div>
  )
}

/** 06 · Split-flap display, the first paid one. Black tiles on white; white tiles on black. */
function FlapTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Split-flap display`} className="absolute inset-0 cursor-pointer" />
        <span className={`pointer-events-none absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] ${dark ? 'bg-card text-ink' : 'bg-paper/10 text-paper'}`}>{PRICE.flap}</span>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <FlapPlay t={t} dark={dark} size={48} length={6} />
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Tiles: ${dark ? 'black' : 'white'}`} onClick={() => setDark(!dark)}>
              <span className="block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: 'linear-gradient(90deg,#141310 50%,#fff 50%)' }} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.text}
          name="Split-flap display"
          about={t.flapAbout}
          includes={t.flapIncludes}
          usage={`<SplitFlap value="€24.00" length={8}${dark ? '' : ' theme="light"'} />`}
          href={GUMROAD.flap}
          price={PRICE.flap}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={<FlapPlay t={t} dark={dark} size={52} length={8} input />}
          options={
            <Choice label={t.theme}>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

/** 07 · Rotary dial. A white knob on a white tile; a black knob on a black one. */
function DialTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const colors = lineColors(dark)
  const setTheme = (d: boolean) => {
    setDark(d)
    if (!lineColors(d).includes(color)) setColor(d ? COLORS[0] : COLORS[1])
  }
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Rotary dial`} className="absolute inset-0 cursor-pointer" />
        <span className={`pointer-events-none absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] ${dark ? 'bg-paper/10 text-paper' : 'bg-card text-ink'}`}>{PRICE.dial}</span>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <RotaryDial theme={theme} color={color.body} size={170} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Knob: ${dark ? 'black' : 'white'}`} onClick={() => setTheme(!dark)}>
              <span className="block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: 'linear-gradient(90deg,#141310 50%,#fff 50%)' }} />
            </Step>
            <Step label={`Colour: ${color.name}`} onClick={() => setColor(step(colors, color))}>
              <Swatch color={color.body} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="Rotary dial"
          about={t.dialAbout}
          includes={t.dialIncludes}
          usage={`<RotaryDial label="Volume"${dark ? ' theme="dark"' : ''} color="${color.body}" onChange={setVolume} />`}
          href={GUMROAD.dial}
          price={PRICE.dial}
          dark={dark}
          onClose={() => setOpen(false)}
          stage={<RotaryDial theme={theme} color={color.body} size={260} />}
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setTheme(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setTheme(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.color}>
                {colors.map((c) => (
                  <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                    <Swatch color={c.body} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** A soft screen for the timer to sit on, like a laptop's display */
const SCREEN = 'linear-gradient(180deg,#E9E7F5 0%,#F6F1E8 100%)'

/** 08 · Focus timer. The island by default; the laptop notch (with its bezel) when picked. */
function TimerTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [notch, setNotch] = useState(true)
  // Big while it's a pill, scaled down as it opens so the panel always fits the tile, at any width
  const [live, setLive] = useState(false)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const room = w - 28 // a little margin on each side
  const fit = live ? Math.min(1, room / 300) : Math.min(notch ? 1.2 : 1.35, room / 148)
  const grow = { transform: `scale(${fit})`, transition: 'transform .46s cubic-bezier(.25,1,.5,1)' }
  const theme = dark ? 'dark' : 'light'
  const bezel = dark ? '#141310' : '#FFFFFF'

  const stage = (scale: number) =>
    notch ? (
      // A laptop screen whose bezel is the notch's own colour: a real notch is part of the bezel
      <div className="absolute inset-0 rounded-[18px] p-[9px]" style={{ background: bezel, boxShadow: dark ? undefined : 'inset 0 0 0 1px rgba(20,19,16,0.08)' }}>
        <div className="flex h-full justify-center overflow-hidden rounded-[11px]" style={{ background: SCREEN }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: '50% 0' }}>
          <FocusTimer variant="notch" theme={theme} remaining={18 * 60 + 5} label="Deep work" />
        </div>
        </div>
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center rounded-[18px]" style={{ background: SCREEN }}>
        <div style={{ transform: `scale(${scale})` }}>
          <FocusTimer theme={theme} remaining={9 * 60 + 41} defaultOpen />
        </div>
      </div>
    )

  return (
    <>
      <article
        ref={box}
        className={`group ${tile} transition-colors duration-300`}
        style={notch ? { background: bezel, boxShadow: dark ? undefined : 'inset 0 0 0 1px rgba(20,19,16,0.08)' } : { background: SCREEN }}
      >
        {/* The notch sits in a laptop screen: a black bezel, the notch part of it */}
        {notch ? <div className="absolute inset-[7px] overflow-hidden rounded-[12px]" style={{ background: SCREEN }} /> : null}
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Focus timer`} className="absolute inset-0 cursor-pointer" />
        <span className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink">{PRICE.timer}</span>
        {notch ? (
          <>
            <span className="pointer-events-none absolute bottom-[18px] left-1/2 -translate-x-1/2 text-[11px] text-ink/40 [@media(hover:none)]:hidden">{t.hoverNotch}</span>
            <div className="pointer-events-none absolute inset-x-0 top-[7px] flex justify-center">
              <div className="pointer-events-auto motion-reduce:!transition-none" style={{ ...grow, transformOrigin: '50% 0' }}>
                <FocusTimer variant="notch" theme={theme} remaining={18 * 60 + 5} label="Deep work" open={live} onOpenChange={setLive} />
              </div>
            </div>
          </>
        ) : (
          // The island: big as a pill, eased down as it opens (same timing as the morph) so the panel fits
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="pointer-events-auto motion-reduce:!transition-none"
              style={grow}
            >
              <FocusTimer theme={theme} remaining={9 * 60 + 41} open={live} onOpenChange={setLive} />
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_0_0_1px_rgba(20,19,16,0.08)]">
            <Step label={`Timer: ${dark ? 'black' : 'white'}`} onClick={() => setDark(!dark)}>
              <span className="block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: 'linear-gradient(90deg,#141310 50%,#fff 50%)' }} />
            </Step>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.widgets}
          name="Focus timer"
          about={t.timerAbout}
          includes={t.timerIncludes}
          usage={`<FocusTimer minutes={25}${notch ? ' variant="notch"' : ''}${dark ? '' : ' theme="light"'} onDone={takeABreak} />`}
          href={GUMROAD.timer}
          price={PRICE.timer}
          onClose={() => setOpen(false)}
          stage={stage(1)}
          options={
            <>
              <Choice label={t.shapeLabel}>
                <Pick on={notch} label={t.notch} onClick={() => setNotch(true)}>
                  <span className="px-1">{t.notch}</span>
                </Pick>
                <Pick on={!notch} label={t.island} onClick={() => setNotch(false)}>
                  <span className="px-1">{t.island}</span>
                </Pick>
              </Choice>
              <Choice label={t.theme}>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
              </Choice>
            </>
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
