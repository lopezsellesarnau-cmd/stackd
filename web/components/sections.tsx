'use client'

/**
 * StackD landing — lenguaje "minimal espacio abierto" (5 oct 2026), el mismo
 * que arnau-lopez.com (vault: Diseño/10-minimal-espacio-abierto): papel casi
 * blanco, Helvetica pequeña, mono para números, rejilla invisible de 6
 * columnas, una pantalla por sección con etiquetas en las esquinas.
 *
 * Coherente con el portfolio pero no un espejo:
 *   - acento terracota de StackD (#C1663D) y el punto del logotipo
 *   - Services en tres columnas, Process como fila de pasos (no hitos)
 *   - contacto con formulario dentro del bloque gris, y selector EN/ES
 * El contenido (bilingüe EN/ES) sale de components/copy.ts.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from './language-context'
import { COPY } from './copy'

const EMAIL = 'lopezsellesarnau@gmail.com'
const PORTFOLIO = 'https://arnau-lopez.com'
const LINKEDIN = 'https://www.linkedin.com/in/arnau-lopez-selles/'

const ext = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

/** Logotipo: el punto terracota es la marca de StackD. */
function Wordmark() {
  return (
    <>
      StackD<span className="text-accent">.</span>
    </>
  )
}

/** Fila etiqueta/valor del bloque gris (popup y contacto). */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-[3px]">
      <span className="text-right text-fg-faint">{label}</span>
      <div className="text-ink">{children}</div>
    </div>
  )
}

// ── Menu ─────────────────────────────────────────────────────────────────

const LINKS = ['work', 'services', 'process', 'contact'] as const

export function Nav() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang].nav
  const en = lang === 'en'
  const labels: Record<(typeof LINKS)[number], string> = {
    work: t.work,
    services: t.services,
    process: en ? 'Process' : 'Proceso',
    contact: t.contact,
  }
  const [active, setActive] = useState('')

  useEffect(() => {
    const els = LINKS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/85 backdrop-blur-[2px]">
      <div className="frame grid grid-cols-3 py-5 text-[12px] leading-[1.45] md:grid-cols-6">
        <a href="#top" className="pl-2 text-ink">
          <Wordmark />
        </a>
        <p className="hidden pl-2 text-fg-faint md:block">
          {en ? 'Freelance software' : 'Software freelance'}
          <br />
          {en ? 'by Arnau López' : 'por Arnau López'}
        </p>
        <nav className="col-span-2 flex items-start justify-end gap-5 pr-2 md:col-span-4" aria-label="Primary">
          {LINKS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className={`hidden transition-colors hover:text-accent sm:inline ${active === id ? 'text-ink underline decoration-1 underline-offset-[6px]' : 'text-fg-muted'}`}
            >
              {labels[id]}
            </a>
          ))}
          <span className="flex gap-2 uppercase">
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`transition-colors hover:text-accent ${lang === l ? 'text-ink' : 'text-fg-ghost'}`}
              >
                {l}
              </button>
            ))}
          </span>
        </nav>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────

export function Hero() {
  const { lang } = useLanguage()
  const t = COPY[lang].hero
  const en = lang === 'en'
  const notes: { n: string; lines: string[]; pos: string }[] = [
    { n: '1', lines: ['BlockFlow', en ? 'SaaS · in production' : 'SaaS · en producción'], pos: 'md:col-start-1 md:row-start-1' },
    { n: '2', lines: ['Kiblo · TRACE', en ? 'iOS · live on the App Store' : 'iOS · en la App Store'], pos: 'md:col-start-2 md:row-start-2' },
    { n: '3', lines: ['Dross', en ? 'Mac app · notarized' : 'App Mac · notarizada'], pos: 'md:col-start-1 md:row-start-3' },
    { n: '4', lines: [en ? 'Status' : 'Estado', en ? 'Taking work' : 'Con hueco'], pos: 'md:col-start-2 md:row-start-4' },
  ]

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col pt-28">
      <div className="frame text-center">
        <h1 className="text-[clamp(1.25rem,2.6vw,1.75rem)] font-normal uppercase leading-[1.15] tracking-[-0.01em] text-ink">
          <Wordmark />
          <br />
          {en ? 'Freelance software development' : 'Desarrollo de software freelance'}
        </h1>
        <p className="mt-3 text-[12px] uppercase tracking-[0.04em] text-fg-dim">
          {en ? 'Web · Mobile · AI · ' : 'Web · Móvil · IA · '}
          {t.location.replace(/[[\]]/g, '').trim()}
        </p>
      </div>

      <div className="frame mt-16 grid grid-cols-2 content-start gap-y-10 pb-16 md:mt-20 md:grid-cols-6 md:gap-y-12">
        {notes.map((h) => (
          <p key={h.n} className={`mono pl-2 text-[11px] uppercase leading-[1.55] text-fg-muted ${h.pos}`}>
            <span className="mr-3 text-accent">{h.n}</span>
            {h.lines.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </p>
        ))}
        <div className="col-span-2 max-w-[36ch] pl-2 md:col-span-2 md:col-start-5 md:row-start-3">
          <p className="text-[12px] leading-[1.6] text-fg-muted">{t.body}</p>
          <p className="mt-4 flex gap-5 text-[12px] uppercase">
            <a href="#work" className="text-ink underline decoration-fg-ghost underline-offset-4 hover:text-accent">
              {en ? 'See work' : 'Ver trabajo'}
            </a>
            <a href="#contact" className="text-ink underline decoration-fg-ghost underline-offset-4 hover:text-accent">
              {en ? "Let's talk" : 'Hablemos'}
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Services ─────────────────────────────────────────────────────────────

export function Services() {
  const { lang } = useLanguage()
  const t = COPY[lang].services
  const s = COPY[lang].stats
  return (
    <section id="services" className="relative flex min-h-[100svh] flex-col justify-between py-24">
      <p className="frame text-[12px] uppercase text-ink">
        <span className="pl-2">{t.eyebrow}</span>
      </p>

      <div className="frame my-16 grid gap-y-12 md:grid-cols-6">
        {t.items.map((it, i) => (
          <div key={it.t} className="pl-2 pr-6 md:col-span-2">
            <p className="mono text-[10px] text-fg-faint">{String(i + 1).padStart(2, '0')}</p>
            <h2 className="mt-2 text-[13px] font-normal uppercase text-ink">{it.t}</h2>
            <p className="mono mt-3 text-[10px] uppercase leading-[1.6] text-fg-dim">{it.tags.join(' · ')}</p>
            <p className="mt-3 max-w-[34ch] text-[11px] leading-[1.55] text-fg-muted">{it.stat}</p>
          </div>
        ))}
      </div>

      <div className="frame grid gap-y-4 text-[12px] uppercase md:grid-cols-6">
        {s.items.map((x) => (
          <p key={x.l} className="pl-2 pr-6 text-fg-dim md:col-span-2">
            <span className="mr-2 text-ink">{x.v}</span>
            {x.l}
          </p>
        ))}
      </div>
    </section>
  )
}

// ── Work ─────────────────────────────────────────────────────────────────

const WORK_META: Record<string, { name: string; kind: string; stack: string[]; year: string; link?: string; linkLabel?: string }> = {
  blockflow: { name: 'BlockFlow', kind: 'SaaS · AI voice agent', stack: ['Next.js', 'Supabase', 'LLM', 'Voice AI'], year: '2026' },
  kiblo: {
    name: 'Kiblo',
    kind: 'iOS app',
    stack: ['React Native', 'Expo', 'TypeScript', 'Firebase'],
    year: '2026',
    link: 'https://apps.apple.com/app/id6802237827',
    linkLabel: 'App Store',
  },
  trace: {
    name: 'TRACE',
    kind: 'iOS app · privacy',
    stack: ['React Native', 'TypeScript', 'Firebase'],
    year: '2026',
    link: 'https://github.com/lopezsellesarnau-cmd/trace-app',
    linkLabel: 'Repository',
  },
  dross: {
    name: 'Dross',
    kind: 'Mac app · dev tool',
    stack: ['SwiftUI', 'macOS', 'TypeScript'],
    year: '2026',
    link: 'https://github.com/lopezsellesarnau-cmd/dross',
    linkLabel: 'Repository',
  },
}

type Caso = { which: string; index: string; caption: string }

function ProjectCard({ caso, en, onClose }: { caso: Caso; en: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const m = WORK_META[caso.which]

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/70 px-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={m.name}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[78vh] w-[min(470px,100%)] overflow-y-auto bg-card px-5 py-5 text-[11px] uppercase leading-[1.45] tracking-[0.01em] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 uppercase text-fg-faint transition-colors hover:text-ink"
        >
          {en ? 'Close' : 'Cerrar'}
        </button>
        <Row label={caso.index}>
          {m.name}
          <span className="block text-fg-dim">{m.kind}</span>
        </Row>
        <Row label={en ? 'Status' : 'Estado'}>{en ? 'In production' : 'En producción'}</Row>
        <div className="h-3" />
        <Row label={en ? 'What' : 'Qué'}>
          <span className="normal-case">{caso.caption}</span>
        </Row>
        <div className="h-3" />
        <Row label="Stack">{m.stack.join(', ')}</Row>
        <Row label={en ? 'Year' : 'Año'}>{m.year}</Row>
        {m.link && (
          <Row label="Link">
            <a href={m.link} {...ext(m.link)} className="underline decoration-fg-ghost underline-offset-2 hover:text-accent">
              {m.linkLabel} ↗
            </a>
          </Row>
        )}
      </div>
    </div>
  )
}

export function WorksGrid() {
  const { lang } = useLanguage()
  const t = COPY[lang].works
  const en = lang === 'en'
  const [openKey, setOpenKey] = useState<string | null>(null)
  const close = useCallback(() => setOpenKey(null), [])
  const open = t.rows.find((r) => r.which === openKey) ?? null

  return (
    <section id="work" className="relative flex min-h-[100svh] flex-col justify-between py-24">
      <p className="frame text-[12px] uppercase text-ink">
        <span className="pl-2">{en ? 'Selected work' : 'Trabajo seleccionado'}</span>
      </p>

      <ul className="mx-auto my-16 flex flex-col items-center gap-[6px] text-center text-[12px] font-medium uppercase leading-[1.3] tracking-[0.01em]">
        {t.rows.map((r) => (
          <li key={r.which}>
            <button
              type="button"
              onClick={() => setOpenKey(r.which)}
              className={`relative inline-block font-medium uppercase transition-colors hover:text-accent ${openKey && openKey !== r.which ? 'text-fg-ghost' : 'text-ink'}`}
            >
              <span className="mono absolute right-full top-[1px] mr-3 text-[10px] font-normal text-fg-faint">{r.index}</span>
              {WORK_META[r.which].name}
              <span className="ml-3 font-normal text-fg-faint">{WORK_META[r.which].kind}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="frame flex justify-between text-[12px] uppercase">
        <span className="pl-2 text-ink">
          {String(t.rows.length).padStart(2, '0')} {en ? 'projects' : 'proyectos'}
          <span className="ml-4 text-fg-dim">2024–2026</span>
        </span>
        <span className="pr-2 text-fg-dim">{en ? 'Press a project' : 'Pulsa un proyecto'}</span>
      </div>

      {open && <ProjectCard caso={open} en={en} onClose={close} />}
    </section>
  )
}

// ── Process + valores ────────────────────────────────────────────────────

export function Process() {
  const { lang } = useLanguage()
  const p = COPY[lang].process
  const v = COPY[lang].values
  return (
    <section id="process" className="relative flex min-h-[100svh] flex-col justify-between py-24">
      <p className="frame text-[12px] uppercase text-ink">
        <span className="pl-2">{p.title}</span>
      </p>

      <ol className="frame my-16 grid gap-y-8 md:grid-cols-4">
        {p.steps.map((s, i) => (
          <li key={s.t} className="pl-2 pr-6">
            <p className="text-[13px] text-ink">
              <span className="mono mr-2 text-[11px] text-accent">{String(i + 1).padStart(2, '0')}</span>
              {s.t} <span className="ml-1 text-fg-faint">)</span>
            </p>
            <p className="mt-2 max-w-[26ch] text-[11px] leading-[1.45] text-fg-dim">{s.d}</p>
          </li>
        ))}
      </ol>

      <div className="frame grid gap-y-8 md:grid-cols-6">
        {v.items.map((it) => (
          <div key={it.t} className="pl-2 pr-6 md:col-span-2">
            <p className="text-[12px] uppercase text-ink">{it.t}</p>
            <p className="mt-2 max-w-[34ch] text-[11px] leading-[1.5] text-fg-muted">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Stack + FAQ ──────────────────────────────────────────────────────────

const STACK = [
  'TypeScript', 'Next.js', 'React', 'React Native', 'Expo', 'Python', 'FastAPI',
  'Node.js', 'Postgres', 'Supabase', 'Firebase', 'SwiftUI', 'OpenAI', 'Anthropic', 'Vercel',
]

export function Faq() {
  const { lang } = useLanguage()
  const t = COPY[lang].faq
  const s = COPY[lang].techStack
  return (
    <section id="faq" className="relative py-32">
      <div className="frame grid gap-y-16 md:grid-cols-6">
        <h2 className="pl-2 text-[clamp(1.1rem,2vw,1.4rem)] font-normal uppercase text-ink md:col-span-2">Stack</h2>
        <div className="pl-2 pr-6 md:col-span-4">
          <p className="mono text-[10px] uppercase text-fg-faint">{s.eyebrow}</p>
          <p className="mono mt-2 max-w-[60ch] text-[11px] uppercase leading-[1.6] text-ink">{STACK.join(', ')}</p>
        </div>

        <h2 className="pl-2 text-[clamp(1.1rem,2vw,1.4rem)] font-normal uppercase text-ink md:col-span-2">{t.eyebrow}</h2>
        <div className="md:col-span-4">
          {t.items.map((it, i) => (
            <details key={it.q} className="group pl-2 pr-6 [&:not(:first-child)]:mt-3">
              <summary className="flex cursor-pointer list-none items-baseline gap-3 text-[12px] uppercase text-ink transition-colors hover:text-accent">
                <span className="mono text-[10px] text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
                {it.q}
                <span aria-hidden className="text-fg-faint transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-[52ch] pl-[26px] text-[11px] leading-[1.55] text-fg-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contact ──────────────────────────────────────────────────────────────

export function Contact() {
  const { lang } = useLanguage()
  const t = COPY[lang].contact
  const en = lang === 'en'
  const [sent, setSent] = useState(false)
  const field = 'w-full bg-transparent text-ink outline-none placeholder:text-fg-ghost'

  return (
    <section id="contact" className="relative flex min-h-[90svh] flex-col justify-between py-24">
      <p className="frame text-[12px] uppercase text-ink">
        <span className="pl-2">
          {t.eyebrow} {t.title}
        </span>
      </p>

      <div className="mx-auto my-16 w-[min(380px,calc(100%-2rem))] bg-card px-3 py-3 text-[11px] uppercase leading-[1.45]">
        {sent ? (
          <p className="px-2 py-1 normal-case text-fg-muted">
            {en ? `Your mail client should have opened. If not, write me at ${EMAIL}.` : `Se habrá abierto tu correo. Si no, escríbeme a ${EMAIL}.`}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const subject = encodeURIComponent(`StackD | ${data.get('name') || ''}`)
              const body = encodeURIComponent(`${data.get('message') || ''}\n\n${data.get('email') || ''}`)
              window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
              setSent(true)
            }}
          >
            <label className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-[3px]">
              <span className="text-right text-fg-faint">{t.name}</span>
              <input name="name" required className={field} />
            </label>
            <label className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-[3px]">
              <span className="text-right text-fg-faint">{t.email}</span>
              <input name="email" type="email" required className={`${field} normal-case`} />
            </label>
            <label className="grid grid-cols-[5.5rem_1fr] gap-x-4 py-[3px]">
              <span className="text-right text-fg-faint">{t.message}</span>
              <textarea name="message" rows={3} required className={`${field} resize-none normal-case`} />
            </label>
            <div className="grid grid-cols-[5.5rem_1fr] gap-x-4 pt-2">
              <span />
              <button type="submit" className="text-left uppercase text-ink transition-colors hover:text-accent">
                {t.send} →
              </button>
            </div>
          </form>
        )}
        <div className="mt-3 border-t border-paper pt-3">
          <Row label="Email">
            <a href={`mailto:${EMAIL}`} className="hover:text-accent">
              {EMAIL}
            </a>
          </Row>
          <Row label="LinkedIn">
            <a href={LINKEDIN} {...ext(LINKEDIN)} className="hover:text-accent">
              arnau-lopez-selles
            </a>
          </Row>
          <Row label="Portfolio">
            <a href={PORTFOLIO} {...ext(PORTFOLIO)} className="hover:text-accent">
              arnau-lopez.com
            </a>
          </Row>
        </div>
      </div>

      <div className="frame flex justify-between text-[11px] uppercase text-fg-dim">
        <span className="pl-2">
          <Wordmark /> · Arnau López
        </span>
        <span className="pr-2">© 2026</span>
      </div>
    </section>
  )
}
