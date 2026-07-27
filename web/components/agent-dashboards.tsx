'use client'

/**
 * Sección 03 — antes eran cuatro dashboards que fingían ser SaaS (métricas,
 * tablas, feed de "razonamiento"). Se quitó a petición explícita: parecía un
 * producto de mentira, no una ilustración de lo que hacemos. Ahora cada
 * pestaña es una única ilustración grande (la misma técnica de trama de
 * puntos/ASCII que el resto del sitio) con una frase corta debajo — vende la
 * idea, no finge una interfaz.
 */

import { useState } from 'react'
import { AsciiIcon, HalftoneIcon, type HalftoneShape } from './halftone-icon'

const INK = '#111111'
const BONE = '#F0EEE9'
const LINE = 'rgba(17,17,17,0.22)'

type Agente = {
  id: string
  en: string
  es: string
  forma: HalftoneShape
  titulo: [string, string]
  linea: [string, string]
}

const AGENTES: Agente[] = [
  {
    id: 'content',
    en: 'Content',
    es: 'Contenido',
    forma: 'video',
    titulo: ['Content engine', 'Content engine'],
    linea: [
      'Photos in, virtual staging and a vertical video clip out — same day.',
      'Fotos que entran, staging virtual y un clip de vídeo vertical que sale — el mismo día.',
    ],
  },
  {
    id: 'leads',
    en: 'Leads',
    es: 'Captación',
    forma: 'chat',
    titulo: ['Lead agent', 'Lead agent'],
    linea: [
      'Answers a portal enquiry in seconds, qualifies budget, books the viewing.',
      'Responde una consulta del portal en segundos, cualifica presupuesto, agenda la visita.',
    ],
  },
  {
    id: 'support',
    en: 'Support',
    es: 'Soporte',
    forma: 'building',
    titulo: ['Support agent', 'Support agent'],
    linea: [
      'Answers, triages and creates the ticket for property managers — unattended.',
      'Responde, hace triaje y crea el ticket para administradores de fincas — sin nadie detrás.',
    ],
  },
  {
    id: 'workspace',
    en: 'Workspace',
    es: 'Espacio',
    forma: 'key',
    titulo: ['Agent workspace', 'Espacio del agente'],
    linea: [
      'One inbox for every account — the agent flags what needs you, handles the rest.',
      'Una bandeja para todas las cuentas — el agente marca lo que te necesita, resuelve el resto.',
    ],
  },
]

export function AgentDashboards({ en }: { en: boolean }) {
  const [i, setI] = useState(0)
  const a = AGENTES[i]
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-px">
        {AGENTES.map((ag, k) => (
          <button
            key={ag.id}
            type="button"
            onClick={() => setI(k)}
            className="border px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors"
            style={
              k === i
                ? { backgroundColor: INK, borderColor: INK, color: BONE }
                : { borderColor: 'rgba(17,17,17,0.14)', color: 'rgba(17,17,17,0.55)' }
            }
          >
            {en ? ag.en : ag.es}
          </button>
        ))}
      </div>

      <div className="border" style={{ borderColor: LINE, backgroundColor: BONE }}>
        <div
          className="border-b px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#111]"
          style={{ borderColor: LINE }}
        >
          {en ? a.titulo[0] : a.titulo[1]}
        </div>
        <div className="flex flex-col items-center gap-6 px-6 py-10 sm:py-14">
          {a.forma === 'video' ? (
            <AsciiIcon
              shape={a.forma}
              seed={a.id.length * 191 + i * 37}
              cols={78}
              rows={42}
              className="breathe select-none text-[8px] leading-none text-[#111] sm:text-[9.5px]"
            />
          ) : (
            <HalftoneIcon
              shape={a.forma}
              seed={a.id.length * 191 + i * 37}
              className="h-[150px] w-[150px] text-[#111] sm:h-[180px] sm:w-[180px]"
            />
          )}
          <p
            className="max-w-[48ch] text-center font-mono text-[11.5px] leading-relaxed"
            style={{ color: 'rgba(17,17,17,0.65)' }}
          >
            {en ? a.linea[0] : a.linea[1]}
          </p>
        </div>
      </div>
    </>
  )
}
