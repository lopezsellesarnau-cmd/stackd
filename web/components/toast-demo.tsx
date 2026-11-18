'use client'

import { useEffect, useRef, useState } from 'react'
import { Toaster, toast } from './kit/toast'

// The Toast demo for the store: buttons that send each kind of toast into their own box.
// With `auto`, it plays the kinds on a loop while it's on screen, until someone presses a button.

const wait = (ms: number, ok = true) => new Promise<void>((done, fail) => setTimeout(() => (ok ? done() : fail(new Error('no'))), ms))

export function ToastDemo({ id, dark, auto = false, height = 300 }: { id: string; dark: boolean; auto?: boolean; height?: number | string }) {
  const box = useRef<HTMLDivElement>(null)
  const [played, setPlayed] = useState(false)
  const fails = useRef(0)

  const send = {
    copy: () => toast('Link copied', { description: 'stackd.codes/toast', toaster: id }),
    save: () => toast.promise(wait(1800), { loading: 'Saving your changes', success: 'Saved', error: "Couldn't save", toaster: id }),
    delete: () => toast('Moved to bin', { description: '3 files', toaster: id, action: { label: 'Undo', onClick: () => toast.success('Restored', { toaster: id }) } }),
    upload: () => toast.promise(wait(1600, fails.current++ % 2 === 0), { loading: 'Uploading photo.jpg', success: 'Uploaded', error: 'Upload failed', toaster: id }),
  }

  // The loop: only while visible, and never again once someone has pressed a button
  useEffect(() => {
    if (!auto || played || !box.current) return
    const steps = [send.copy, send.save, send.delete, send.upload]
    let i = 0, timer = 0
    const tick = () => { steps[i++ % steps.length](); timer = window.setTimeout(tick, 3200) }
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer)
      if (e.isIntersecting) timer = window.setTimeout(tick, 600)
      else toast.dismiss()
    })
    io.observe(box.current)
    return () => { io.disconnect(); clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, played, id])

  const btn = dark ? 'bg-white/10 text-white ring-white/10' : 'bg-white text-[#141310] ring-[#141310]/5 shadow-[0_1px_2px_rgba(20,19,16,.06)]'
  return (
    <div ref={box} className="relative w-full" style={{ height }}>
      <div className="flex flex-wrap justify-center gap-2 pt-6">
        {(['copy', 'save', 'delete', 'upload'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => { setPlayed(true); send[k]() }}
            className={`h-10 rounded-full px-4 text-[13px] font-medium capitalize ring-1 active:scale-[.97] ${btn}`}
          >
            {k}
          </button>
        ))}
      </div>
      <Toaster id={id} contained theme={dark ? 'dark' : 'light'} max={3} />
    </div>
  )
}
