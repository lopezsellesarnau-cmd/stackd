'use client'

/**
 * StackD landing — estética "ficha técnica" (misma que el /lab de Aithority;
 * el manual del lenguaje está en el vault, carpeta Sistema-UI):
 * hueso #F0EEE9, tinta #111, terracota #C1663D como único acento, IBM Plex Mono
 * como lenguaje de etiquetado, retícula visible con hairlines y grano de píxel.
 *
 * El contenido (bilingüe EN/ES) no cambia — sale de components/copy.ts. Lo que
 * cambia es el lenguaje visual. La planta de puntos del hero se porta tal cual
 * desde Aithority (components/dot-tree.tsx).
 */

import { useEffect, useRef, useState } from 'react'
import { DotTree } from './dot-tree'
import { FolderStack } from './folder-stack'
import { AsciiIcon } from './halftone-icon'
import { AgentDashboards } from './agent-dashboards'
import { AgencyTree } from './agency-tree'
import { useLanguage } from './language-context'
import { COPY } from './copy'

const TERRA = '#C1663D'
const INK = '#111111'
const BONE = '#F0EEE9'
const LINE = 'rgba(17,17,17,0.22)'
const HAIR = 'rgba(17,17,17,0.14)'

// ── Piezas compartidas ──────────────────────────────────────────────────

/** Etiqueta de sección numerada. */
function SectionTag({ n, label }: { n: string; label: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em]">
      <span style={{ color: TERRA }}>{n}</span>
      <span className="text-[rgba(17,17,17,0.5)]">{label}</span>
    </p>
  )
}

/** Barra de ticks — cada tick es una unidad, no un píxel de porcentaje. */
function TickBar({ pct, ticks = 40, delay = 0 }: { pct: number; ticks?: number; delay?: number }) {
  const filled = Math.round((pct / 100) * ticks)
  return (
    <div className="flex w-full items-stretch gap-[2px]" aria-hidden>
      {Array.from({ length: ticks }).map((_, i) => (
        <span
          key={i}
          className={`h-[18px] flex-1 ${i < filled ? 'tick-fill' : ''}`}
          style={{
            backgroundColor: i < filled ? INK : 'rgba(17,17,17,0.13)',
            animationDelay: `${delay + i * 12}ms`,
          }}
        />
      ))}
    </div>
  )
}

/** Reveal por viewport: añade .ficha-live cuando entra en pantalla. */
function useLive() {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLive(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, live }
}

// ── Nav ──────────────────────────────────────────────────────────────────

export function Nav() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang].nav
  return (
    <header className="sticky top-0 z-40 border-b bg-[#F0EEE9]" style={{ borderColor: LINE }}>
      <nav className="flex items-center justify-between px-5 py-3.5 md:px-7" aria-label="Primary">
        <a href="#top" className="text-[15px] font-medium tracking-[-0.02em] text-[#111]">
          StackD
        </a>

        <div className="flex items-center gap-5">
          {[
            [t.work, '#work'],
            [t.services, '#services'],
            [t.contact, '#contact'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="hidden font-mono text-[10.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.55)] transition-colors hover:text-[#111] sm:inline"
            >
              {label}
            </a>
          ))}
          <div className="flex items-center gap-px border" style={{ borderColor: HAIR }}>
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
                style={lang === l ? { backgroundColor: INK, color: BONE } : { color: 'rgba(17,17,17,0.5)' }}
                aria-pressed={lang === l}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────

function MetaRow({ items }: { items: [string, string][] }) {
  return (
    <div
      className="grid grid-cols-2 border-y font-mono text-[10.5px] uppercase tracking-[0.14em] md:grid-cols-4"
      style={{ borderColor: LINE }}
    >
      {items.map(([k, v], i) => (
        <div
          key={k}
          className={`px-5 py-3 md:px-7 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:border-r md:last:border-r-0`}
          style={{ borderColor: LINE }}
        >
          <span className="text-[rgba(17,17,17,0.45)]">{k}</span>
          <span className="ml-2 text-[#111]">{v}</span>
        </div>
      ))}
    </div>
  )
}

export function Hero() {
  const { lang } = useLanguage()
  const t = COPY[lang].hero
  const en = lang === 'en'
  return (
    <section id="top" className="border-b" style={{ borderColor: LINE }}>
      {/* La planta se queda encerrada aquí para no desbordar la sección. */}
      <div className="relative overflow-hidden">
        <DotTree />
        <div className="relative mx-auto max-w-[1260px] px-5 pb-14 pt-16 md:px-7 md:pt-24">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[rgba(17,17,17,0.5)]">
            <span>{en ? 'Type: studio / ai software' : 'Tipo: estudio / software ia'}</span>
            <span className="hidden sm:inline">Est. 2026</span>
            <span className="border px-2 py-0.5 text-[#111]" style={{ borderColor: 'rgba(17,17,17,0.3)' }}>
              {t.location.replace(/[[\]]/g, '').trim()}
            </span>
          </div>

          <h1 className="mt-8 max-w-4xl font-display text-[clamp(3rem,10vw,7rem)] leading-[0.92] tracking-[-0.04em] text-[#111]">
            StackD<span style={{ color: TERRA }}>.</span>
          </h1>

          <p className="mt-7 max-w-xl font-mono text-[12.5px] leading-relaxed text-[rgba(17,17,17,0.65)]">
            {t.body}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#work" className="btn-solid">
              {en ? 'See work →' : 'Ver trabajos →'}
            </a>
            <a href="#contact" className="btn-ghost">
              {en ? "Let's talk →" : 'Hablar →'}
            </a>
          </div>

          {/* En móvil la planta baja como franja propia (no cabe al lado). */}
          <div className="mt-10 md:hidden">
            <DotTree variant="band" />
          </div>
        </div>
      </div>

      <MetaRow
        items={[
          [en ? 'Clients' : 'Clientes', '4'],
          [en ? 'Delivery' : 'Entrega', en ? '~1 week start' : '~1 sem inicio'],
          [en ? 'Ownership' : 'Propiedad', en ? 'Full IP → you' : 'IP → tuya'],
          ['Status', en ? 'Taking work' : 'Con hueco'],
        ]}
      />
    </section>
  )
}

// ── Services ───────────────────────────────────────────────────────────────

export function Services() {
  const { lang } = useLanguage()
  const t = COPY[lang].services
  const { ref, live } = useLive()
  // "Madurez" de cada línea de servicio — da lectura de instrumento a la sección.
  const load = [92, 80, 96]

  return (
    <section id="services" className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div ref={ref} className={`mx-auto max-w-[1260px] px-5 md:px-7 ${live ? 'ficha-live' : ''}`}>
        <SectionTag n="01" label={t.eyebrow} />

        <div className="mt-8 border-t" style={{ borderColor: LINE }}>
          {t.items.map((it, i) => (
            <div
              key={it.t}
              className="grid gap-4 border-b py-6 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-10"
              style={{ borderColor: HAIR }}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[11px] text-[rgba(17,17,17,0.4)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="font-display text-[clamp(1.8rem,5vw,3rem)] leading-[0.95] tracking-[-0.03em] text-[#111]">
                  {it.t}
                </h2>
              </div>

              <div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.55)]">
                  {it.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5">
                      <span className="h-1 w-1" style={{ backgroundColor: TERRA }} aria-hidden />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <TickBar pct={load[i]} delay={i * 120} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Works ──────────────────────────────────────────────────────────────────

const WORK_META: Record<string, { nombre: string; tag: string; status: string }> = {
  blockflow: { nombre: 'BlockFlow', tag: 'AI voice agent', status: 'live' },
  staging: { nombre: 'Content Engine', tag: 'Virtual staging & video', status: 'live' },
  leadagent: { nombre: 'Lead Agent', tag: 'Instant lead response', status: 'build' },
}

function StatusChip({ status, en }: { status: string; en: boolean }) {
  const live = status === 'live'
  const label = live ? (en ? 'In production' : 'En producción') : en ? 'In build' : 'En desarrollo'
  const color = live ? '#3F7A4E' : TERRA
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em]"
      style={{ borderColor: color, color }}
    >
      <span className="h-1 w-1" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}

export function WorksGrid() {
  const { lang } = useLanguage()
  const t = COPY[lang].works
  const en = lang === 'en'
  return (
    <section id="work" className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="02" label={t.marquee} />

        {/* Los trabajos SON las carpetas del archivador. Antes cada uno llevaba
            su mockup pequeño, pero desde que la sección 03 enseña dashboards
            completos aquellos restaban en vez de sumar. */}
        <div className="mt-10">
          <FolderStack
            en={en}
            carpetas={t.rows.map((r, i) => ({
              n: r.index,
              nombre: WORK_META[r.which].nombre,
              tipo: WORK_META[r.which].tag,
              estado: WORK_META[r.which].status as 'live' | 'build',
              texto: r.caption,
              left: ['6%', '30%', '17%', '46%'][i],
            }))}
          />
        </div>
      </div>
    </section>
  )
}

// ── Agentes: qué podemos construir ─────────────────────────────────────────

export function Agents() {
  const { lang } = useLanguage()
  const en = lang === 'en'
  return (
    <section id="agents" className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="03" label={en ? 'What we can build for you' : 'Lo que podemos construir'} />
        <p className="mt-6 max-w-[64ch] font-mono text-[11.5px] leading-relaxed text-[rgba(17,17,17,0.6)]">
          {en
            ? 'Three agents we build over and over. Not chatbots: systems that decide, act and explain why — with a dashboard where you see every decision.'
            : 'Tres agentes que construimos una y otra vez. No son chatbots: son sistemas que deciden, actúan y explican por qué — con un panel donde se ve cada decisión.'}
        </p>
        <div className="mt-8">
          <AgentDashboards en={en} />
        </div>
      </div>
    </section>
  )
}

// ── Árbol: qué se automatiza y qué no ──────────────────────────────────────

export function Pipeline() {
  const { lang } = useLanguage()
  const en = lang === 'en'
  return (
    <section className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="04" label={en ? 'Where we stop' : 'Dónde paramos'} />
        <p className="mt-6 max-w-[64ch] font-mono text-[11.5px] leading-relaxed text-[rgba(17,17,17,0.6)]">
          {en
            ? 'A real pipeline, drawn honestly: what the agent publishes on its own, what waits for approval, and what goes to a person. The dotted branch is the point.'
            : 'Un flujo real, dibujado con honestidad: qué publica el agente solo, qué espera aprobación y qué va a una persona. La rama punteada es justo lo importante.'}
        </p>
        <div className="mt-8">
          <AgencyTree en={en} />
        </div>
      </div>
    </section>
  )
}

// ── Valores ──────────────────────────────────────────────────────────────

export function Values() {
  const { lang } = useLanguage()
  const t = COPY[lang].values
  return (
    <section className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="05" label={t.title} />
        <p className="mt-6 max-w-md font-mono text-[11.5px] leading-relaxed text-[rgba(17,17,17,0.6)]">
          {t.body}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
          <AsciiIcon
            shape="housemod"
            seed={2026}
            cols={64}
            rows={34}
            className="mx-auto select-none text-[7px] leading-none text-[#111] sm:text-[8px]"
          />

          <div className="grid gap-8 sm:grid-cols-3 lg:gap-6">
            {t.items.map((it, i) => (
              <div key={it.t}>
                <p className="font-mono text-[10.5px] text-[rgba(17,17,17,0.4)]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-[19px] font-medium tracking-[-0.02em] text-[#111]">{it.t}</h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-[rgba(17,17,17,0.6)]">{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Tech stack ─────────────────────────────────────────────────────────────

export function TechStack() {
  const { lang } = useLanguage()
  const t = COPY[lang].techStack
  const stack = [
    'Next.js', 'TypeScript', 'Supabase', 'Postgres', 'OpenAI', 'Anthropic',
    'Twilio', 'Stripe', 'Vercel', 'n8n',
  ]
  return (
    <section className="border-b py-12 md:py-16" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="06" label={t.eyebrow} />
        <div className="mt-6 flex flex-wrap gap-x-2 gap-y-2">
          {stack.map((s) => (
            <span
              key={s}
              className="border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.02em] text-[rgba(17,17,17,0.7)]"
              style={{ borderColor: HAIR }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────────────

export function Faq() {
  const { lang } = useLanguage()
  const t = COPY[lang].faq
  return (
    <section id="faq" className="border-b py-14 md:py-20" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="07" label={t.eyebrow} />
        <h2 className="mt-6 font-display text-[clamp(1.6rem,4vw,2.4rem)] tracking-[-0.03em] text-[#111]">
          {t.title}
        </h2>

        <div className="mt-8 border-t" style={{ borderColor: LINE }}>
          {t.items.map((it, i) => (
            <details key={it.q} className="group border-b py-4" style={{ borderColor: HAIR }}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-[rgba(17,17,17,0.4)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[12.5px] text-[rgba(17,17,17,0.85)] transition-colors group-hover:text-[#111]">
                    {it.q}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 font-mono text-[rgba(17,17,17,0.4)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2.5 max-w-2xl pl-[26px] font-mono text-[11px] leading-relaxed text-[rgba(17,17,17,0.6)]">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contact ────────────────────────────────────────────────────────────────

export function Contact() {
  const { lang } = useLanguage()
  const t = COPY[lang].contact
  const en = lang === 'en'
  const [sent, setSent] = useState(false)

  return (
    <section id="contact" className="border-b py-16 md:py-24" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-[1260px] px-5 md:px-7">
        <SectionTag n="08" label={t.eyebrow} />
        <h2 className="mt-6 font-display text-[clamp(2.4rem,8vw,5rem)] tracking-[-0.04em] text-[#111]">
          {t.title}
        </h2>

        {sent ? (
          <div
            className="mt-10 max-w-xl border p-5 font-mono text-[11.5px] leading-relaxed text-[rgba(17,17,17,0.7)]"
            style={{ borderColor: LINE }}
          >
            {en
              ? 'Your mail client should have opened. If not, write us at hello@stackd.dev.'
              : 'Se habrá abierto tu cliente de correo. Si no, escríbenos a hello@stackd.dev.'}
          </div>
        ) : (
          <form
            className="mt-10 max-w-xl border"
            style={{ borderColor: LINE, backgroundColor: BONE }}
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const subject = encodeURIComponent(`StackD — ${data.get('name') || ''}`)
              const body = encodeURIComponent(`${data.get('message') || ''}\n\n— ${data.get('email') || ''}`)
              window.location.href = `mailto:hello@stackd.dev?subject=${subject}&body=${body}`
              setSent(true)
            }}
          >
            {[
              ['name', t.name, 'text'],
              ['email', t.email, 'email'],
            ].map(([name, label, type]) => (
              <label key={name} className="flex items-center border-b" style={{ borderColor: HAIR }}>
                <span className="w-24 shrink-0 px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.4)]">
                  {label}
                </span>
                <input
                  name={name}
                  type={type}
                  required
                  className="w-full bg-transparent px-2 py-3 font-mono text-[12px] text-[#111] outline-none placeholder:text-[rgba(17,17,17,0.25)]"
                />
              </label>
            ))}
            <label className="flex border-b" style={{ borderColor: HAIR }}>
              <span className="w-24 shrink-0 px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.4)]">
                {t.message}
              </span>
              <textarea
                name="message"
                rows={3}
                required
                className="w-full resize-none bg-transparent px-2 py-3 font-mono text-[12px] text-[#111] outline-none placeholder:text-[rgba(17,17,17,0.25)]"
              />
            </label>
            <button type="submit" className="btn-solid w-full">
              {t.send} →
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: LINE }}>
      <div className="mx-auto flex max-w-[1260px] flex-col items-start justify-between gap-4 px-5 py-10 sm:flex-row sm:items-center md:px-7">
        <span className="text-[15px] font-medium tracking-[-0.02em] text-[#111]">
          StackD<span style={{ color: TERRA }}>.</span>
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.45)]">
          <a href="mailto:hello@stackd.dev" className="transition-colors hover:text-[#111]">
            hello@stackd.dev
          </a>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  )
}
