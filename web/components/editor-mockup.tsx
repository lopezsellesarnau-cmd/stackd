/**
 * Code editor mockups (VS Code / Xcode style) built as real DOM, not screenshots —
 * same approach as linear.app. The typing animation is CSS-only (steps() on a
 * monospace string), so it's cheap and loops without JS state.
 */

const VSCODE_LINES = [
  { n: 1, t: [['keyword', 'export async function'], ['fn', ' triageEmail'], ['plain', '(msg: Email) {']] },
  { n: 2, t: [['plain', '  const '], ['var', 'intent'], ['plain', ' = await '], ['fn', 'classify'], ['plain', '(msg.body)']] },
  { n: 3, t: [['plain', ''] ] },
  { n: 4, t: [['keyword', '  if'], ['plain', ' (intent.'], ['prop', 'urgency'], ['plain', ' === '], ['str', "'high'"], ['plain', ') {']] },
  { n: 5, t: [['plain', '    await '], ['fn', 'notifySlack'], ['plain', '(intent)']] },
  { n: 6, t: [['plain', '  }']] },
  { n: 7, t: [['plain', ''] ] },
  { n: 8, t: [['keyword', '  return'], ['fn', ' createTicket'], ['plain', '({ ...intent, source: msg })']] },
  { n: 9, t: [['plain', '}']] },
] as const

const TOKEN_COLOR: Record<string, string> = {
  keyword: 'text-accent-hover',
  fn: 'text-risk-transparencia',
  var: 'text-fg',
  prop: 'text-risk-minimo',
  str: 'text-warn',
  plain: 'text-fg-muted',
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

export function VSCodeMockup() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0D0E] shadow-2xl shadow-black/60"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-2.5">
        <TrafficLights />
        <span className="text-[11.5px] text-fg-faint">triage-email.ts — stackd-agency</span>
      </div>
      <div className="flex flex-1">
        <div className="hidden w-40 shrink-0 border-r border-[rgba(255,255,255,0.06)] p-3 sm:block">
          {['triage-email.ts', 'classify.ts', 'notify-slack.ts', 'create-ticket.ts', 'types.ts'].map((f, i) => (
            <div
              key={f}
              className={`truncate rounded-[4px] px-2 py-1 text-[11px] ${
                i === 0 ? 'bg-white/[0.06] text-fg-muted' : 'text-fg-faint'
              }`}
            >
              {f}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4 font-mono text-[12.5px] leading-[1.9]">
          {VSCODE_LINES.map((line) => (
            <div key={line.n} className="flex gap-4">
              <span className="w-4 shrink-0 select-none text-right text-fg-ghost">{line.n}</span>
              <span className="whitespace-pre">
                {line.t.map((tk, i) => (
                  <span key={i} className={TOKEN_COLOR[tk[0]]}>
                    {tk[1]}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <div className="flex gap-4">
            <span className="w-4 shrink-0 select-none text-right text-fg-ghost">10</span>
            <span className="type-caret inline-block h-[15px] w-[7px] translate-y-[2px] bg-accent" />
          </div>
        </div>
      </div>
    </div>
  )
}

const XCODE_FILES = ['BookingView.swift', 'CourtCardView.swift', 'ReservationModel.swift', 'PadelAPI.swift']

const XCODE_LINES = [
  { n: 1, t: [['keyword', 'struct'], ['fn', ' BookingView'], ['plain', ': View {']] },
  { n: 2, t: [['plain', '  @State '], ['keyword', 'private var'], ['var', ' selectedSlot'], ['plain', ': Slot?']] },
  { n: 3, t: [['plain', ''] ] },
  { n: 4, t: [['keyword', '  var'], ['fn', ' body'], ['plain', ': '], ['keyword', 'some'], ['plain', ' View {']] },
  { n: 5, t: [['fn', '    CourtGrid'], ['plain', '(slots: club.'], ['prop', 'availableSlots'], ['plain', ') {']] },
  { n: 6, t: [['var', '      slot'], ['plain', ' '], ['keyword', 'in'], ['plain', ' selectedSlot = slot']] },
  { n: 7, t: [['plain', '    }']] },
  { n: 8, t: [['plain', '  }']] },
  { n: 9, t: [['plain', '}']] },
] as const

export function XcodeMockup() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0D0E] shadow-2xl shadow-black/60"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-2.5">
        <TrafficLights />
        <span className="text-[11.5px] text-fg-faint">Volea.xcodeproj — Building for iOS</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-risk-minimo">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo" />
          Build succeeded
        </span>
      </div>
      <div className="flex flex-1">
        <div className="hidden w-40 shrink-0 border-r border-[rgba(255,255,255,0.06)] p-3 sm:block">
          {XCODE_FILES.map((f, i) => (
            <div
              key={f}
              className={`truncate rounded-[4px] px-2 py-1 text-[11px] ${
                i === 0 ? 'bg-white/[0.06] text-fg-muted' : 'text-fg-faint'
              }`}
            >
              {f}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4 font-mono text-[12.5px] leading-[1.9]">
          {XCODE_LINES.map((line) => (
            <div key={line.n} className="flex gap-4">
              <span className="w-4 shrink-0 select-none text-right text-fg-ghost">{line.n}</span>
              <span className="whitespace-pre">
                {line.t.map((tk, i) => (
                  <span key={i} className={TOKEN_COLOR[tk[0]]}>
                    {tk[1]}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
