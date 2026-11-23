'use client'

import { useState } from 'react'
import { PromptBar } from './kit/prompt-bar'

/**
 * The top of the shop: what StackD is, a Prompt bar that finds components in the grid below, and the
 * one line that connects an AI agent to the MCP server (https://www.stackd.codes/mcp).
 */

const MCP = 'https://www.stackd.codes/mcp'

// What each agent needs to reach the MCP server
const AGENTS = [
  { id: 'claude', label: 'Claude Code', code: `claude mcp add --transport http stackd ${MCP}` },
  { id: 'cursor', label: 'Cursor', code: `{ "mcpServers": { "stackd": { "url": "${MCP}" } } }`, where: '~/.cursor/mcp.json' },
  { id: 'codex', label: 'Codex', code: `[mcp_servers.stackd]\nurl = "${MCP}"`, where: '~/.codex/config.toml' },
  { id: 'vscode', label: 'VS Code', code: `code --add-mcp '{"name":"stackd","type":"http","url":"${MCP}"}'` },
  { id: 'shadcn', label: 'shadcn', code: 'npx shadcn add https://www.stackd.codes/r/bot.json' },
] as const

const TEXT = {
  en: {
    title: 'Components your AI can install.',
    intro: 'Interface components with the Figma file and the React code. Ask for one below, or connect your agent and let it add them for you.',
    placeholder: 'Find a component: a loader with the Bot…',
    connect: 'Connect your agent',
    copy: 'Copy',
    copied: 'Copied',
    paste: 'Paste into',
    keyNote: 'Free components work straight away. For paid ones, add your Gumroad licence key as a Bearer token.',
    none: "Nothing matches that yet. Try words like loader, chart, button, image, menu or Bot.",
    found: (names: string[]) =>
      names.length === 1 ? `${names[0]}. It's first in the grid below.` : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}. They're first in the grid below.`,
  },
  es: {
    title: 'Componentes que tu IA puede instalar.',
    intro: 'Componentes de interfaz con el archivo de Figma y el código en React. Pide uno aquí abajo, o conecta tu agente y deja que los añada por ti.',
    placeholder: 'Busca un componente: un loader con el Bot…',
    connect: 'Conecta tu agente',
    copy: 'Copiar',
    copied: 'Copiado',
    paste: 'Pégalo en',
    keyNote: 'Los gratis funcionan al momento. Para los de pago, añade tu clave de licencia de Gumroad como token Bearer.',
    none: 'Aún no hay nada así. Prueba con palabras como loader, gráfico, botón, imagen, menú o Bot.',
    found: (names: string[]) =>
      names.length === 1 ? `${names[0]}. Está el primero en la lista de abajo.` : `${names.slice(0, -1).join(', ')} y ${names.at(-1)}. Están los primeros en la lista de abajo.`,
  },
}

// Words that say nothing about which component
const STOP = new Set('a an the with and or for of to in on my me i want need some something like that this component components un una el la los las con y o para de del en mi quiero necesito algo como componente componentes que'.split(' '))

/** The components that match a prompt, best first. `index` maps each id to its name and the words it answers to. */
export function findComponents<Id extends string>(prompt: string, index: Record<Id, [string, string]>): Id[] {
  const words = prompt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w))
  if (!words.length) return []
  const scored = (Object.keys(index) as Id[]).map((id) => {
    const [name, keys] = index[id]
    const hay = ` ${name} ${keys} `.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    let score = 0
    for (const w of words) {
      // "bot" is in half the shop: it only breaks ties
      if (w === 'bot') { if (hay.includes(' bot ')) score += 0.5; continue }
      const stem = w.length > 4 ? w.replace(/(es|s)$/, '') : w
      if (hay.includes(` ${w} `)) score += 3
      else if (hay.includes(` ${stem}`)) score += 2
      else if (stem.length > 3 && hay.includes(stem)) score += 1
    }
    return { id, score }
  })
  // keep the close matches: at least half as good as the best one
  const top = Math.max(0, ...scored.map((s) => s.score))
  return scored.filter((s) => s.score > 0 && s.score >= top / 2).sort((a, b) => b.score - a.score).slice(0, 6).map((s) => s.id)
}

export function Hero<Id extends string>({
  lang,
  index,
  onFind,
}: {
  lang: 'en' | 'es'
  index: Record<Id, [string, string]>
  onFind: (ids: Id[] | null) => void
}) {
  const t = TEXT[lang]
  const [agent, setAgent] = useState<(typeof AGENTS)[number]['id']>('claude')
  const [copied, setCopied] = useState(false)
  const current = AGENTS.find((a) => a.id === agent)!

  const answer = async (prompt: string) => {
    const ids = findComponents(prompt, index)
    onFind(ids.length ? ids : null)
    await new Promise((r) => setTimeout(r, 350)) // a beat, so it reads as an answer
    return ids.length ? t.found(ids.map((id) => index[id][0])) : t.none
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  return (
    <section className="mb-3 rounded-[18px] bg-paper px-5 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">{t.title}</h2>
        <p className="mt-3 max-w-[52ch] text-[14px] text-fg-dim">{t.intro}</p>

        <div className="mt-7 w-full text-left">
          <PromptBar compact bot onSend={answer} placeholder={t.placeholder} />
        </div>

        <div className="mt-6 w-full text-left">
          <p className="text-fg-faint">{t.connect}</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label={t.connect}>
            {AGENTS.map((a) => (
              <button
                key={a.id}
                role="tab"
                aria-selected={agent === a.id}
                onClick={() => { setAgent(a.id); setCopied(false) }}
                className={`rounded-full px-3 py-1 transition-colors ${agent === a.id ? 'bg-ink text-paper' : 'bg-card text-fg-muted hover:text-ink'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-start gap-3 rounded-[12px] bg-card px-3.5 py-3">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[12px] leading-[1.6] text-ink">{current.code}</pre>
            <button onClick={copy} className="shrink-0 rounded-full bg-paper px-3 py-1 text-[12px] font-medium transition-colors hover:bg-ink hover:text-paper">
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-fg-faint">
            {'where' in current ? `${t.paste} ${current.where}. ` : ''}
            {t.keyNote}
          </p>
        </div>
      </div>
    </section>
  )
}
