'use client'

/**
 * Mockups de dashboards de agentes de IA — lo que StackD puede construir.
 * Tres agentes reales con dashboard completo (cabecera, métricas, tabla y feed
 * de razonamiento), en la misma estética ficha técnica que el resto.
 *
 * Van con selector para que las tres quepan en una sección sin alargar la
 * página. El selector funciona de verdad.
 *
 * Todo el contenido es demo, pero coherente: las cifras de la fila de métricas
 * cuadran con las filas de la tabla de abajo.
 */

import { useState } from 'react'
import { HalftoneIcon, AsciiIcon, type HalftoneShape } from './halftone-icon'

const TERRA = '#C1663D'
const INK = '#111111'
const BONE = '#F0EEE9'
const OKG = '#3F7A4E'
const LINE = 'rgba(17,17,17,0.22)'
const HAIR = 'rgba(17,17,17,0.14)'

// ── Primitivas ──────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em]"
      style={{ borderColor: color, color }}
    >
      <span className="h-1 w-1" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}

/** Barra de píxel horizontal — puntuación o rendimiento. */
function PixelBar({ pct, color = INK, cells = 12 }: { pct: number; color?: string; cells?: number }) {
  const n = Math.round((pct / 100) * cells)
  return (
    <span className="inline-flex gap-[2px]" aria-hidden>
      {Array.from({ length: cells }).map((_, i) => (
        <span
          key={i}
          className="h-[8px] w-[3px]"
          style={{ backgroundColor: i < n ? color : 'rgba(17,17,17,0.16)' }}
        />
      ))}
    </span>
  )
}

function Metric({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: string }) {
  return (
    <div className="border-r px-4 py-3 last:border-r-0" style={{ borderColor: HAIR }}>
      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.45)]">{k}</p>
      <p
        className="mt-1.5 text-[19px] font-light leading-none tracking-[-0.03em]"
        style={{ color: accent || INK }}
      >
        {v}
      </p>
      <p className="mt-1.5 font-mono text-[8.5px] text-[rgba(17,17,17,0.42)]">{sub}</p>
    </div>
  )
}

/** Marco de dashboard: cabecera + métricas + cuerpo en dos columnas. */
function Dash({
  titulo,
  contexto,
  metricas,
  children,
  feed,
  en,
  icono,
}: {
  titulo: string
  contexto: string
  metricas: React.ReactNode
  children: React.ReactNode
  feed: { t: string; texto: React.ReactNode }[]
  en: boolean
  icono: HalftoneShape
}) {
  return (
    <div className="relative overflow-hidden border" style={{ borderColor: LINE, backgroundColor: BONE }}>
      {icono === 'video' ? (
        <AsciiIcon
          shape="video"
          seed={titulo.length * 131 + 7}
          cols={46}
          rows={26}
          className="pointer-events-none absolute -right-2 -top-2 z-0 select-none text-[5.5px] leading-none text-[rgba(17,17,17,0.55)]"
        />
      ) : (
        <HalftoneIcon
          shape={icono}
          seed={titulo.length * 131 + 7}
          className="pointer-events-none absolute -right-4 -top-4 z-0 h-[150px] w-[150px] text-[rgba(17,17,17,0.4)]"
        />
      )}

      {/* Cabecera */}
      <div
        className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
        style={{ borderColor: LINE }}
      >
        <span className="text-[#111]">{titulo}</span>
        <span className="text-[rgba(17,17,17,0.45)]">{contexto}</span>
      </div>

      {/* Métricas */}
      <div className="relative z-10 grid grid-cols-2 border-b md:grid-cols-4" style={{ borderColor: LINE, backgroundColor: BONE }}>
        {metricas}
      </div>

      {/* Cuerpo */}
      <div className="relative z-10 grid lg:grid-cols-[1.6fr_1fr]" style={{ backgroundColor: BONE }}>
        <div className="border-b lg:border-b-0 lg:border-r" style={{ borderColor: LINE }}>
          {children}
        </div>

        <div>
          <p
            className="border-b px-4 py-2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[rgba(17,17,17,0.45)]"
            style={{ borderColor: HAIR }}
          >
            {en ? 'Agent reasoning' : 'Razonamiento del agente'}
          </p>
          {feed.map((f, i) => (
            <div key={i} className="border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: HAIR }}>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.12em]" style={{ color: TERRA }}>
                {f.t}
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-[rgba(17,17,17,0.65)]">
                {f.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Cabecera + filas de una tabla dentro del dashboard. */
function Tabla({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div>{children}</div>
}

// ── 1. Agente de contenido (staging + vídeo) ────────────────────────────

function CampanasDash({ en }: { en: boolean }) {
  const filas = [
    { canal: 'Carrer de Mallorca 42', variantes: 3, rend: 92, estado: 'auto', ctr: '8s' },
    { canal: 'Passeig de Gràcia 10', variantes: 3, rend: 85, estado: 'auto', ctr: '8s' },
    { canal: 'Rambla Catalunya 55', variantes: 3, rend: 64, estado: 'aprob', ctr: '6s' },
    { canal: 'Carrer Balmes 210', variantes: 2, rend: 30, estado: 'humano', ctr: '—' },
  ]
  const chip = (e: string) =>
    e === 'auto'
      ? { l: en ? 'Ready to post' : 'Listo para publicar', c: OKG }
      : e === 'aprob'
        ? { l: en ? 'Needs approval' : 'Pide aprobación', c: TERRA }
        : { l: en ? 'To a human' : 'A una persona', c: 'rgba(17,17,17,0.45)' }

  return (
    <Dash
      titulo="Content engine"
      en={en}
      icono="video"
      contexto={en ? 'Client · Aura Real Estate' : 'Cliente · Aura Real Estate'}
      metricas={
        <>
          <Metric k={en ? 'Listings' : 'Propiedades'} v="34" sub={en ? 'this week' : 'esta semana'} />
          <Metric k={en ? 'Staged' : 'Con staging'} v="21" sub="62%" accent={OKG} />
          <Metric k={en ? 'In queue' : 'En cola'} v="8" sub={en ? 'awaiting photos' : 'esperan fotos'} accent={TERRA} />
          <Metric k={en ? 'Turnaround' : 'Tiempo medio'} v="14m" sub={en ? 'photo → video' : 'foto → vídeo'} />
        </>
      }
      feed={[
        { t: en ? 'Decision' : 'Decisión', texto: <>{en ? 'Carrer Balmes 210 goes to a person: photos are too dark to stage reliably.' : 'Carrer Balmes 210 se manda a una persona: las fotos están demasiado oscuras para un staging fiable.'}</> },
        { t: en ? 'Generated' : 'Generado', texto: <>{en ? '3 staged rooms and a vertical video clip from the raw photos, in 14 minutes.' : '3 estancias con staging y un clip de vídeo vertical a partir de las fotos originales, en 14 minutos.'}</> },
        { t: en ? 'Blocked' : 'Bloqueado', texto: <>{en ? 'One staged image dropped on its own: the furniture scale didn\'t match the room.' : 'Una imagen de staging descartada sola: la escala del mueble no encajaba con la habitación.'}</> },
      ]}
    >
      <div
        className="hidden grid-cols-[1fr_58px_92px_130px] gap-3 border-b px-4 py-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.42)] md:grid"
        style={{ borderColor: HAIR }}
      >
        <span>{en ? 'Listing' : 'Propiedad'}</span>
        <span>{en ? 'Assets' : 'Piezas'}</span>
        <span>{en ? 'Progress' : 'Progreso'}</span>
        <span>{en ? 'Status' : 'Estado'}</span>
      </div>
      {filas.map((f) => {
        const c = chip(f.estado)
        return (
          <div
            key={f.canal}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[1fr_58px_92px_130px]"
            style={{ borderColor: HAIR }}
          >
            <span className="font-mono text-[11px] text-[#111]">{f.canal}</span>
            <span className="hidden font-mono text-[10px] tabular-nums text-[rgba(17,17,17,0.55)] md:block">
              {f.variantes}
            </span>
            <span className="hidden items-center gap-2 md:flex">
              <PixelBar pct={f.rend} color={f.rend < 45 ? TERRA : INK} />
              <span className="font-mono text-[9px] tabular-nums text-[rgba(17,17,17,0.45)]">{f.ctr}</span>
            </span>
            <span className="justify-self-end md:justify-self-start">
              <Chip label={c.l} color={c.c} />
            </span>
          </div>
        )
      })}
    </Dash>
  )
}

// ── 2. Agente de captación ──────────────────────────────────────────────

function CaptacionDash({ en }: { en: boolean }) {
  const filas = [
    { id: 'L-2291', fuente: en ? 'Portal · Idealista' : 'Portal · Idealista', score: 92, estado: 'reunion' },
    { id: 'L-2292', fuente: 'WhatsApp', score: 74, estado: 'nutrir' },
    { id: 'L-2293', fuente: en ? 'Portal · Idealista' : 'Portal · Idealista', score: 38, estado: 'descarta' },
    { id: 'L-2294', fuente: en ? 'Referral' : 'Referido', score: 88, estado: 'reunion' },
    { id: 'L-2295', fuente: en ? 'Agency site' : 'Web de la agencia', score: 51, estado: 'nutrir' },
  ]
  const chip = (e: string) =>
    e === 'reunion'
      ? { l: en ? 'Viewing booked' : 'Visita agendada', c: OKG }
      : e === 'nutrir'
        ? { l: en ? 'Nurture' : 'Nutrir', c: TERRA }
        : { l: en ? 'Discarded' : 'Descartado', c: 'rgba(17,17,17,0.45)' }

  return (
    <Dash
      titulo="Lead agent"
      en={en}
      icono="chat"
      contexto={en ? 'Inbound · last 7 days' : 'Entrantes · últimos 7 días'}
      metricas={
        <>
          <Metric k={en ? 'Inbound' : 'Entrantes'} v="128" sub={en ? 'this week' : 'esta semana'} />
          <Metric k={en ? 'Qualified' : 'Cualificados'} v="41" sub="32%" accent={OKG} />
          <Metric k={en ? 'Discarded' : 'Descartados'} v="71" sub={en ? 'with reason' : 'con motivo'} />
          <Metric k={en ? 'Viewings' : 'Visitas'} v="16" sub={en ? 'no human touch' : 'sin tocar nadie'} accent={TERRA} />
        </>
      }
      feed={[
        { t: en ? 'Scored' : 'Puntuado', texto: <>{en ? 'L-2291 at 92: budget, financing and timeline all confirmed.' : 'L-2291 a 92: presupuesto, financiación y plazo confirmados.'}</> },
        { t: en ? 'Discarded' : 'Descartado', texto: <>{en ? 'L-2293 at 38: a broker fishing for listings, not a buyer.' : 'L-2293 a 38: es un intermediario buscando propiedades, no un comprador.'}</> },
        { t: en ? 'Booked' : 'Agendado', texto: <>{en ? 'Viewing proposed and confirmed over WhatsApp, with nobody stepping in.' : 'Visita propuesta y confirmada por WhatsApp, sin que nadie interviniera.'}</> },
      ]}
    >
      <div
        className="hidden grid-cols-[70px_1fr_110px_130px] gap-3 border-b px-4 py-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.42)] md:grid"
        style={{ borderColor: HAIR }}
      >
        <span>Lead</span>
        <span>{en ? 'Source' : 'Fuente'}</span>
        <span>Score</span>
        <span>{en ? 'Status' : 'Estado'}</span>
      </div>
      {filas.map((f) => {
        const c = chip(f.estado)
        return (
          <div
            key={f.id}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[70px_1fr_110px_130px]"
            style={{ borderColor: HAIR }}
          >
            <span className="font-mono text-[11px] text-[#111]">{f.id}</span>
            <span className="hidden font-mono text-[10px] text-[rgba(17,17,17,0.55)] md:block">{f.fuente}</span>
            <span className="hidden items-center gap-2 md:flex">
              <PixelBar pct={f.score} color={f.score < 50 ? 'rgba(17,17,17,0.35)' : f.score > 80 ? INK : TERRA} />
              <span className="font-mono text-[9px] tabular-nums text-[rgba(17,17,17,0.45)]">{f.score}</span>
            </span>
            <span className="justify-self-end md:justify-self-start">
              <Chip label={c.l} color={c.c} />
            </span>
          </div>
        )
      })}
    </Dash>
  )
}

// ── 3. Agente de soporte ────────────────────────────────────────────────

function SoporteDash({ en }: { en: boolean }) {
  const ondas = [4, 7, 5, 9, 6, 8, 4, 7, 10, 5, 8, 6, 9, 4, 7, 5]
  const filas = [
    { id: '#4021', motivo: en ? 'Broken lift' : 'Avería ascensor', dur: '02:14', estado: 'resuelto' },
    { id: '#4022', motivo: en ? 'Invoice query' : 'Consulta factura', dur: '01:03', estado: 'resuelto' },
    { id: '#4023', motivo: en ? 'Water leak' : 'Fuga de agua', dur: '00:48', estado: 'escalado' },
    { id: '#4024', motivo: en ? 'Key handover' : 'Entrega de llaves', dur: '01:31', estado: 'resuelto' },
  ]
  const chip = (e: string) =>
    e === 'resuelto'
      ? { l: en ? 'Solved by agent' : 'Resuelto por el agente', c: OKG }
      : { l: en ? 'Escalated' : 'Escalado', c: TERRA }

  return (
    <Dash
      titulo="Support agent"
      en={en}
      icono="house"
      contexto={en ? 'Voice · 24/7' : 'Voz · 24/7'}
      metricas={
        <>
          <Metric k={en ? 'Calls' : 'Llamadas'} v="342" sub={en ? 'this month' : 'este mes'} />
          <Metric k={en ? 'Solved alone' : 'Resueltas solo'} v="71%" sub={en ? 'no human' : 'sin humano'} accent={OKG} />
          <Metric k={en ? 'Avg. time' : 'Tiempo medio'} v="02:14" sub={en ? 'vs 08:40 before' : 'vs 08:40 antes'} />
          <Metric k={en ? 'Escalated' : 'Escaladas'} v="24" sub={en ? 'with context' : 'con contexto'} accent={TERRA} />
        </>
      }
      feed={[
        { t: en ? 'Triaged' : 'Triaje', texto: <>{en ? 'Water leak flagged urgent and escalated in 48s, transcript attached.' : 'Fuga de agua marcada como urgente y escalada en 48 s, con la transcripción adjunta.'}</> },
        { t: en ? 'Resolved' : 'Resuelto', texto: <>{en ? 'Invoice query answered with the real figure from the system, not a template.' : 'Consulta de factura contestada con el dato real del sistema, no con una plantilla.'}</> },
        { t: en ? 'Learned' : 'Aprendido', texto: <>{en ? 'Three calls from the same building this week → suggests checking the lift.' : 'Tres llamadas del mismo portal esta semana → sugiere revisar el ascensor.'}</> },
      ]}
    >
      {/* Onda de la llamada en curso */}
      <div className="border-b px-4 py-3" style={{ borderColor: HAIR }}>
        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.42)]">
          {en ? 'Live call' : 'Llamada en curso'}
        </p>
        <div className="mt-2 flex items-end gap-[2px]" aria-hidden>
          {ondas.map((h, i) => (
            <span
              key={i}
              className="flex-1"
              style={{ height: `${h * 2.6}px`, backgroundColor: i > 10 ? 'rgba(17,17,17,0.25)' : INK }}
            />
          ))}
        </div>
      </div>

      {filas.map((f) => {
        const c = chip(f.estado)
        return (
          <div
            key={f.id}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[62px_1fr_62px_150px]"
            style={{ borderColor: HAIR }}
          >
            <span className="font-mono text-[11px] text-[#111]">{f.id}</span>
            <span className="hidden font-mono text-[10px] text-[rgba(17,17,17,0.55)] md:block">{f.motivo}</span>
            <span className="hidden font-mono text-[10px] tabular-nums text-[rgba(17,17,17,0.45)] md:block">
              {f.dur}
            </span>
            <span className="justify-self-end md:justify-self-start">
              <Chip label={c.l} color={c.c} />
            </span>
          </div>
        )
      })}
    </Dash>
  )
}

// ── 4. Bandeja del agente — tres paneles ────────────────────────────────
/**
 * Arquetipo distinto a los tres de arriba: en vez de métricas + tabla, es un
 * espacio de trabajo (navegación · bandeja · detalle), como las herramientas
 * donde el agente convive con el equipo.
 *
 * Mobile-first: a 375px tres columnas no caben de ninguna forma honesta, así
 * que por debajo de md se enseña **solo la bandeja**, que es la que lleva la
 * información. Las otras dos aparecen al haber sitio.
 */
function BandejaDash({ en }: { en: boolean }) {
  const nav = [
    { t: en ? 'Home' : 'Inicio', on: false },
    { t: en ? 'Inbox' : 'Bandeja', on: true },
    { t: en ? 'At risk' : 'En riesgo', on: false },
  ]
  const carpetas = [en ? 'Aura Real Estate' : 'Aura Real Estate', 'Costa Homes', 'Atico36']

  const items = [
    {
      ini: 'AG',
      quien: en ? 'Agent' : 'Agente',
      accion: en ? 'flagged a listing' : 'marcó una propiedad',
      donde: 'Aura Real Estate · Mallorca 42',
      cuando: en ? '30 min ago' : 'hace 30 min',
      cambio: ['ACTIVE', 'PRICE REVIEW'] as [string, string],
      cuerpo: en
        ? '38 days on market, no viewings booked in 2 weeks. Flagged on its own and left the reasoning attached.'
        : '38 días en el mercado, sin visitas agendadas en 2 semanas. La marcó sola y dejó el razonamiento adjunto.',
    },
    {
      ini: 'AG',
      quien: en ? 'Agent' : 'Agente',
      accion: en ? 'staged 3 rooms' : 'hizo staging de 3 estancias',
      donde: 'Costa Homes',
      cuando: en ? '2h ago' : 'hace 2 h',
      cambio: null,
      cuerpo: en
        ? 'Ready for review. One image dropped on its own for a furniture-scale mismatch.'
        : 'Listas para revisar. Una imagen descartada sola por un desajuste de escala del mueble.',
    },
    {
      ini: 'MV',
      quien: 'María V.',
      accion: en ? 'approved the batch' : 'aprobó el lote',
      donde: 'Atico36',
      cuando: en ? 'Yesterday' : 'Ayer',
      cambio: null,
      cuerpo: en ? 'Scheduled to post Monday 09:00.' : 'Programado para publicar el lunes a las 09:00.',
    },
  ]

  return (
    <div className="relative overflow-hidden border" style={{ borderColor: LINE, backgroundColor: BONE }}>
      <HalftoneIcon
        shape="key"
        seed={521}
        className="pointer-events-none absolute -right-4 -top-4 z-0 h-[150px] w-[150px] text-[rgba(17,17,17,0.4)]"
      />
      <div
        className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
        style={{ borderColor: LINE }}
      >
        <span className="text-[#111]">{en ? 'Agent workspace' : 'Espacio del agente'}</span>
        <span className="text-[rgba(17,17,17,0.45)]">
          {en ? '3 accounts · 2 need you' : '3 cuentas · 2 te necesitan'}
        </span>
      </div>

      <div className="relative z-10 grid md:grid-cols-[150px_1fr] lg:grid-cols-[150px_1.15fr_1fr]" style={{ backgroundColor: BONE }}>
        {/* Navegación — desde md */}
        <div className="hidden border-r p-3 md:block" style={{ borderColor: LINE }}>
          <button
            type="button"
            className="w-full border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ borderColor: INK, color: INK }}
          >
            {en ? 'New agent chat' : 'Nuevo chat'}
          </button>
          <div className="mt-3 space-y-px">
            {nav.map((n) => (
              <p
                key={n.t}
                className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px]"
                style={n.on ? { backgroundColor: 'rgba(17,17,17,0.07)', color: INK } : { color: 'rgba(17,17,17,0.5)' }}
              >
                <span
                  className="h-1 w-1 shrink-0"
                  style={{ backgroundColor: n.on ? TERRA : 'rgba(17,17,17,0.3)' }}
                  aria-hidden
                />
                {n.t}
              </p>
            ))}
          </div>
          <p className="mt-4 px-2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[rgba(17,17,17,0.38)]">
            {en ? 'Accounts' : 'Cuentas'}
          </p>
          <div className="mt-1.5 space-y-px">
            {carpetas.map((c) => (
              <p key={c} className="px-2 py-1 font-mono text-[10px] text-[rgba(17,17,17,0.55)]">
                {c}
              </p>
            ))}
          </div>
        </div>

        {/* Bandeja — la única que se ve en móvil */}
        <div className="border-r-0 lg:border-r" style={{ borderColor: LINE }}>
          <div
            className="flex items-center justify-between border-b px-4 py-2"
            style={{ borderColor: HAIR }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.5)]">
              {en ? 'Inbox' : 'Bandeja'}
            </span>
            <Chip label={en ? '2 new' : '2 nuevas'} color={TERRA} />
          </div>

          {items.map((it, i) => (
            <div key={i} className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: HAIR }}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="flex h-[20px] w-[20px] shrink-0 items-center justify-center font-mono text-[8px]"
                    style={{ backgroundColor: 'rgba(193,102,61,0.16)', color: TERRA }}
                  >
                    {it.ini}
                  </span>
                  <span className="min-w-0">
                    <span className="font-mono text-[10.5px] text-[#111]">{it.quien} </span>
                    <span className="font-mono text-[10.5px] text-[rgba(17,17,17,0.55)]">{it.accion}</span>
                    <span className="block font-mono text-[10px] text-[#111]">{it.donde}</span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.4)]">
                  {it.cuando}
                </span>
              </div>

              {it.cambio && (
                <p className="ml-[30px] mt-2 font-mono text-[8.5px] uppercase tracking-[0.1em]">
                  <span className="text-[rgba(17,17,17,0.45)]">{it.cambio[0]}</span>
                  <span className="px-1.5 text-[rgba(17,17,17,0.35)]" aria-hidden>
                    →
                  </span>
                  <span style={{ color: TERRA }}>{it.cambio[1]}</span>
                </p>
              )}

              <p className="ml-[30px] mt-1.5 font-mono text-[10px] leading-relaxed text-[rgba(17,17,17,0.6)]">
                {it.cuerpo}
              </p>
            </div>
          ))}
        </div>

        {/* Detalle con el agente — desde lg */}
        <div className="hidden border-t p-4 lg:block lg:border-t-0" style={{ borderColor: LINE }}>
          <p className="text-[15px] leading-snug tracking-[-0.01em] text-[#111]">
            {en ? 'Hi Arnau, what do you need?' : 'Hola Arnau, ¿qué necesitas?'}
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-[rgba(17,17,17,0.5)]">
            {en
              ? 'Ask about any account, or get a read across the whole portfolio.'
              : 'Pregunta por cualquier cuenta, o pide una lectura de toda la cartera.'}
          </p>

          <div className="mt-4 border p-3" style={{ borderColor: HAIR }}>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em]" style={{ color: TERRA }}>
              {en ? 'Suggested' : 'Sugerido'}
            </p>
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-[rgba(17,17,17,0.65)]">
              {en
                ? 'Mallorca 42 has had 3 viewings but no offers in 2 weeks. Want me to suggest a price review?'
                : 'Mallorca 42 lleva 3 visitas pero ninguna oferta en 2 semanas. ¿Sugiero revisar el precio?'}
            </p>
            <div className="mt-2.5 flex gap-px">
              {[en ? 'Yes' : 'Sí', en ? 'Show me' : 'Enséñame'].map((b, i) => (
                <span
                  key={b}
                  className="border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]"
                  style={
                    i === 0
                      ? { backgroundColor: INK, borderColor: INK, color: BONE }
                      : { borderColor: HAIR, color: 'rgba(17,17,17,0.55)' }
                  }
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.38)]">
            {en ? 'Activity' : 'Actividad'}
          </p>
          {[
            [en ? 'Price review via agent' : 'Revisión de precio', '30 min'],
            [en ? 'New rooms staged' : 'Nuevo staging', '2 h'],
          ].map(([t, w]) => (
            <p key={t} className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[10px] text-[rgba(17,17,17,0.6)]">{t}</span>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.4)]">
                {w}
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sección con selector ────────────────────────────────────────────────

const AGENTES = [
  { id: 'campanas', en: 'Content', es: 'Contenido', C: CampanasDash },
  { id: 'captacion', en: 'Leads', es: 'Captación', C: CaptacionDash },
  { id: 'soporte', en: 'Support', es: 'Soporte', C: SoporteDash },
  { id: 'bandeja', en: 'Workspace', es: 'Espacio', C: BandejaDash },
]

export function AgentDashboards({ en }: { en: boolean }) {
  const [i, setI] = useState(0)
  const Actual = AGENTES[i].C
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-px">
        {AGENTES.map((a, k) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setI(k)}
            className="border px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors"
            style={
              k === i
                ? { backgroundColor: INK, borderColor: INK, color: BONE }
                : { borderColor: HAIR, color: 'rgba(17,17,17,0.55)' }
            }
          >
            {en ? a.en : a.es}
          </button>
        ))}
      </div>
      <Actual en={en} />
    </>
  )
}
