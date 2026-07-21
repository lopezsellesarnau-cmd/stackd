/**
 * Full-bleed work previews — fill their grid tile edge to edge (no inset card,
 * no empty gutter), matching the photography tiles in the editorial reference.
 * Still DOM, not images: same approach as the rest of the site.
 */

function BrowserChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[#0C0D0E]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <div className="ml-2 flex-1 truncate rounded-full bg-white/[0.05] px-3 py-0.5 text-center text-[10.5px] text-fg-faint">
          {url}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
    </div>
  )
}

/** Schematic padel court — regulation markings (service boxes + the mid net line), line art. */
function PadelCourtIllustration() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[300px]" aria-hidden>
      <rect x="4" y="4" width="212" height="112" rx="3" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      {/* net */}
      <line x1="110" y1="4" x2="110" y2="116" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeDasharray="3 3" />
      {/* service lines */}
      <line x1="40" y1="4" x2="40" y2="116" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <line x1="180" y1="4" x2="180" y2="116" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <line x1="40" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      {/* highlighted service box (court 2, booked slot) */}
      <rect x="110" y="4" width="70" height="56" fill="rgba(193,102,61,0.16)" stroke="rgba(193,102,61,0.5)" strokeWidth="1.5" />
      {/* players */}
      <circle cx="70" cy="30" r="4" fill="rgba(255,255,255,0.35)" />
      <circle cx="70" cy="90" r="4" fill="rgba(255,255,255,0.35)" />
      <circle cx="150" cy="30" r="4" fill="#C1663D" />
      <circle cx="150" cy="90" r="4" fill="#C1663D" />
    </svg>
  )
}

function VoleaPreview() {
  const slots = ['17:00', '17:30', '18:00']
  return (
    <div className="flex w-full max-w-[300px] flex-col items-center gap-4">
      <PadelCourtIllustration />
      <div className="w-full">
        <p className="text-[12px] font-medium text-fg-muted">Court 2 · Padel Club Barcelona</p>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {slots.map((s, i) => (
            <div
              key={s}
              className={`rounded-md border py-1.5 text-center text-[10.5px] ${
                i === 1
                  ? 'border-accent/50 bg-accent-soft text-accent-hover'
                  : 'border-[rgba(255,255,255,0.08)] text-fg-faint'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
          <span className="text-[11px] text-fg-dim">17:30 · Court 2</span>
          <span className="text-[11px] font-medium text-risk-minimo">Book — £14</span>
        </div>
      </div>
    </div>
  )
}

/** Animated voice waveform — CSS-only bar heights, ties into "call in progress". */
function Waveform() {
  const bars = [6, 14, 9, 20, 12, 24, 10, 17, 7, 15, 22, 9, 13, 19, 8]
  return (
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-risk-minimo/70 pulse-dot"
          style={{ height: `${h}px`, animationDelay: `${i * 90}ms`, animationDuration: '1.1s' }}
        />
      ))}
    </div>
  )
}

function BlockFlowPreview() {
  return (
    <div className="w-full max-w-[280px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
          <p className="text-[12px] font-medium text-fg-muted">Voice agent — call in progress</p>
        </div>
        <span className="text-[10.5px] tabular-nums text-fg-faint">00:14</span>
      </div>
      <div className="mt-3 flex justify-center rounded-md bg-white/[0.03] py-2">
        <Waveform />
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          ['Caller', 'Water leak, Flat 3B'],
          ['Triage', 'Urgent — plumbing'],
          ['Confidence', '96%'],
          ['Ticket', '#4471 created'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-[11px]">
            <span className="text-fg-faint">{k}</span>
            <span className="text-fg-dim">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Candidate screening agent — recruiters/talent agencies. Funnel of stage
 * counts + a single spotlighted top match, instead of a flat list (that's
 * the marketing preview's shape) — different read at a glance: volume +
 * best result, not "here are 3 rows".
 */
function RecruitingPreview() {
  const stages = [
    { label: 'Applied', n: 47 },
    { label: 'Screened', n: 18 },
    { label: 'Interview', n: 5 },
  ]
  return (
    <div className="w-full max-w-[300px]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
        <p className="text-[12px] font-medium text-fg-muted">Screening agent</p>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5">
        {stages.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1 rounded-md bg-white/[0.04] px-2.5 py-2 text-center">
              <p className="font-display text-[18px] leading-none text-fg-muted">{s.n}</p>
              <p className="mt-1 truncate text-[9px] uppercase tracking-[0.06em] text-fg-faint">{s.label}</p>
            </div>
            {i < stages.length - 1 && <span className="shrink-0 text-fg-faint">→</span>}
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-md border border-accent/25 bg-accent-soft px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11.5px] font-medium text-fg-muted">M. Fernández — Backend Eng.</p>
          <span className="text-[11px] font-medium text-risk-minimo">92% match</span>
        </div>
        <p className="mt-0.5 text-[10px] text-fg-faint">Top candidate this week · flagged for interview</p>
      </div>
    </div>
  )
}

/**
 * Campaign copy agent — marketing agencies. Compact per-channel status
 * grid instead of a list — reads as a dashboard tile, distinct shape from
 * the recruiting funnel above.
 */
function MarketingPreview() {
  const channels = [
    { name: 'Instagram', status: 'Scheduled', dot: 'bg-risk-minimo' },
    { name: 'Google Ads', status: 'Approved', dot: 'bg-accent' },
    { name: 'LinkedIn', status: 'Draft', dot: 'bg-fg-faint' },
  ]
  return (
    <div className="w-full max-w-[300px]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
        <p className="text-[12px] font-medium text-fg-muted">Content agent</p>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-1.5">
        {channels.map((c) => (
          <div key={c.name} className="rounded-md bg-white/[0.04] px-2 py-2.5 text-center">
            <span className={`mx-auto block h-1.5 w-1.5 rounded-full ${c.dot}`} aria-hidden />
            <p className="mt-1.5 truncate text-[10px] text-fg-dim">{c.name}</p>
            <p className="mt-0.5 truncate text-[9px] text-fg-faint">{c.status}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-md bg-white/[0.04] px-3 py-2.5">
        <p className="text-[11px] text-fg-dim">&ldquo;Stop guessing your ad spend.&rdquo;</p>
        <p className="mt-0.5 text-[10px] text-fg-faint">Instagram · draft #4, awaiting client approval</p>
      </div>
    </div>
  )
}

export const TILES = {
  volea: {
    url: 'volea.app',
    preview: <VoleaPreview />,
    title: 'Volea',
    tag: 'Booking SaaS',
    d: 'Real-time availability and payments for padel clubs.',
  },
  blockflow: {
    url: 'app.blockflow.co.uk',
    preview: <BlockFlowPreview />,
    title: 'BlockFlow',
    tag: 'Property management',
    d: 'AI voice agent handling emergency calls, live.',
  },
  recruiting: {
    url: 'app.talent-screen.io',
    preview: <RecruitingPreview />,
    title: 'Screening Agent',
    tag: 'Recruiting',
    d: 'AI agent that scores and triages inbound applicants automatically.',
  },
  marketing: {
    url: 'app.campaign-agent.io',
    preview: <MarketingPreview />,
    title: 'Campaign Agent',
    tag: 'Marketing agencies',
    d: 'Drafts, tests and queues ad copy across channels — client reviews, agent executes.',
  },
} as const

export function WorkImage({ which }: { which: keyof typeof TILES }) {
  const t = TILES[which]
  return <BrowserChrome url={t.url}>{t.preview}</BrowserChrome>
}
