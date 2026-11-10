'use client'

/**
 * StackD landing, minimal editorial (10 nov 2026). El estilo personal de Arnau (el de
 * arnau-lopez.com: blanco, Helvetica pequeña en mayúsculas, mono para índices, etiquetas en las
 * esquinas, retrato en escala de grises en el centro) con otra composición:
 *   - hero = retrato en el centro con el texto del estudio en las esquinas
 *   - trabajo como fichas: nombre | imagen | ficha etiqueta → valor (rol, año, qué hice, stack)
 *   - otros proyectos en dos columnas, servicios en tres, proceso en fila, FAQ en dos columnas
 * Enfoque de estudio, en primera persona. El contenido (EN/ES) sale de components/copy.ts.
 */

import Image from 'next/image'
import { useState } from 'react'
import { useLanguage } from './language-context'
import { COPY, PROJECTS, QUOTE } from './copy'

const EMAIL = 'lopezsellesarnau@gmail.com'
const PORTFOLIO = 'https://arnau-lopez.com'
const LINKEDIN = 'https://www.linkedin.com/in/arnau-lopez-selles/'

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const
const n2 = (i: number) => String(i + 1).padStart(2, '0')

/** Logotipo: el punto terracota es la marca de StackD. */
function Wordmark() {
  return (
    <>
      StackD<span className="text-accent">.</span>
    </>
  )
}

/** Fila etiqueta → valor, como una ficha */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-4 py-[3px]">
      <span className="text-right text-fg-faint">{label}</span>
      <div className="text-ink">{children}</div>
    </div>
  )
}

/** Cabecera de sección: [ 0n ] a la izquierda, nota a la derecha */
function SectionHead({ n, label, note }: { n: string; label: string; note?: string }) {
  return (
    <div className="frame flex justify-between text-[12px] uppercase">
      <span className="pl-2 text-ink">
        <span className="mono text-accent">[ {n} ]</span> {label}
      </span>
      {note ? <span className="pr-2 text-fg-dim">{note}</span> : null}
    </div>
  )
}

// ── Menu ─────────────────────────────────────────────────────────────────

export function Nav() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang].nav
  const en = lang === 'en'
  const links = [
    ['plans', t.plans],
    ['work', t.work],
    ['process', t.process],
    ['contact', t.contact],
  ] as const

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/90 backdrop-blur-[2px]">
      <div className="frame grid grid-cols-3 py-5 text-[12px] uppercase leading-[1.45] md:grid-cols-6">
        <a href="#top" className="flex items-center gap-2 pl-2 normal-case text-ink">
          {/* Same mark as arnau-lopez.com: StackD is his brand too */}
          <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4" />
          {/* In a span: as two flex items, the gap split the dot from the name */}
          <span>
            <Wordmark />
          </span>
        </a>
        <p className="hidden pl-2 text-fg-faint md:block">{en ? 'Studio of Arnau López' : 'Estudio de Arnau López'}</p>
        <nav className="col-span-2 flex justify-end gap-5 pr-2 md:col-span-4" aria-label="Primary">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hidden text-fg-muted transition-colors hover:text-accent sm:inline">
              {label}
            </a>
          ))}
          <span className="flex gap-2">
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`uppercase transition-colors hover:text-accent ${lang === l ? 'text-ink' : 'text-fg-ghost'}`}
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

// ── Hero: the portrait in the middle, the studio in the corners ──────────

export function Hero() {
  const { lang } = useLanguage()
  const t = COPY[lang].hero

  return (
    <section id="top" className="frame grid min-h-[100svh] grid-rows-[1fr_auto_1fr] pb-10 pt-24 text-[12px] uppercase">
      <div className="flex items-start justify-between gap-8 px-2">
        <h1 className="max-w-[26ch] font-normal leading-[1.35] text-ink">{t.title}</h1>
        <ul className="hidden text-right text-fg-dim md:block">
          {t.meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>

      <figure className="flex flex-col items-center gap-3 py-10">
        <Image src="/arnau.jpg" alt="Arnau López" width={180} height={240} priority className="h-auto w-[130px] grayscale md:w-[170px]" />
        <figcaption className="mono text-[11px] text-fg-dim">Arnau López · StackD.</figcaption>
      </figure>

      <div className="flex items-end justify-between gap-8 px-2">
        <p className="max-w-[40ch] normal-case leading-[1.5] text-fg-muted">{t.body}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <a href="#plans" className="text-ink transition-colors hover:text-accent">
            {t.plans} ↓
          </a>
          <a href="#contact" className="text-fg-dim transition-colors hover:text-accent">
            {t.cta} →
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Work ─────────────────────────────────────────────────────────────────

export function Work() {
  const { lang } = useLanguage()
  const t = COPY[lang].work
  const en = lang === 'en'

  return (
    <section id="work" className="scroll-mt-16 py-24">
      <SectionHead n="02" label={t.label} note={`${t.items.length} ${en ? 'cases' : 'casos'}`} />

      <div className="frame mt-14 space-y-20">
        {t.items.map((item, i) => {
          const p = PROJECTS[item.id]
          return (
            <article key={item.id} className="grid gap-6 border-t border-line pt-5 text-[12px] md:grid-cols-12">
              <h3 className="pl-2 uppercase text-ink md:col-span-2">
                <span className="mono text-fg-faint">{n2(i)}</span>
                <br />
                {p.name}
              </h3>

              <a href={p.link} {...ext} className="group block overflow-hidden bg-card md:col-span-6" aria-label={`${t.open} ${p.name}`}>
                <Image
                  src={p.image}
                  alt={`${p.name}, ${item.kind}`}
                  width={p.w}
                  height={p.h}
                  sizes="(min-width: 768px) 600px, 100vw"
                  className="h-auto w-full transition-opacity duration-300 group-hover:opacity-90"
                />
              </a>

              <div className="space-y-4 md:col-span-4">
                <div className="uppercase">
                  <Row label={en ? 'Role' : 'Rol'}>{item.role}</Row>
                  <Row label={en ? 'When' : 'Cuándo'}>{item.when}</Row>
                  <Row label={en ? 'What' : 'Qué'}>{item.kind}</Row>
                </div>
                <p className="leading-[1.55] text-fg-muted">{item.summary}</p>
                <div>
                  <p className="uppercase text-fg-faint">{t.did}</p>
                  <ul className="mt-1 space-y-1 text-ink">
                    {item.did.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="text-accent" aria-hidden>
                          )
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mono text-[11px] uppercase text-fg-dim">{p.stack.join(' · ')}</p>
                <a
                  href={p.link}
                  {...ext}
                  className="inline-block uppercase text-ink underline decoration-1 underline-offset-4 hover:text-accent"
                >
                  {t.open} {p.name} ↗
                </a>
                {p.certificate ? (
                  <a
                    href={p.certificate}
                    {...ext}
                    className="ml-5 inline-block uppercase text-fg-dim underline decoration-1 underline-offset-4 hover:text-accent"
                  >
                    {t.certificate} ↗
                  </a>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ── Plans ────────────────────────────────────────────────────────────────

export function Plans() {
  const { lang } = useLanguage()
  const t = COPY[lang].plans

  return (
    <section id="plans" className="scroll-mt-16 py-24">
      <SectionHead n="01" label={t.label} note={t.note} />
      <p className="frame mt-10 text-[12px] uppercase text-ink">
        <span className="block max-w-[44ch] pl-2">{t.intro}</span>
      </p>
      <div className="frame mt-10">
        <div className="grid gap-px border border-line bg-line text-[12px] md:grid-cols-3">
          {t.items.map((plan, i) => (
            <div key={plan.t} className={`flex flex-col gap-5 px-5 py-6 ${i === 2 ? 'bg-ink text-paper' : 'bg-paper'}`}>
              <div>
                <p className={`mono text-[11px] ${i === 2 ? 'text-accent' : 'text-fg-faint'}`}>{`[ ${n2(i)} ]`}</p>
                <h3 className="mt-2 text-[15px] uppercase">{plan.t}</h3>
                <p className={`mt-2 leading-[1.55] ${i === 2 ? 'text-paper/70' : 'text-fg-muted'}`}>{plan.for}</p>
              </div>
              <div>
                <p className={`uppercase ${i === 2 ? 'text-paper/50' : 'text-fg-faint'}`}>{t.includes}</p>
                <ul className="mt-2 space-y-1">
                  {plan.includes.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="text-accent" aria-hidden>
                        )
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto">
                <p className={`uppercase ${i === 2 ? 'text-paper/50' : 'text-fg-faint'}`}>{t.get}</p>
                <p className="mt-1">{plan.get}</p>
                <a
                  href="#contact"
                  className={`mt-5 inline-block uppercase underline decoration-1 underline-offset-4 transition-colors hover:text-accent`}
                >
                  {COPY[lang].hero.cta} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="frame mt-4 text-[12px] text-fg-dim">
        <span className="pl-2">{t.after}</span>
      </p>
    </section>
  )
}

// ── Quote ────────────────────────────────────────────────────────────────

export function Quote() {
  return (
    <section aria-label="Quote" className="frame flex min-h-[50svh] flex-col items-center justify-center py-24 text-center">
      <blockquote className="max-w-[34ch] text-[15px] uppercase leading-[1.4] text-ink">“{QUOTE.text}”</blockquote>
      <p className="mono mt-5 text-[11px] uppercase text-fg-dim">
        {QUOTE.who} · {QUOTE.where}
      </p>
    </section>
  )
}

// ── Process ──────────────────────────────────────────────────────────────

export function Process() {
  const { lang } = useLanguage()
  const t = COPY[lang].process

  return (
    <section id="process" className="scroll-mt-16 py-24">
      <SectionHead n="03" label={t.label} />
      <ol className="frame mt-10 grid gap-8 text-[12px] md:grid-cols-4">
        {t.steps.map((s, i) => (
          <li key={s.t} className="px-2">
            <p className="uppercase text-ink">
              <span className="text-fg-ghost">{i + 1})</span> {s.t}
            </p>
            <p className="mt-2 max-w-[30ch] leading-[1.55] text-fg-muted">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────

export function Faq() {
  const { lang } = useLanguage()
  const t = COPY[lang].faq

  return (
    <section id="faq" className="py-24">
      <SectionHead n="04" label={t.label} />
      <dl className="frame mt-10 text-[12px]">
        {t.items.map((f) => (
          <div key={f.q} className="grid gap-2 border-t border-line px-2 py-4 md:grid-cols-[1fr_2fr]">
            <dt className="uppercase text-ink">{f.q}</dt>
            <dd className="max-w-[60ch] leading-[1.55] text-fg-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// ── Other projects ───────────────────────────────────────────────────────

export function Other() {
  const { lang } = useLanguage()
  const o = COPY[lang].other

  return (
    <section id="other" className="py-24">
      <div>
        <SectionHead n="05" label={o.label} />
        <div className="frame mt-10 grid gap-10 text-[12px] md:grid-cols-2">
          {o.items.map((item) => {
            const p = PROJECTS[item.id]
            return (
              <a key={item.id} href={p.link} {...ext} className="group block border-t border-line pt-5">
                <div className="aspect-[16/10] overflow-hidden bg-card">
                  <Image
                    src={p.image}
                    alt={`${p.name}, ${item.kind}`}
                    width={p.w}
                    height={p.h}
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                  />
                </div>
                <div className="mt-4 flex justify-between px-2 uppercase">
                  <span className="text-ink group-hover:text-accent">{p.name} ↗</span>
                  <span className="text-fg-dim">{item.kind}</span>
                </div>
                <p className="mt-2 max-w-[52ch] px-2 leading-[1.55] text-fg-muted">{item.summary}</p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Contact ──────────────────────────────────────────────────────────────

export function Contact() {
  const { lang } = useLanguage()
  const t = COPY[lang].contact
  const [sent, setSent] = useState(false)
  const field = 'w-full bg-transparent text-ink outline-none placeholder:text-fg-ghost'

  return (
    <section id="contact" className="flex min-h-[90svh] scroll-mt-16 flex-col justify-between py-24">
      <SectionHead n="06" label={t.title} />

      <div className="mx-auto my-16 w-[min(400px,calc(100%-2rem))] text-[11px] uppercase leading-[1.45]">
        <p className="mb-4 text-center text-[12px] normal-case text-fg-muted">{t.body}</p>
        <div className="bg-card px-3 py-3">
          {sent ? (
            <p className="px-2 py-1 normal-case text-fg-muted">{t.sent(EMAIL)}</p>
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
              <label className="grid grid-cols-[6.5rem_1fr] gap-x-4 py-[3px]">
                <span className="text-right text-fg-faint">{t.name}</span>
                <input name="name" required className={field} />
              </label>
              <label className="grid grid-cols-[6.5rem_1fr] gap-x-4 py-[3px]">
                <span className="text-right text-fg-faint">{t.email}</span>
                <input name="email" type="email" required className={`${field} normal-case`} />
              </label>
              <label className="grid grid-cols-[6.5rem_1fr] gap-x-4 py-[3px]">
                <span className="text-right text-fg-faint">{t.message}</span>
                <textarea name="message" rows={3} required className={`${field} resize-none normal-case`} />
              </label>
              <div className="grid grid-cols-[6.5rem_1fr] gap-x-4 pt-2">
                <span />
                <button type="submit" className="text-left uppercase text-ink transition-colors hover:text-accent">
                  {t.send} →
                </button>
              </div>
            </form>
          )}
          <div className="mt-3 border-t border-paper pt-3">
            <Row label="Email">
              <a href={`mailto:${EMAIL}`} className="normal-case hover:text-accent">
                {EMAIL}
              </a>
            </Row>
            <Row label="LinkedIn">
              <a href={LINKEDIN} {...ext} className="hover:text-accent">
                arnau-lopez-selles
              </a>
            </Row>
            <Row label="Portfolio">
              <a href={PORTFOLIO} {...ext} className="hover:text-accent">
                arnau-lopez.com
              </a>
            </Row>
          </div>
        </div>
      </div>

      <div className="frame flex justify-between text-[11px] uppercase text-fg-dim">
        <span className="pl-2">
          <Wordmark /> · Arnau López · Amsterdam
        </span>
        <span className="pr-2">© 2026</span>
      </div>
    </section>
  )
}
