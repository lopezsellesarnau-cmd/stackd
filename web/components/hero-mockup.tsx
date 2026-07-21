'use client'

/**
 * Hero mockup — light-themed code editor, interactive: clicking a file swaps
 * the code panel, a git/branch strip and a build log react to the change, and
 * the status bar flashes "Building…" before settling to "Deployed". Full
 * bleed by design (see sections.tsx) — no outer border/shadow, so all the
 * "photo caption" details (branch, log, CTA) live inside the mockup's own
 * chrome instead of floating over it.
 */

import { useEffect, useState } from 'react'

type Token = readonly [string, string]
type Line = { n: number; t: readonly Token[] }

const LIGHT_TOKEN_COLOR: Record<string, string> = {
  keyword: 'text-[#A8532F]',
  fn: 'text-[#3F6B8F]',
  var: 'text-fg',
  prop: 'text-[#3F7A4E]',
  str: 'text-[#7A6B2A]',
  comment: 'text-fg-ghost',
  plain: 'text-[#5B564C]',
}

const FILES: Record<string, { lines: Line[]; log: string }> = {
  'triage-email.ts': {
    log: 'triage-email.test.ts  ✓ 6 passed  (312ms)',
    lines: [
      { n: 1, t: [['comment', '// Runs on every inbound support email']] },
      { n: 2, t: [['keyword', 'import'], ['plain', ' { classify } '], ['keyword', 'from'], ['str', " './classify'"]] },
      { n: 3, t: [['keyword', 'import'], ['plain', ' { notifySlack } '], ['keyword', 'from'], ['str', " './notify-slack'"]] },
      { n: 4, t: [['keyword', 'import'], ['plain', ' { createTicket } '], ['keyword', 'from'], ['str', " './create-ticket'"]] },
      { n: 5, t: [['plain', '']] },
      { n: 6, t: [['keyword', 'export async function'], ['fn', ' triageEmail'], ['plain', '(msg: Email) {']] },
      { n: 7, t: [['plain', '  const '], ['var', 'intent'], ['plain', ' = await '], ['fn', 'classify'], ['plain', '(msg.body)']] },
      { n: 8, t: [['plain', '']] },
      { n: 9, t: [['keyword', '  if'], ['plain', ' (intent.'], ['prop', 'urgency'], ['plain', ' === '], ['str', "'high'"], ['plain', ') {']] },
      { n: 10, t: [['plain', '    await '], ['fn', 'notifySlack'], ['plain', '(intent)']] },
      { n: 11, t: [['plain', '  }']] },
      { n: 12, t: [['plain', '']] },
      { n: 13, t: [['keyword', '  return'], ['fn', ' createTicket'], ['plain', '({ ...intent, source: msg })']] },
      { n: 14, t: [['plain', '}']] },
    ],
  },
  'classify.ts': {
    log: 'classify.test.ts  ✓ 4 passed  (198ms)',
    lines: [
      { n: 1, t: [['comment', '// Structured-output call, schema-validated']] },
      { n: 2, t: [['keyword', 'import'], ['plain', ' { llm } '], ['keyword', 'from'], ['str', " '@stackd/ai'"]] },
      { n: 3, t: [['keyword', 'import'], ['plain', ' { IntentSchema } '], ['keyword', 'from'], ['str', " './types'"]] },
      { n: 4, t: [['plain', '']] },
      { n: 5, t: [['keyword', 'export async function'], ['fn', ' classify'], ['plain', '(body: string) {']] },
      { n: 6, t: [['plain', '  const '], ['var', 'res'], ['plain', ' = await '], ['fn', 'llm'], ['plain', '.'], ['fn', 'run'], ['plain', '({']] },
      { n: 7, t: [['plain', '    prompt: '], ['fn', 'buildPrompt'], ['plain', '(body),']] },
      { n: 8, t: [['plain', '    schema: '], ['var', 'IntentSchema'], ['plain', ',']] },
      { n: 9, t: [['plain', '    temperature: '], ['fn', '0.1'], ['plain', ',']] },
      { n: 10, t: [['plain', '  })']] },
      { n: 11, t: [['plain', '']] },
      { n: 12, t: [['keyword', '  return'], ['plain', ' res.'], ['prop', 'data']] },
      { n: 13, t: [['plain', '}']] },
    ],
  },
  'notify-slack.ts': {
    log: 'notify-slack.test.ts  ✓ 3 passed  (87ms)',
    lines: [
      { n: 1, t: [['comment', '// Posts a summary to #support-urgent']] },
      { n: 2, t: [['keyword', 'import'], ['plain', ' { summarize } '], ['keyword', 'from'], ['str', " './summarize'"]] },
      { n: 3, t: [['plain', '']] },
      { n: 4, t: [['keyword', 'export async function'], ['fn', ' notifySlack'], ['plain', '(intent: Intent) {']] },
      { n: 5, t: [['keyword', '  return'], ['fn', ' fetch'], ['plain', '(env.'], ['var', 'SLACK_WEBHOOK'], ['plain', ', {']] },
      { n: 6, t: [['plain', '    method: '], ['str', "'POST'"], ['plain', ',']] },
      { n: 7, t: [['plain', '    headers: { '], ['str', "'content-type'"], ['plain', ': '], ['str', "'application/json'"], ['plain', ' },']] },
      { n: 8, t: [['plain', '    body: '], ['var', 'JSON'], ['plain', '.'], ['fn', 'stringify'], ['plain', '({ text: '], ['fn', 'summarize'], ['plain', '(intent) }),']] },
      { n: 9, t: [['plain', '  })']] },
      { n: 10, t: [['plain', '}']] },
    ],
  },
  'create-ticket.ts': {
    log: 'create-ticket.test.ts  ✓ 5 passed  (134ms)',
    lines: [
      { n: 1, t: [['comment', '// Writes to Postgres, idempotent on msg.id']] },
      { n: 2, t: [['keyword', 'import'], ['plain', ' { db } '], ['keyword', 'from'], ['str', " '@stackd/db'"]] },
      { n: 3, t: [['plain', '']] },
      { n: 4, t: [['keyword', 'export async function'], ['fn', ' createTicket'], ['plain', '(input: TicketInput) {']] },
      { n: 5, t: [['plain', '  const '], ['var', 'ticket'], ['plain', ' = await '], ['var', 'db'], ['plain', '.'], ['prop', 'tickets'], ['plain', '.'], ['fn', 'upsert'], ['plain', '(input)']] },
      { n: 6, t: [['plain', '']] },
      { n: 7, t: [['keyword', '  return'], ['plain', ' ticket']] },
      { n: 8, t: [['plain', '}']] },
    ],
  },
  'types.ts': {
    log: 'tsc --noEmit  ✓ no type errors',
    lines: [
      { n: 1, t: [['keyword', 'export type'], ['var', ' Intent'], ['plain', ' = {']] },
      { n: 2, t: [['plain', '  urgency: '], ['str', "'low'"], ['plain', ' | '], ['str', "'medium'"], ['plain', ' | '], ['str', "'high'"], ['plain', ',']] },
      { n: 3, t: [['plain', '  category: string,']] },
      { n: 4, t: [['plain', '  summary: string,']] },
      { n: 5, t: [['plain', '  suggestedReply?: string,']] },
      { n: 6, t: [['plain', '}']] },
    ],
  },
}

const FILE_NAMES = Object.keys(FILES)

export function HeroMockup() {
  const [active, setActive] = useState(FILE_NAMES[0])
  const [status, setStatus] = useState<'idle' | 'building'>('idle')

  useEffect(() => {
    if (status !== 'building') return
    const id = setTimeout(() => setStatus('idle'), 700)
    return () => clearTimeout(id)
  }, [status])

  function selectFile(name: string) {
    if (name === active) return
    setActive(name)
    setStatus('building')
  }

  const file = FILES[active]

  return (
    <div className="w-full overflow-hidden bg-white">
      <div className="flex items-center gap-4 border-b border-[rgba(0,0,0,0.08)] px-8 py-4">
        <TrafficLights />
        <span className="text-[13.5px] text-fg-faint">{active} — stackd-agency</span>
        <span className="ml-auto hidden items-center gap-2 text-[12px] text-fg-ghost sm:flex">
          <span aria-hidden>⌥</span> main
          <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] text-fg-faint">
            2 files changed
          </span>
        </span>
      </div>

      <div className="flex min-h-[420px] sm:min-h-[520px]">
        <nav className="hidden w-56 shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-[#FAF7F0] p-4 sm:block">
          {FILE_NAMES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => selectFile(f)}
              className={`block w-full truncate rounded-[6px] px-3 py-2 text-left text-[13.5px] transition-colors ${
                f === active
                  ? 'bg-black/[0.06] font-medium text-fg'
                  : 'text-fg-faint hover:bg-black/[0.03] hover:text-fg-dim'
              }`}
            >
              {f}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 p-8 font-mono text-[15px] leading-[1.95] sm:p-9">
          {file.lines.map((line) => (
            <div key={line.n} className="flex gap-6">
              <span className="w-6 shrink-0 select-none text-right text-fg-ghost">{line.n}</span>
              <span className="whitespace-pre">
                {line.t.map((tk, i) => (
                  <span key={i} className={LIGHT_TOKEN_COLOR[tk[0]]}>
                    {tk[1]}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <div className="flex gap-6">
            <span className="w-6 shrink-0 select-none text-right text-fg-ghost">{file.lines.length + 1}</span>
            <span className="type-caret inline-block h-[16px] w-[8px] translate-y-[3px] bg-accent" />
          </div>
        </div>
      </div>

      {/* Build log — reacts to the active file, ties the code back to "ships to production". */}
      <div className="border-t border-[rgba(0,0,0,0.08)] bg-[#141412] px-8 py-2.5 font-mono text-[12px] text-white/70">
        <span className="text-white/40">$</span> pnpm test {active} &nbsp;
        <span className={status === 'building' ? 'text-warn' : 'text-[#7FBF8F]'}>
          {status === 'building' ? 'running…' : file.log}
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-[rgba(0,0,0,0.08)] bg-[#FAF7F0] px-8 py-3.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === 'building' ? 'bg-warn pulse-dot' : 'bg-risk-minimo pulse-dot'
          }`}
          aria-hidden
        />
        <span className="text-[13px] text-fg-dim">
          {status === 'building' ? 'Building…' : 'Deployed to production — just now'}
        </span>
        <span className="hidden text-[11px] uppercase tracking-[0.1em] text-fg-ghost sm:inline">
          · Click a file to switch
        </span>
        <a
          href="#contact"
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[rgba(0,0,0,0.14)] bg-white text-fg transition-colors hover:bg-black/[0.04]"
          aria-label="Get in touch"
        >
          →
        </a>
      </div>
    </div>
  )
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
    </div>
  )
}
