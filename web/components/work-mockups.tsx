'use client'

/**
 * Mockups de producto para la sección Works — uno por trabajo, todos en la
 * misma estética "ficha técnica": marco con cabecera (nombre + chip de estado)
 * y cuerpo construido con las primitivas del sistema (barras de píxel, rejillas
 * de bloques, hairlines, chips mono). No son imágenes: son DOM, así se ven
 * nítidos a cualquier tamaño y encajan con el resto de la landing.
 *
 * Bilingüe: reciben `en` para las pocas etiquetas que cambian.
 */

const TERRA = '#C1663D'
const INK = '#111111'
const OKG = '#3F7A4E'
const LINE = 'rgba(17,17,17,0.22)'
const HAIR = 'rgba(17,17,17,0.14)'

// ── Marco común ─────────────────────────────────────────────────────────

function Frame({
  title,
  status,
  children,
}: {
  title: string
  status: { label: string; color: string }
  children: React.ReactNode
}) {
  return (
    <div className="border bg-[#F0EEE9]" style={{ borderColor: LINE }}>
      <div
        className="flex items-center justify-between border-b px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.55)]"
        style={{ borderColor: LINE }}
      >
        <span>{title}</span>
        <span className="flex items-center gap-1.5" style={{ color: status.color }}>
          <span className="h-1 w-1" style={{ backgroundColor: status.color }} aria-hidden />
          {status.label}
        </span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}

/** Barra de píxel vertical (score / nivel). */
function PixelBar({ value, max = 10, color = INK }: { value: number; max?: number; color?: string }) {
  const n = Math.round((value / 100) * max)
  return (
    <span className="inline-flex gap-[2px]" aria-hidden>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="h-[8px] w-[3px]"
          style={{ backgroundColor: i < n ? color : 'rgba(17,17,17,0.16)' }}
        />
      ))}
    </span>
  )
}

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

// ── 1. Volea — reservas ─────────────────────────────────────────────────

function VoleaMockup({ en }: { en: boolean }) {
  const days = en ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const hours = ['16', '17', '18', '19', '20']
  // 0 libre, 1 reservado, 2 seleccionado
  const grid = [
    [1, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 1],
    [1, 1, 2, 0, 1, 0, 1],
    [0, 0, 1, 1, 0, 1, 1],
    [1, 0, 0, 1, 1, 0, 0],
  ]
  const cell = (v: number) =>
    v === 2
      ? { backgroundColor: TERRA }
      : v === 1
        ? { backgroundColor: INK }
        : { border: '1px solid rgba(17,17,17,0.25)' }

  return (
    <Frame title="Volea · booking" status={{ label: en ? 'Live' : 'En vivo', color: OKG }}>
      <div className="grid grid-cols-[16px_1fr] gap-x-2">
        <span />
        <div className="mb-1.5 grid grid-cols-7 gap-[3px]">
          {days.map((d, i) => (
            <span key={i} className="text-center font-mono text-[8px] text-[rgba(17,17,17,0.4)]">
              {d}
            </span>
          ))}
        </div>
        {hours.map((h, r) => (
          <div key={h} className="contents">
            <span className="flex items-center font-mono text-[8px] text-[rgba(17,17,17,0.4)]">{h}</span>
            <div className="mb-[3px] grid grid-cols-7 gap-[3px]">
              {grid[r].map((v, c) => (
                <span key={c} className="h-[13px]" style={cell(v)} aria-hidden />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-2 flex items-center justify-between border-t pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.55)]"
        style={{ borderColor: HAIR }}
      >
        <span>{en ? 'Court 3 · 18:00' : 'Pista 3 · 18:00'}</span>
        <span style={{ color: TERRA }}>€24 · {en ? 'confirmed' : 'confirmado'}</span>
      </div>
    </Frame>
  )
}

// ── 2. BlockFlow — agente de voz ────────────────────────────────────────

function BlockflowMockup({ en }: { en: boolean }) {
  // Onda en barras de píxel (alturas fijas, deterministas).
  const wave = [3, 5, 8, 6, 9, 4, 7, 10, 6, 8, 5, 9, 7, 4, 6, 8, 3, 5, 7, 4, 9, 6, 8, 5]
  const steps = [
    { t: en ? 'Answered' : 'Contesta', done: true },
    { t: en ? 'Triaged' : 'Triaje', done: true },
    { t: en ? 'Ticket #4021' : 'Ticket #4021', done: true },
  ]
  return (
    <Frame title="BlockFlow · voice agent" status={{ label: en ? 'Live' : 'En vivo', color: OKG }}>
      <div className="flex items-end gap-[2px]" aria-hidden>
        {wave.map((h, i) => (
          <span
            key={i}
            className="flex-1"
            style={{ height: `${h * 3}px`, backgroundColor: i > 15 ? 'rgba(17,17,17,0.25)' : INK }}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.4)]">
        {en ? 'Incoming · property manager' : 'Entrante · administrador de fincas'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-y-1.5">
        {steps.map((s, i) => (
          <div key={s.t} className="flex items-center">
            <span
              className="border px-2 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.08em]"
              style={{ backgroundColor: INK, borderColor: INK, color: '#F0EEE9' }}
            >
              {s.t}
            </span>
            {i < steps.length - 1 && (
              <span className="px-1.5 font-mono text-[10px] text-[rgba(17,17,17,0.35)]" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        className="mt-3 flex items-center justify-between border-t pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.55)]"
        style={{ borderColor: HAIR }}
      >
        <span>{en ? 'Call 02:14' : 'Llamada 02:14'}</span>
        <span style={{ color: TERRA }}>{en ? 'unattended' : 'sin nadie detrás'}</span>
      </div>
    </Frame>
  )
}

// ── 3. Screening — cribado de candidatos ────────────────────────────────

function ScreeningMockup({ en }: { en: boolean }) {
  const rows = [
    { id: 'A-1042', score: 91, pass: true },
    { id: 'A-1043', score: 78, pass: true },
    { id: 'A-1044', score: 54, pass: false },
    { id: 'A-1045', score: 88, pass: true },
    { id: 'A-1046', score: 42, pass: false },
  ]
  return (
    <Frame title="Screening agent" status={{ label: en ? 'In build' : 'En desarrollo', color: TERRA }}>
      <div
        className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b pb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(17,17,17,0.4)]"
        style={{ borderColor: HAIR }}
      >
        <span>{en ? 'Candidate' : 'Candidato'}</span>
        <span>Score</span>
        <span className="w-[52px] text-right">{en ? 'Status' : 'Estado'}</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b py-2 last:border-b-0"
          style={{ borderColor: HAIR }}
        >
          <span className="font-mono text-[10px] text-[rgba(17,17,17,0.7)]">{r.id}</span>
          <span className="flex items-center gap-2">
            <PixelBar value={r.score} color={r.pass ? INK : TERRA} />
            <span className="w-[20px] font-mono text-[9px] tabular-nums text-[rgba(17,17,17,0.6)]">
              {r.score}
            </span>
          </span>
          <span className="flex w-[52px] justify-end">
            <Chip
              label={r.pass ? (en ? 'Pass' : 'Pasa') : en ? 'Review' : 'Revisar'}
              color={r.pass ? OKG : TERRA}
            />
          </span>
        </div>
      ))}
    </Frame>
  )
}

// ── 4. Campaign — agente de campañas ────────────────────────────────────

function CampaignMockup({ en }: { en: boolean }) {
  const rows = [
    { ch: 'Google Ads', state: 'approved' },
    { ch: 'Meta', state: 'queued' },
    { ch: 'LinkedIn', state: 'queued' },
    { ch: 'X', state: 'draft' },
  ]
  const cfg: Record<string, { label: string; color: string; fill: number }> = {
    approved: { label: en ? 'Approved' : 'Aprobado', color: OKG, fill: 100 },
    queued: { label: en ? 'Queued' : 'En cola', color: INK, fill: 66 },
    draft: { label: en ? 'Draft' : 'Borrador', color: TERRA, fill: 33 },
  }
  return (
    <Frame title="Campaign agent" status={{ label: en ? 'In build' : 'En desarrollo', color: TERRA }}>
      {rows.map((r) => {
        const c = cfg[r.state]
        return (
          <div
            key={r.ch}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-b py-2.5 last:border-b-0"
            style={{ borderColor: HAIR }}
          >
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-[rgba(17,17,17,0.75)]">{r.ch}</span>
              <div className="mt-1.5 flex gap-[2px]" aria-hidden>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-[4px] flex-1"
                    style={{
                      backgroundColor:
                        i < Math.round((c.fill / 100) * 18) ? c.color : 'rgba(17,17,17,0.14)',
                    }}
                  />
                ))}
              </div>
            </div>
            <Chip label={c.label} color={c.color} />
          </div>
        )
      })}
      <p
        className="mt-2 border-t pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[rgba(17,17,17,0.5)]"
        style={{ borderColor: HAIR }}
      >
        12 {en ? 'drafts · client approves' : 'borradores · el cliente aprueba'}
      </p>
    </Frame>
  )
}

// ── Selector ────────────────────────────────────────────────────────────

const MOCKUPS = {
  volea: VoleaMockup,
  blockflow: BlockflowMockup,
  recruiting: ScreeningMockup,
  marketing: CampaignMockup,
}

export function WorkMockup({ which, en }: { which: keyof typeof MOCKUPS; en: boolean }) {
  const M = MOCKUPS[which]
  return <M en={en} />
}
