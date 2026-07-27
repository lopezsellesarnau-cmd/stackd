/**
 * Sección 04 — "Dónde paramos". Antes era un diagrama SVG técnico (árbol de
 * decisión con codos y aristas). Se quitó a petición explícita: leía como una
 * herramienta de ingeniería, no como algo que vende. Ahora es una ilustración
 * (el cartel de "SE VENDE" delante de una fachada) con la misma lista de
 * siempre debajo, en texto simple — lo que se publica solo, lo que pide
 * aprobación y lo que va a una persona sigue siendo el argumento real.
 */

import { PhotoDots } from './halftone-icon'
import { EXTERIOR_GRID } from './photo-art-data'

const TERRA = '#C1663D'
const OKG = '#3F7A4E'
const FAINT = 'rgba(17,17,17,0.45)'
const LINE = 'rgba(17,17,17,0.22)'
const HAIR = 'rgba(17,17,17,0.14)'

type Tono = 'auto' | 'aprob' | 'humano'
const COLOR: Record<Tono, string> = { auto: OKG, aprob: TERRA, humano: FAINT }

const PIEZAS: { tipo: [string, string]; hace: [string, string]; salida: [string, string]; tono: Tono }[] = [
  {
    tipo: ['Virtual staging', 'Staging virtual'],
    hace: ['3 rooms, same photo', '3 estancias, misma foto'],
    salida: ['Ships on its own', 'Se publica solo'],
    tono: 'auto',
  },
  {
    tipo: ['Video clip', 'Clip de vídeo'],
    hace: ['Vertical, 8s', 'Vertical, 8s'],
    salida: ['Ships on its own', 'Se publica solo'],
    tono: 'auto',
  },
  {
    tipo: ['Listing description', 'Descripción'],
    hace: ['Drafts, waits for ok', 'Redacta, espera ok'],
    salida: ['Needs approval', 'Pide aprobación'],
    tono: 'aprob',
  },
  {
    tipo: ['Price change', 'Cambio de precio'],
    hace: ['Suggestion only', 'Solo la sugerencia'],
    salida: ['Goes to a person', 'Va a una persona'],
    tono: 'humano',
  },
]

const tx = (v: [string, string], en: boolean) => (en ? v[0] : v[1])

export function AgencyTree({ en }: { en: boolean }) {
  return (
    <div className="border" style={{ borderColor: LINE, backgroundColor: '#F0EEE9' }}>
      <div
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.55)]"
        style={{ borderColor: LINE }}
      >
        <span>{en ? 'A listing, end to end' : 'Una propiedad, de principio a fin'}</span>
        <span className="hidden sm:inline">{en ? 'Real estate agency' : 'Agencia inmobiliaria'}</span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: TERRA }} aria-hidden />
          16 {en ? 'listings / week' : 'propiedades / semana'}
        </span>
      </div>

      <div className="p-6 sm:p-10">
        <PhotoDots grid={EXTERIOR_GRID} seed={733} className="block w-full max-w-[780px] text-[#111]" />

        <div className="mt-8 max-w-[560px] divide-y" style={{ borderColor: HAIR }}>
          {PIEZAS.map((p) => (
            <div key={p.tipo[0]} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[12px] text-[#111]">{tx(p.tipo, en)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-[rgba(17,17,17,0.5)]">{tx(p.hace, en)}</p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em]"
                style={{ borderColor: COLOR[p.tono], color: COLOR[p.tono] }}
              >
                <span className="h-1 w-1" style={{ backgroundColor: COLOR[p.tono] }} aria-hidden />
                {tx(p.salida, en)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
