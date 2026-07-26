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
 * Content engine — real estate listings. A 3-step pipeline (photo → virtual
 * staging → video clip, last step still rendering) reads as "in progress",
 * distinct shape from the finished-result card underneath.
 */
function StagingPreview() {
  const steps = [
    { label: 'Photo uploaded', done: true },
    { label: 'Virtual staging', done: true },
    { label: 'Video clip', done: false },
  ]
  return (
    <div className="w-full max-w-[300px]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
        <p className="text-[12px] font-medium text-fg-muted">Content engine</p>
      </div>

      <div className="mt-3.5 space-y-1.5">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
            <span className="text-[11px] text-fg-dim">{s.label}</span>
            <span className={`text-[10.5px] ${s.done ? 'text-risk-minimo' : 'text-fg-faint'}`}>
              {s.done ? '✓' : 'Rendering…'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-md border border-accent/25 bg-accent-soft px-3 py-2.5">
        <p className="text-[11.5px] font-medium text-fg-muted">Carrer de Mallorca 42, 3-1</p>
        <p className="mt-0.5 text-[10px] text-fg-faint">Ready to post · vertical, 8s</p>
      </div>
    </div>
  )
}

/**
 * Lead response agent — estate agencies. WhatsApp-thread shape: an inbound
 * enquiry, a qualifying status, then a booked-viewing card — reads as a
 * live conversation, distinct from the pipeline shape above.
 */
function LeadAgentPreview() {
  return (
    <div className="w-full max-w-[300px]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
        <p className="text-[12px] font-medium text-fg-muted">Lead agent — WhatsApp</p>
      </div>

      <div className="mt-3.5 rounded-md bg-white/[0.04] px-3 py-2.5">
        <p className="text-[11px] text-fg-dim">&ldquo;Is Carrer de Mallorca 42 still available?&rdquo;</p>
      </div>

      <div className="mt-1.5 flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
        <span className="text-[11px] text-fg-faint">Qualifying budget &amp; financing…</span>
      </div>

      <div className="mt-2.5 rounded-md border border-accent/25 bg-accent-soft px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11.5px] font-medium text-fg-muted">Viewing booked</p>
          <span className="text-[11px] font-medium text-risk-minimo">Thu · 17:30</span>
        </div>
      </div>
    </div>
  )
}

export const TILES = {
  blockflow: {
    url: 'app.blockflow.co.uk',
    preview: <BlockFlowPreview />,
    title: 'BlockFlow',
    tag: 'Property management',
    d: 'AI voice agent handling emergency calls, live.',
  },
  staging: {
    url: 'app.stackd.codes/staging',
    preview: <StagingPreview />,
    title: 'Content Engine',
    tag: 'Real estate listings',
    d: 'Upload photos, get virtual staging and a video clip ready to post, same day.',
  },
  leadagent: {
    url: 'app.stackd.codes/leads',
    preview: <LeadAgentPreview />,
    title: 'Lead Agent',
    tag: 'Estate agencies',
    d: 'Answers portal enquiries in seconds, qualifies budget and books the viewing.',
  },
} as const

export function WorkImage({ which }: { which: keyof typeof TILES }) {
  const t = TILES[which]
  return <BrowserChrome url={t.url}>{t.preview}</BrowserChrome>
}
