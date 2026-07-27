/**
 * Sección 03 — pasó por dos versiones antes de esta: primero cuatro
 * dashboards que fingían ser SaaS (se quitó, parecía un producto de
 * mentira), luego cuatro pestañas con una ilustración por agente (se quitó
 * también: de las cuatro ilustraciones, tres eran geometría a mano sin
 * detalle real y nadie entendía qué eran). Ahora es una ventana única, sin
 * nada que pulsar: la ilustración que sí funcionaba (el play de Content) y,
 * debajo, los cuatro agentes en una lista simple de texto.
 */

import { AsciiIcon } from './halftone-icon'

const LINE = 'rgba(17,17,17,0.22)'
const HAIR = 'rgba(17,17,17,0.14)'

const AGENTES: { titulo: [string, string]; linea: [string, string] }[] = [
  {
    titulo: ['Content engine', 'Content engine'],
    linea: [
      'Photos in, virtual staging and a vertical video clip out — same day.',
      'Fotos que entran, staging virtual y un clip de vídeo vertical que sale — el mismo día.',
    ],
  },
  {
    titulo: ['Lead agent', 'Lead agent'],
    linea: [
      'Answers a portal enquiry in seconds, qualifies budget, books the viewing.',
      'Responde una consulta del portal en segundos, cualifica presupuesto, agenda la visita.',
    ],
  },
  {
    titulo: ['Support agent', 'Support agent'],
    linea: [
      'Answers, triages and creates the ticket for property managers — unattended.',
      'Responde, hace triaje y crea el ticket para administradores de fincas — sin nadie detrás.',
    ],
  },
  {
    titulo: ['Agent workspace', 'Espacio del agente'],
    linea: [
      'One inbox for every account — the agent flags what needs you, handles the rest.',
      'Una bandeja para todas las cuentas — el agente marca lo que te necesita, resuelve el resto.',
    ],
  },
]

export function AgentDashboards({ en }: { en: boolean }) {
  return (
    <div className="border" style={{ borderColor: LINE, backgroundColor: '#F0EEE9' }}>
      <div
        className="border-b px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#111]"
        style={{ borderColor: LINE }}
      >
        {en ? 'Content engine' : 'Content engine'}
      </div>

      <div className="flex flex-col items-center gap-6 px-6 py-10 sm:py-14">
        <AsciiIcon
          shape="video"
          seed={733}
          cols={78}
          rows={42}
          className="breathe select-none text-[8px] leading-none text-[#111] sm:text-[9.5px]"
        />
        <p className="max-w-[48ch] text-center font-mono text-[11.5px] leading-relaxed" style={{ color: 'rgba(17,17,17,0.65)' }}>
          {en
            ? 'Photos in, virtual staging and a vertical video clip out — same day.'
            : 'Fotos que entran, staging virtual y un clip de vídeo vertical que sale — el mismo día.'}
        </p>
      </div>

      <div className="grid gap-8 border-t px-6 py-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 sm:px-10" style={{ borderColor: HAIR }}>
        {AGENTES.map((a) => (
          <div key={a.titulo[0]}>
            <p className="text-[14px] font-medium tracking-[-0.01em] text-[#111]">{en ? a.titulo[0] : a.titulo[1]}</p>
            <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-[rgba(17,17,17,0.6)]">
              {en ? a.linea[0] : a.linea[1]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
