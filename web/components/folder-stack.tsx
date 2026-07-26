'use client'

/**
 * Archivador de carpetas — los trabajos como fichas apiladas con pestañas
 * escalonadas (referencia: el fichero de etapas de hilloris). Sustituye a los
 * cuatro mockups sueltos de la sección 02: ahora que la 03 tiene dashboards
 * completos, aquellos se pisaban entre sí.
 *
 * Mobile-first de verdad:
 *  · el solapamiento se reduce y las pestañas se alinean a la izquierda, porque
 *    escalonadas por porcentaje se salen de un móvil de 375px
 *  · la etiqueta larga de la pestaña se oculta por debajo de sm y queda el índice
 */

import { HalftoneIcon, type HalftoneShape } from './halftone-icon'

const TERRA = '#C1663D'
const INK = '#111111'
const BONE = '#F0EEE9'
const OKG = '#3F7A4E'
const LINE = 'rgba(17,17,17,0.22)'

export type Carpeta = {
  n: string
  nombre: string
  tipo: string
  estado: 'live' | 'build'
  texto: string
  icono: HalftoneShape
  /** Desplazamiento de la pestaña en desktop. */
  left: string
}

function EstadoChip({ estado, en }: { estado: string; en: boolean }) {
  const live = estado === 'live'
  const color = live ? OKG : TERRA
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em]"
      style={{ borderColor: color, color }}
    >
      <span className="h-1 w-1" style={{ backgroundColor: color }} aria-hidden />
      {live ? (en ? 'In production' : 'En producción') : en ? 'In build' : 'En desarrollo'}
    </span>
  )
}

export function FolderStack({ carpetas, en }: { carpetas: Carpeta[]; en: boolean }) {
  return (
    <div className="relative pt-6">
      {carpetas.map((c, i) => (
        <div key={c.n} className="relative -mt-2 first:mt-0 sm:-mt-3" style={{ zIndex: i + 1 }}>
          {/* Pestaña. En móvil, escalera corta y fija (escalonar por porcentaje
              se sale de 375px); desde sm, el `left` propio de cada carpeta para
              que parezca un fichero de verdad. Va por variable CSS: un `left`
              inline ganaría al breakpoint. */}
          <div
            className="absolute -top-[19px] left-[var(--l-mob)] flex h-[20px] items-center gap-2 rounded-t-[7px] border border-b-0 px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] sm:left-[var(--l-desk)]"
            style={
              {
                borderColor: INK,
                backgroundColor: BONE,
                color: INK,
                '--l-mob': `calc(${i * 16}px + 3%)`,
                '--l-desk': c.left,
              } as React.CSSProperties
            }
          >
            <span style={{ color: TERRA }}>{c.n}</span>
            <span className="hidden sm:inline">{c.nombre}</span>
          </div>

          {/* Cuerpo */}
          <div
            className="relative overflow-hidden rounded-t-[18px] border border-b-0 px-5 pb-10 pt-6 sm:px-7"
            style={{ borderColor: INK, backgroundColor: BONE }}
          >
            <HalftoneIcon
              shape={c.icono}
              seed={i * 97 + 11}
              className="pointer-events-none absolute -right-2 -top-2 hidden h-[92px] w-[92px] text-[rgba(17,17,17,0.16)] sm:block"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-[15px] font-medium tracking-[-0.02em] text-[#111]">{c.nombre}</p>
                <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: TERRA }}>
                  {c.tipo}
                </p>
              </div>
              <EstadoChip estado={c.estado} en={en} />
            </div>
            <p className="relative mt-3 max-w-[62ch] font-mono text-[11px] leading-relaxed text-[rgba(17,17,17,0.65)]">
              {c.texto}
            </p>
          </div>
        </div>
      ))}

      {/* Base del archivador, en negativo — cierra la pila */}
      <div
        className="relative -mt-2 rounded-t-[18px] px-5 py-6 sm:-mt-3 sm:px-7"
        style={{ backgroundColor: INK, color: BONE, zIndex: carpetas.length + 1 }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em]">
            {en ? 'Every line above is live, or was.' : 'Cada línea de arriba está en producción, o lo estuvo.'}
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: TERRA }}>
            {en ? 'Full IP transfer' : 'La propiedad es tuya'}
          </p>
        </div>
      </div>
    </div>
  )
}
