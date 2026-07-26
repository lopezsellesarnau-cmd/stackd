'use client'

/**
 * Árbol de información para una agencia de marketing: qué le pasa a cada brief
 * que entra y, sobre todo, **qué se publica solo, qué pide aprobación y qué va
 * a una persona**. Misma gramática que el árbol de clasificación de Aithority
 * (ver vault, Sistema-UI/03-diagramas):
 *
 *  · codos rectos, columnas fijas con cabecera de nivel
 *  · el nodo es el estado, la arista es lo que hace el agente
 *  · EL COLOR DE LA LÍNEA ES EL DESENLACE, con leyenda
 *
 * Que la rama "a una persona" esté dibujada y en punteado es deliberado: vende
 * mejor un agente que sabe dónde parar que uno que promete hacerlo todo.
 */

import { useEffect, useRef, useState } from 'react'

const INK = '#111111'
const TERRA = '#C1663D'
const OKG = '#3F7A4E'
const FAINT = 'rgba(17,17,17,0.26)'
const MONO = 'var(--font-mono, monospace)'

type Tono = 'ruta' | 'auto' | 'aprob' | 'humano'
const COLOR: Record<Tono, string> = {
  ruta: 'rgba(17,17,17,0.6)',
  auto: OKG,
  aprob: TERRA,
  humano: FAINT,
}

const elbow = (x1: number, y1: number, x2: number, y2: number) => {
  if (Math.abs(y1 - y2) < 0.5) return `M ${x1} ${y1} H ${x2}`
  const mx = x1 + (x2 - x1) * 0.42
  return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`
}

function Rama({ d, tono = 'ruta' }: { d: string; tono?: Tono }) {
  const dashed = tono === 'humano'
  return (
    <path
      d={d}
      fill="none"
      stroke={COLOR[tono]}
      strokeWidth={tono === 'ruta' ? 1.4 : 1.7}
      strokeDasharray={dashed ? '3 4' : undefined}
    />
  )
}

function Nodo({
  x,
  y,
  label,
  sub,
  tono = 'ruta',
}: {
  x: number
  y: number
  label: string
  sub?: string
  tono?: Tono
}) {
  const dim = tono === 'humano'
  const color = dim ? FAINT : tono === 'aprob' ? TERRA : tono === 'auto' ? OKG : INK
  return (
    <g>
      <rect
        x={x - 11}
        y={y - 3.5}
        width={7}
        height={7}
        fill={dim ? 'none' : color}
        stroke={color}
        strokeWidth="1.2"
      />
      <text x={x} y={y + 4} fill={color} fontSize="11.5" letterSpacing="0.05em" style={{ fontFamily: MONO }}>
        {label}
      </text>
      {sub && (
        <text
          x={x}
          y={y + 18}
          fill={dim ? FAINT : 'rgba(17,17,17,0.45)'}
          fontSize="9.5"
          letterSpacing="0.07em"
          style={{ fontFamily: MONO }}
        >
          {sub}
        </text>
      )}
    </g>
  )
}

/** Lo que hace el agente, sobre el tramo. */
function Arista({ x, y, label, dim = false }: { x: number; y: number; label: string; dim?: boolean }) {
  return (
    <text
      x={x}
      y={y - 7}
      textAnchor="end"
      fill={dim ? FAINT : 'rgba(17,17,17,0.5)'}
      fontSize="9"
      letterSpacing="0.13em"
      style={{ fontFamily: MONO }}
    >
      {label}
    </text>
  )
}

/** Volumen semanal, en bloques contables. */
function Bloques({ x, y, filled, max = 6 }: { x: number; y: number; filled: number; max?: number }) {
  return (
    <g>
      {Array.from({ length: max }).map((_, i) => (
        <rect
          key={i}
          x={x + i * 12}
          y={y - 4.5}
          width={9}
          height={9}
          fill={i < filled ? INK : 'none'}
          stroke={i < filled ? INK : 'rgba(17,17,17,0.28)'}
          strokeWidth="1"
        />
      ))}
    </g>
  )
}

const NIVELES = [
  { x: 20, es: 'Entrada', en: 'Input' },
  { x: 175, es: 'Contexto', en: 'Context' },
  { x: 360, es: 'Tipo de pieza', en: 'Piece type' },
  { x: 640, es: 'Salida', en: 'Outcome' },
]

type Pieza = { y: number; tipo: [string, string]; hace: [string, string]; salida: [string, string]; tono: Tono; vol: number }
// Cada texto va [es, en]; `tx` de abajo elige.
const PIEZAS: Pieza[] = [
  { y: 150, tipo: ['STAGING VIRTUAL', 'VIRTUAL STAGING'], hace: ['3 estancias · misma foto', '3 rooms · same photo'], salida: ['PUBLICA SOLO', 'AUTO-PUBLISHED'], tono: 'auto', vol: 6 },
  { y: 250, tipo: ['CLIP DE VÍDEO', 'VIDEO CLIP'], hace: ['vertical · 8s', 'vertical · 8s'], salida: ['PUBLICA SOLO', 'AUTO-PUBLISHED'], tono: 'auto', vol: 5 },
  { y: 350, tipo: ['DESCRIPCIÓN', 'DESCRIPTION'], hace: ['redacta · espera ok', 'drafts · waits for ok'], salida: ['APROBACIÓN', 'NEEDS APPROVAL'], tono: 'aprob', vol: 4 },
  { y: 440, tipo: ['PRECIO', 'PRICE'], hace: ['solo la sugerencia', 'suggestion only'], salida: ['A UNA PERSONA', 'TO A PERSON'], tono: 'humano', vol: 1 },
]

const LEYENDA: { tono: Tono; t: [string, string] }[] = [
  { tono: 'auto', t: ['Se publica solo', 'Ships on its own'] },
  { tono: 'aprob', t: ['Pide aprobación', 'Needs approval'] },
  { tono: 'humano', t: ['Va a una persona', 'Goes to a person'] },
]

/** Elige idioma en una tupla [es, en]. */
const tx = (v: [string, string], en: boolean) => (en ? v[1] : v[0])

// ── Versión móvil ───────────────────────────────────────────────────────

function ArbolMovil({ en }: { en: boolean }) {
  return (
    <div className="p-4 lg:hidden">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(17,17,17,0.38)]">
        {en ? 'Input' : 'Entrada'}
      </p>
      <p className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#111]">
        <span className="h-[7px] w-[7px] shrink-0 bg-[#111]" aria-hidden />
        {en ? 'PHOTOS UPLOADED' : 'FOTOS SUBIDAS'}
      </p>
      <p className="ml-[15px] font-mono text-[10px] text-[rgba(17,17,17,0.45)]">Carrer de Mallorca 42, 3-1</p>

      <div className="ml-[3px] flex items-center gap-2 py-1.5">
        <span className="h-6 w-px bg-[rgba(17,17,17,0.3)]" aria-hidden />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[rgba(17,17,17,0.45)]">
          {en ? 'Photo quality ok' : 'Calidad de foto ok'}
        </span>
      </div>

      <div className="mt-3 space-y-2.5 border-t pt-4" style={{ borderColor: 'rgba(17,17,17,0.14)' }}>
        {PIEZAS.map((p) => {
          const c = COLOR[p.tono]
          return (
            <div key={p.tipo[0]} className="border-b pb-2.5 last:border-b-0" style={{ borderColor: 'rgba(17,17,17,0.14)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11.5px] text-[#111]">{tx(p.tipo, en)}</span>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em]"
                  style={{ borderColor: c, color: c }}
                >
                  <span className="h-1 w-1" style={{ backgroundColor: c }} aria-hidden />
                  {tx(p.salida, en)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-[rgba(17,17,17,0.5)]">{tx(p.hace, en)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente ──────────────────────────────────────────────────────────

export function AgencyTree({ en }: { en: boolean }) {
  return (
    <div className="border" style={{ borderColor: 'rgba(17,17,17,0.22)', backgroundColor: '#F0EEE9' }}>
      <div
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[rgba(17,17,17,0.55)]"
        style={{ borderColor: 'rgba(17,17,17,0.22)' }}
      >
        <span>{en ? 'Content pipeline' : 'Ruta de una pieza'}</span>
        <span className="hidden sm:inline">{en ? 'Real estate agency' : 'Agencia inmobiliaria'}</span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: TERRA }} aria-hidden />
          16 {en ? 'listings / week' : 'propiedades / semana'}
        </span>
      </div>

      <ArbolMovil en={en} />

      <div className="hidden overflow-x-auto p-4 lg:block">
        <svg
          viewBox="0 0 1000 500"
          className="w-full min-w-[860px]"
          role="img"
          aria-label="Ruta de una propiedad: qué publica el agente solo, qué pide aprobación y qué va a una persona"
        >
          {/* Cabecera de niveles */}
          <g aria-hidden>
            {NIVELES.map((n) => (
              <text
                key={n.es}
                x={n.x - 11}
                y={28}
                fill="rgba(17,17,17,0.38)"
                fontSize="9"
                letterSpacing="0.18em"
                style={{ fontFamily: MONO }}
              >
                {tx([n.es, n.en], en).toUpperCase()}
              </text>
            ))}
            <line x1="9" y1="42" x2="980" y2="42" stroke="rgba(17,17,17,0.14)" strokeWidth="1" />
            {NIVELES.map((n) => (
              <line
                key={`g${n.x}`}
                x1={n.x - 11}
                y1="42"
                x2={n.x - 11}
                y2="470"
                stroke="rgba(17,17,17,0.07)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Tronco */}
          <Rama d={elbow(63, 250, 164, 250)} />
          {/* Rama descartada: falta contexto */}
          <Rama d={elbow(240, 250, 349, 70)} tono="humano" />
          <Nodo x={360} y={70} label={en ? 'ASKS FOR PHOTOS' : 'PIDE MÁS FOTOS'} sub={en ? 'from the agent' : 'al agente inmobiliario'} tono="humano" />
          <Arista x={349} y={70} label={en ? 'LOW QUALITY' : 'BAJA CALIDAD'} dim />

          {/* Del contexto a cada tipo de pieza */}
          {PIEZAS.map((p) => (
            <Rama key={`t${p.tipo[0]}`} d={elbow(240, 250, 349, p.y)} />
          ))}

          {/* De cada pieza a su salida */}
          {PIEZAS.map((p) => (
            <Rama key={`s${p.tipo[0]}`} d={elbow(455, p.y, 629, p.y)} tono={p.tono} />
          ))}

          {/* Nodos */}
          <Nodo x={20} y={250} label="PHOTOS" sub="Mallorca 42, 3-1" />
          <Nodo x={175} y={250} label={en ? 'ANALYSIS' : 'ANÁLISIS'} sub={en ? 'rooms + light' : 'estancias + luz'} />
          <Arista x={164} y={250} label={en ? 'ARRIVES' : 'ENTRA'} />

          {PIEZAS.map((p) => (
            <g key={p.tipo[0]}>
              <Nodo x={360} y={p.y} label={tx(p.tipo, en)} />
              <Arista x={629} y={p.y} label={tx(p.hace, en).toUpperCase()} dim={p.tono === 'humano'} />
              <Nodo x={640} y={p.y} label={tx(p.salida, en)} tono={p.tono} />
              <Bloques x={880} y={p.y} filled={p.vol} />
            </g>
          ))}

          {/* Leyenda */}
          <g>
            {LEYENDA.map((l, i) => {
              const y = 400 + i * 26
              return (
                <g key={l.t[0]}>
                  <line
                    x1={9}
                    y1={y}
                    x2={69}
                    y2={y}
                    stroke={COLOR[l.tono]}
                    strokeWidth={1.7}
                    strokeDasharray={l.tono === 'humano' ? '3 4' : undefined}
                  />
                  <text
                    x={79}
                    y={y + 3.5}
                    fill="rgba(17,17,17,0.5)"
                    fontSize="9"
                    letterSpacing="0.12em"
                    style={{ fontFamily: MONO }}
                  >
                    {tx(l.t, en).toUpperCase()}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}
