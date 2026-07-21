'use client'

/**
 * StackD landing — editorial direction (Morphic-style reference from Arnau):
 * oversized wordmark, duotone hero panel, marquee dividers, alternating
 * image/text works grid, results table, big "Let's talk" close.
 * Copy en EN/ES (ver components/copy.ts) — sin mención a "UK", el
 * posicionamiento se dejó genérico. Code mockups double as the "work"
 * imagery since there's no real photography — same DOM-not-image approach
 * as before.
 */

import { HeroMockup } from './hero-mockup'
import { TILES, WorkImage } from './project-mockups'
import { useLanguage } from './language-context'
import { COPY } from './copy'

export function Nav() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang].nav
  return (
    <header className="border-b border-[rgba(0,0,0,0.08)]">
      <nav className="grid grid-cols-4 text-[12px] uppercase tracking-[0.12em] text-fg-dim" aria-label="Primary">
        {[
          [t.work, '#work'],
          [t.services, '#services'],
          [t.contact, '#contact'],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="border-r border-[rgba(0,0,0,0.08)] py-4 text-center transition-colors hover:bg-black/[0.03] hover:text-fg"
          >
            {label}
          </a>
        ))}
        <div className="flex items-center justify-center gap-1">
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-[4px] px-2 py-1 text-[11px] transition-colors ${
                lang === l ? 'bg-fg text-bg' : 'text-fg-faint hover:text-fg'
              }`}
              aria-pressed={lang === l}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}

export function Hero() {
  const { lang } = useLanguage()
  const t = COPY[lang].hero
  return (
    <section className="border-b border-[rgba(0,0,0,0.08)]">
      <div className="px-6 pt-10">
        <h1 className="fade-up font-display text-[clamp(3.5rem,12vw,9rem)] leading-[0.9] tracking-tighter">
          StackD
        </h1>
      </div>

      <div className="fade-up mt-8 overflow-hidden bg-gradient-to-br from-accent/20 via-[#EDE6D6] to-bg">
        <HeroMockup />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[rgba(0,0,0,0.08)] border-t border-[rgba(0,0,0,0.08)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <p className="px-6 py-6 text-[15px] leading-relaxed text-fg-dim">{t.body}</p>
        <div className="flex flex-col justify-center gap-1.5 px-6 py-6 text-[11px] uppercase tracking-[0.12em] text-fg-faint">
          <span>{t.studio}</span>
          <span>{t.location}</span>
        </div>
      </div>
    </section>
  )
}

export function Services() {
  const { lang } = useLanguage()
  const t = COPY[lang].services

  return (
    <section id="services" className="border-b border-[rgba(0,0,0,0.08)] py-16">
      <p className="text-center text-[12px] uppercase tracking-[0.12em] text-fg-faint">{t.eyebrow}</p>
      <div className="mt-6">
        {t.items.map((it, i) => (
          <div
            key={it.t}
            className="fade-up border-t border-[rgba(0,0,0,0.08)] px-6 py-3 text-center last:border-b"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <h2 className="font-display text-[clamp(2.5rem,9vw,6rem)] leading-[0.95] tracking-tighter">
              {it.t}
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-fg-faint">
              {it.tags.join('   ·   ')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function MarqueeDivider({ text }: { text: string }) {
  const item = (
    <span className="flex shrink-0 items-center gap-8 pr-8 text-[13px] uppercase tracking-[0.12em] text-fg-dim">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="flex items-center gap-8">
          {text}
          <span className="text-accent" aria-hidden>✳</span>
        </span>
      ))}
    </span>
  )
  return (
    <div className="overflow-hidden border-y border-[rgba(0,0,0,0.08)] py-3">
      <div className="marquee-track flex w-max">
        {item}
        {item}
      </div>
    </div>
  )
}

function WorkImageTile({
  which,
  delay,
  className = '',
}: {
  which: keyof typeof TILES
  delay: number
  className?: string
}) {
  const t = TILES[which]
  return (
    <div
      className={`fade-up relative aspect-[4/3] overflow-hidden border-b border-[rgba(0,0,0,0.08)] sm:border-r ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <WorkImage which={which} />
      <span className="absolute right-3 top-3 [writing-mode:vertical-rl] text-[10px] uppercase tracking-[0.18em] text-white/50">
        [ {t.title} ] — [ {t.tag} ]
      </span>
    </div>
  )
}

function WorkTextTile({
  index,
  caption,
  delay,
  className = '',
}: {
  index: string
  caption: string
  delay: number
  className?: string
}) {
  return (
    <div
      className={`fade-up flex aspect-[4/3] flex-col justify-center gap-3 border-b border-[rgba(0,0,0,0.08)] bg-surface p-8 sm:border-r ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[11px] uppercase tracking-[0.14em] text-fg-faint">
        [ {index} ] — [ 2026 ]
      </span>
      <p className="max-w-[32ch] text-[14px] leading-relaxed text-fg-dim">{caption}</p>
    </div>
  )
}

export function WorksGrid() {
  const { lang } = useLanguage()
  const t = COPY[lang].works
  return (
    <section id="work">
      <MarqueeDivider text={t.marquee} />
      {/*
       * Cada pareja es su propio grid — `order` de CSS reordena TODO el
       * grid al que pertenece, no solo dos elementos sueltos, así que si
       * las 8 tiles compartieran un único grid, alternar con `order`
       * agrupaba las 4 imágenes por un lado y los 4 textos por otro (roto
       * en mobile Y en escritorio). Grids aislados por pareja = `order`
       * queda contenido ahí, y el DOM siempre es imagen→texto.
       */}
      {t.rows.map((r, i) => {
        const flip = i % 2 === 1
        return (
          <div key={r.which} className="grid grid-cols-1 sm:grid-cols-2">
            <WorkImageTile which={r.which} delay={i * 100} className={flip ? 'sm:order-2' : ''} />
            <WorkTextTile
              index={r.index}
              caption={r.caption}
              delay={i * 100 + 60}
              className={flip ? 'sm:order-1' : ''}
            />
          </div>
        )
      })}
    </section>
  )
}

export function TrackRecord() {
  const { lang } = useLanguage()
  const t = COPY[lang].trackRecord

  return (
    <section className="border-b border-[rgba(0,0,0,0.08)] py-16">
      <div className="px-6">
        <h2 className="font-display text-[clamp(2rem,6vw,3.5rem)] tracking-tighter">{t.title}</h2>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-fg-dim">{t.body}</p>
      </div>
      <div className="mt-8 border-t border-[rgba(0,0,0,0.08)]">
        {t.rows.map(([name, detail, year]) => (
          <div
            key={name}
            className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-6 py-3.5 text-[13px]"
          >
            <span className="font-medium tracking-tight">{name}</span>
            <span className="hidden flex-1 px-6 text-fg-faint sm:block">{detail}</span>
            <span className="text-fg-faint">[ {year} ]</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function TechStack() {
  const { lang } = useLanguage()
  const t = COPY[lang].techStack
  const stack = [
    'Next.js', 'TypeScript', 'Supabase', 'Postgres', 'OpenAI', 'Anthropic',
    'Twilio', 'Stripe', 'Vercel', 'n8n',
  ]
  return (
    <section className="border-b border-[rgba(0,0,0,0.08)] py-12">
      <div className="px-6">
        <p className="text-center text-[11px] uppercase tracking-[0.14em] text-fg-faint">{t.eyebrow}</p>
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {stack.map((s) => (
            <span key={s} className="text-[15px] font-medium tracking-tight text-fg-dim">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  const { lang } = useLanguage()
  const t = COPY[lang].faq

  return (
    <section id="faq" className="border-b border-[rgba(0,0,0,0.08)] py-20">
      <div className="px-6">
        <p className="eyebrow text-center">{t.eyebrow}</p>
        <h2 className="fade-up mt-3 text-center font-display text-[clamp(2rem,6vw,3.5rem)] tracking-tighter">
          {t.title}
        </h2>

        <div className="mx-auto mt-10 max-w-2xl divide-y divide-[rgba(0,0,0,0.08)] border-y border-[rgba(0,0,0,0.08)]">
          {t.items.map((it) => (
            <details key={it.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium tracking-tight text-fg-muted transition-colors hover:text-fg">
                {it.q}
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 text-fg-faint transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-fg-dim">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  const { lang } = useLanguage()
  const t = COPY[lang].contact

  return (
    <section id="contact" className="py-20">
      <p className="text-center text-[12px] uppercase tracking-[0.12em] text-fg-faint">{t.eyebrow}</p>
      <h2 className="fade-up mt-3 text-center font-display text-[clamp(3rem,12vw,7rem)] tracking-tighter">
        {t.title}
      </h2>

      <form className="fade-up mx-auto mt-10 max-w-xl space-y-3 px-6">
        <input
          name="name"
          placeholder={t.name}
          className="w-full border-b border-[rgba(0,0,0,0.18)] bg-transparent px-1 py-2.5 text-[14px] text-fg placeholder-fg-faint focus:border-accent focus:outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder={t.email}
          className="w-full border-b border-[rgba(0,0,0,0.18)] bg-transparent px-1 py-2.5 text-[14px] text-fg placeholder-fg-faint focus:border-accent focus:outline-none"
        />
        <textarea
          name="message"
          placeholder={t.message}
          rows={3}
          className="w-full border-b border-[rgba(0,0,0,0.18)] bg-transparent px-1 py-2.5 text-[14px] text-fg placeholder-fg-faint focus:border-accent focus:outline-none"
        />
        <button type="submit" className="mt-2 w-full bg-fg py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-bg transition-opacity hover:opacity-90">
          {t.send}
        </button>
      </form>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-fg-faint">
        <span aria-hidden>✳</span>
        StackD
      </div>
      <div className="grid grid-cols-3 border-t border-[rgba(0,0,0,0.08)] text-[11px] uppercase tracking-[0.1em] text-fg-faint">
        {['Work', 'Hello@stackd.dev', '© 2026'].map((t) => (
          <div key={t} className="border-r border-[rgba(0,0,0,0.08)] py-3 text-center last:border-r-0">
            {t}
          </div>
        ))}
      </div>
    </footer>
  )
}
