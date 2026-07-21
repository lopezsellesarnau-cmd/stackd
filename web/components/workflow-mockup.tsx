/**
 * Mockup del "producto" de StackD: no vendemos un SaaS con UI propia, vendemos
 * automatizaciones. Este mockup enseña un workflow de agente en ejecución —
 * UI real en DOM (mismo enfoque que linear.app), con una animación de progreso
 * para que se sienta "vivo" sin ser un vídeo.
 */

const PASOS = [
  { n: '01', t: 'Trigger', d: 'Nuevo email en soporte@cliente.com', estado: 'done' },
  { n: '02', t: 'Extracción', d: 'GPT-4 clasifica intención y urgencia', estado: 'done' },
  { n: '03', t: 'Acción', d: 'Crea ticket en Linear + responde al cliente', estado: 'running' },
  { n: '04', t: 'Notificación', d: 'Avisa al equipo en Slack si es urgente', estado: 'pending' },
] as const

const ESTADO_UI = {
  done: { dot: 'bg-risk-minimo', label: 'Hecho', text: 'text-risk-minimo' },
  running: { dot: 'bg-accent pulse-dot', label: 'En curso', text: 'text-accent-hover' },
  pending: { dot: 'bg-fg-ghost', label: 'Pendiente', text: 'text-fg-faint' },
} as const

export function WorkflowMockup() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-accent text-[10px] font-bold text-white">
            S
          </span>
          <span className="text-[12.5px] font-medium">Triaje de soporte — automatización activa</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-fg-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-minimo pulse-dot" />
          En ejecución
        </span>
      </div>

      <div className="divide-y divide-[rgba(255,255,255,0.05)]">
        {PASOS.map((p) => {
          const e = ESTADO_UI[p.estado]
          return (
            <div key={p.n} className="flex items-center gap-4 px-5 py-4">
              <span className="w-6 shrink-0 text-[12px] tabular-nums text-fg-ghost">{p.n}</span>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium tracking-tight">{p.t}</p>
                <p className="mt-0.5 truncate text-[12px] text-fg-dim">{p.d}</p>
              </div>
              <span className={`shrink-0 text-[11px] ${e.text}`}>{e.label}</span>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-3">
        <p className="text-[11px] text-fg-faint">
          Latencia media: <span className="text-fg-dim">1.4s</span> · Ejecuciones hoy:{' '}
          <span className="text-fg-dim">312</span> · Errores: <span className="text-risk-minimo">0</span>
        </p>
      </div>
    </div>
  )
}
