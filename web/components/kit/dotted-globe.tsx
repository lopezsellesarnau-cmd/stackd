'use client'

import { useEffect, useRef } from 'react'

/**
 * Dotted globe · StackD Kit
 * The world in dots, turning slowly. Your places pulse on it like live users, and arcs fly between them with a light
 * running along each one. Drag it to spin it your way; let go and it carries on, then goes back to its own pace.
 * Point at a place to see its name.
 *
 * The land is built in (Natural Earth, public domain, at 1°), so there's nothing to load.
 * One canvas, drawn only on screen. React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type GlobePlace = { lat: number; lon: number; label?: string }
export type GlobeArc = { from: [number, number]; to: [number, number] }

type Props = {
  /** Width and height, px. */
  size?: number
  theme?: 'light' | 'dark'
  /** Places that pulse, like live users. */
  places?: GlobePlace[]
  /** Arcs between two [lat, lon] points, with a light running along them. */
  arcs?: GlobeArc[]
  /** Colour of the pulses and arcs. */
  accent?: string
  /** Degrees between dots. Smaller is denser. */
  density?: number
  /** How fast it turns on its own, degrees a second. 0 to keep it still. */
  spin?: number
  /** How far it leans towards you, degrees (positive shows more of the north). */
  tilt?: number
  /** The longitude facing you at the start. */
  start?: number
  className?: string
}

// Land at 1°: 180 rows from 90°N, each the lengths of alternating sea and land runs (two base-62 digits each)
const LAND = '5O|5O|5O|5O|5O|5O|2h0c3l|1w02010l0f0p3g|1r0p040D020936|1m07060d030P0z0201030m040F061k|1n0l080L0u08020416071i|1503050501030304010d020R0w071j051d|0Z0304010g01060a090O0x0404011i021d|0W04080207030205020a090N1o040w0b16|1107010305030202010601050m0D1f060r0o0n080z|14020m0601010p0B1e030r0o18|0U080902040401050203020201030m0z1d030o0w010504040d030B|0T060109010303050102040903010m0x1c040d04080M0a060z|00010T04010e05030103030g01010h0x1c040c040102010R03010202010d0t|0j0a0B0b0704030k0e0t02010L070A06011o0k|0h0o040f030e030401040504050a0d02010r0G0f0r040306011w020802|00010c0R060307010306020506070g0o0I0m0e02030a0205011H|00040c1e0106040202090a0l0L0r0302020p021H|000501030601021h090c090i0M0k0206030s011J|0107041j01010b0603020a0d0h090q0a030a052g|06010801031b0204040301080e0b0j070q0a030b022h02|080209180502020109070e0a0O0b022x01|0f1b0802040107030h070N0c032w010101|0e1a0g060n060M0c042c0203020907|0f0h020Q0g080o030M0d0429070909|0i0802020a0J0h090302170d0702011X020405030h|0n030g0J0f0a01040W0209030206071T0i030i|0m0201030i0F0g0f0U040c0101050501011S0h060h|0k020q0I0b0f0U030b030104051T0i070h|0h020t0K080i0S040a020103071R0j070i|0f010x0N020n0M0302030a010603011T0j050j|0L01030L030n0L030303072a01010d040k|0Q0K030n0L020306022d01010d020m|0Q0M010m01010P05032d01010e010m|0Q01011403010P02042g01020A|0R02010V0302040201010Q2i02020A|0V0S010306060M2l02010B|0U01010V090101010O2i03010B|0U0X010102010W0x0103031C04020A|0U110Y0e010g0302021C0H|0U0U0202110d030e091A06010B|0U0S100303090304020c0c1x06040z|0U0R100c0803040a0e1r09040A|0U0R100b0a0403090405041r0O|0U0O130a0702050301050201021u01070b020C|0U0O1309080206010303031v030102030c020C|0V0M14090l03031t07030c010D|0V0L15080e020602041u0102040309030D|0W0K1801060a0b0106020102021n050307050D|0X0J1801030d0p1m070204080D|0Y0H180h0q1m0601040301020H|100D190j0o1o09040K|110B190o06020c1o09020M|1102010x190q04070301041p08010N|1201020w190t011D0X|1301020h04020602190G010f021a0W|1401010g0d02180J010d03190W|1303010e0e03150K030d04160X|1501030c0f020101120M020e07110Y|1601020c0g01130O020d0101070Y0Z|1601030a1l0O020e03030a0Q02010W|1b091k0Q030k090N03010X|1c080e010103110Q030l0a0l010n05010X|1d080i020Y0S020k0b0h050g010217|1c0907030a020X0R030j0e0e060e1b|0o010O0905040e030S0R040h0f0c090c030217|1e0902050e0601010O0S030g0g0b0a0c030118|1h0d1a0T030d0i0a0b0d0d020W|1j0b190U040a0k090c0e0c020W|1p09150V03090m060i0b0b020W|1q09140W02060p060i0b0b020W|1s06150X01040s050i0b0d020U|1v04140Y0w050i0202070f010T|1w020b010U0X06020p040j0103060d0102010S|1w030704010502030K0X01060p040i0105030c010Y|1y0202010304010a0L130p0301010h0106010c0106010S|1y04020i0L110r0102010h020n0101010S|1B01020j0K110u020h010m0101030R|1F0j0L0Y0v020i020e0206010T|1E0p0H0a050I0P030d030Z|1F0p0I010d0G0M0203020b050Z|1F0q0Z0B0O0202020a0411|1D0s0Z0A0Q020202070710|1D0t0X0A0S03010105090a010P|1C0u0X0y0U040609020404010P|1C0v0W0x0W0405090e010L|1B0A0S0x0X030607020309030K|1B0A01010R0v0Y05040702030b0102040E|1C0F0O0t100408020301010104010301020a0B|1B0H0N0s12030g010d090z|1B0K0L0r13020g010b010308020101020s|1B0K0L0r15030p01030a07010o|1C0J0M0q16060p090b010l|1D0I0M0q1d0102020101010103010d0303020w|1D0H0N0r1h0104010m020b020i|1E0G0N0r1M010t|1F0E0P0q1u0109010B|1F0D0P0s08011j0605010B|1G0B0Q0s08011i0606020A|1G0B0P0t07021e02010706030z|1H0A0P0s07031c0c06030z|1J0y0P0s04061c0e03050l010b01|1L0w0P0q06051b0i01050w0101|1M0u0Q0o08051b0o0y|1M0u0R0m09051a0q0x|1M0u0R0m0905170v0f010f|1M0t0T0l0805150y0g010e|1M0s0U0m0705140A0u|1M0p0X0l0904140B0t|1L0o100k0903140D0s|1L0n110i0c01160D0r|1L0m120i1i0E0r|1L0m120i1j0D0r|1L0m130g1l0D0q|1L0l150e1m0C0r|1K0m150e1m0C0r|1K0l170c1o0B0r|1L0j180b1p0a080i0s|1K0j19091q090b02010d0t|1K0e01031b021x030g01010e0t|1J0g390c0n0106|1J0g3b0a0o0105|1I0h3b0a0p0104|1J0e3g0101020s0302|1J0b3O0303|1I0c3P0203|1I093o030o02010104|1I0b3m030n0306|1J083p010n0307|1I093L0309|1H083M0409|1H083N020a|1H093Y|1G093Z|1G082d011M|1H0641|1H0608033Q|1I0442|1I0640|1K063Y|1N0140|5O|5O|5O|5O|5O|5O|5O|1X023P|1U053P|1S0736010I|1P0a1K060I0406040f060I|1O0b1H0c0m120y|1O0b1C0q0a190u|1K02020b1r06020u071j0m|1K0f1104020a020K031q0j|1H0i0K02021f021B09|1N0c0I2Y09|0R0202020h06030a0403050g0F3109|0I0a010302070101070L0F3109|0y1r0C3409|0y1r0t3d09|0m1D0p3h09|0g03031D0805083l09|0i03011D0608073l09|0m1D030b073l09|0m1D030b023q09|0m1D023E09|0m5j09|00050107095q02|005O|005O|005O|005O|005O'

const B62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
let landGrid: Uint8Array | null = null
const land = () => {
  if (landGrid) return landGrid
  landGrid = new Uint8Array(360 * 180)
  LAND.split('|').forEach((row, y) => {
    let x = 0, on = 0
    for (let i = 0; i < row.length; i += 2) {
      const n = B62.indexOf(row[i]) * 62 + B62.indexOf(row[i + 1])
      if (on) landGrid!.fill(1, y * 360 + x, y * 360 + x + n)
      x += n; on ^= 1
    }
  })
  return landGrid
}
const isLand = (lat: number, lon: number) => {
  const y = Math.min(179, Math.max(0, Math.floor(90 - lat))), x = ((Math.floor(lon + 180) % 360) + 360) % 360
  return land()[y * 360 + x] === 1
}

const THEMES = {
  light: { bg: '#FFFFFF', dot: '20,19,16', sphere: ['#FFFFFF', '#F1F0EC'], rim: 'rgba(20,19,16,0.08)', label: '#141310', labelText: '#FFFFFF' },
  dark: { bg: '#141310', dot: '242,240,236', sphere: ['#1E1D1A', '#141310'], rim: 'rgba(242,240,236,0.1)', label: '#F2F0EC', labelText: '#141310' },
}
const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const RAD = Math.PI / 180
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const vec = (lat: number, lon: number): [number, number, number] => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)]

export const GLOBE_PLACES: GlobePlace[] = [
  { lat: 52.37, lon: 4.9, label: 'Amsterdam' },
  { lat: 40.71, lon: -74.0, label: 'New York' },
  { lat: 37.77, lon: -122.42, label: 'San Francisco' },
  { lat: -23.55, lon: -46.63, label: 'São Paulo' },
  { lat: 6.52, lon: 3.38, label: 'Lagos' },
  { lat: 19.08, lon: 72.88, label: 'Mumbai' },
  { lat: 1.35, lon: 103.82, label: 'Singapore' },
  { lat: 35.68, lon: 139.69, label: 'Tokyo' },
  { lat: -33.87, lon: 151.21, label: 'Sydney' },
]
export const GLOBE_ARCS: GlobeArc[] = [
  { from: [52.37, 4.9], to: [40.71, -74.0] },
  { from: [52.37, 4.9], to: [19.08, 72.88] },
  { from: [40.71, -74.0], to: [-23.55, -46.63] },
  { from: [37.77, -122.42], to: [35.68, 139.69] },
  { from: [1.35, 103.82], to: [-33.87, 151.21] },
  { from: [52.37, 4.9], to: [6.52, 3.38] },
]

export function DottedGlobe({ size = 440, theme = 'light', places = GLOBE_PLACES, arcs = GLOBE_ARCS, accent = '#BE9344', density = 2.2, spin = 8, tilt = 18, start = 10, className = '' }: Props) {
  const c = THEMES[theme]
  const cv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr)
    const g = canvas.getContext('2d')!
    const S = size, cx = S / 2, cy = S / 2, R = S * 0.42

    // ── the dots: rows of latitude, as many per row as fit, so they're even all over the sphere ──
    const dots: number[] = []
    for (let lat = -90 + density / 2; lat < 90; lat += density) {
      const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / density))
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i + 0.5) * (360 / n)
        if (isLand(lat, lon)) dots.push(...vec(lat, lon))
      }
    }
    const pv = places.map((p) => ({ ...p, v: vec(p.lat, p.lon), phase: Math.random() * 3 }))
    // each arc: points along the great circle, lifted off the surface in the middle
    const av = arcs.map((a, i) => {
      const A = vec(a.from[0], a.from[1]), B = vec(a.to[0], a.to[1])
      const ang = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1))
      const lift = 0.03 + 0.17 * (ang / Math.PI)
      const pts: [number, number, number][] = []
      for (let k = 0; k <= 48; k++) {
        const t = k / 48, s = Math.sin(ang) || 1
        const wa = Math.sin((1 - t) * ang) / s, wb = Math.sin(t * ang) / s
        const h = 1 + lift * Math.sin(Math.PI * t)
        pts.push([(A[0] * wa + B[0] * wb) * h, (A[1] * wa + B[1] * wb) * h, (A[2] * wa + B[2] * wb) * h])
      }
      return { pts, delay: i * 0.9 }
    })

    // ── the view: which longitude faces you, and the lean ──
    const view = { lon: start, lat: tilt, vLon: 0, vLat: 0, drag: false }
    const project = (x: number, y: number, z: number) => {
      const cl = Math.cos(-view.lon * RAD), sl = Math.sin(-view.lon * RAD)
      const x1 = x * cl + z * sl, z1 = -x * sl + z * cl
      const cp = Math.cos(view.lat * RAD), sp = Math.sin(view.lat * RAD)
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp
      return [cx + x1 * R, cy - y2 * R, z2]
    }

    let hover: { x: number; y: number } | null = null
    let raf = 0, last = performance.now(), visible = true
    const t0 = performance.now()

    const draw = (now: number) => {
      const time = (now - t0) / 1000
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, S, S)
      // the sphere: a soft body and a thin rim
      const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R)
      body.addColorStop(0, c.sphere[0]); body.addColorStop(1, c.sphere[1])
      g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill()
      g.strokeStyle = c.rim; g.lineWidth = 1; g.stroke()

      // the dots, the far side faint, the near side fuller towards the middle
      const buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()]
      const alpha = [0.05, 0.16, 0.4, 0.66, 0.86]
      const dot = R * 0.0085 + 0.3
      for (let i = 0; i < dots.length; i += 3) {
        const [x, y, z] = project(dots[i], dots[i + 1], dots[i + 2])
        const b = z < 0 ? 0 : z < 0.25 ? 1 : z < 0.5 ? 2 : z < 0.75 ? 3 : 4
        if (b === 0 && z < -0.6) continue
        const r = b === 0 ? dot * 0.7 : dot * (0.75 + 0.25 * z)
        buckets[b].moveTo(x + r, y); buckets[b].arc(x, y, r, 0, Math.PI * 2)
      }
      buckets.forEach((p, i) => { g.fillStyle = `rgba(${c.dot},${alpha[i]})`; g.fill(p) })

      // the arcs: a faint path, and a light running along it, then a ping where it lands
      const hidden = (x: number, y: number, z: number) => z < 0 && Math.hypot(x - cx, y - cy) < R
      g.lineCap = 'round'
      for (const a of av) {
        const P = a.pts.map((p) => project(p[0], p[1], p[2]))
        g.strokeStyle = accent; g.globalAlpha = 0.28; g.lineWidth = 1.1
        g.beginPath()
        let pen = false
        for (const [x, y, z] of P) { if (hidden(x, y, z)) { pen = false; continue } if (!pen) { g.moveTo(x, y); pen = true } else g.lineTo(x, y) }
        g.stroke()
        if (still) continue
        const run = ((time - a.delay) % 4.2) / 2.4 // 2.4 s along, then a rest
        if (run < 0 || run > 1.25) continue
        const head = Math.min(1, run), tail = Math.max(0, run - 0.28)
        g.globalAlpha = 1; g.lineWidth = 2
        const i0 = Math.floor(tail * 48), i1 = Math.ceil(head * 48)
        for (let k = i0; k < i1; k++) {
          const [x0, y0, z0] = P[k], [x1, y1, z1] = P[k + 1]
          if (hidden(x0, y0, z0) || hidden(x1, y1, z1)) continue
          g.globalAlpha = clamp((k - i0) / Math.max(1, i1 - i0), 0.1, 1)
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke()
        }
        g.globalAlpha = 1
      }

      // the places: a dot and a ring that grows and fades, like a live user
      let near: { label: string; x: number; y: number } | null = null
      for (const p of pv) {
        const [x, y, z] = project(p.v[0], p.v[1], p.v[2])
        if (z < 0.05) continue
        g.globalAlpha = clamp(z * 3, 0, 1)
        if (!still) {
          const k = ((time + p.phase) % 2.6) / 2.6
          g.strokeStyle = accent; g.lineWidth = 1.4
          g.globalAlpha *= 1 - k
          g.beginPath(); g.arc(x, y, 3 + k * 16, 0, Math.PI * 2); g.stroke()
          g.globalAlpha = clamp(z * 3, 0, 1)
        }
        g.fillStyle = accent; g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill()
        g.fillStyle = c.bg; g.beginPath(); g.arc(x, y, 1.3, 0, Math.PI * 2); g.fill()
        g.globalAlpha = 1
        if (hover && p.label && Math.hypot(hover.x - x, hover.y - y) < 14) near = { label: p.label, x, y }
      }
      // the name of the place you point at, in a little pill
      if (near) {
        g.font = `500 12px ${FONT}`
        const w = g.measureText(near.label).width + 18
        const lx = clamp(near.x - w / 2, 4, S - w - 4), ly = near.y - 34
        g.fillStyle = c.label; g.beginPath(); g.roundRect(lx, ly, w, 24, 12); g.fill()
        g.fillStyle = c.labelText; g.textBaseline = 'middle'; g.fillText(near.label, lx + 9, ly + 12.5)
      }
      canvas.style.cursor = view.drag ? 'grabbing' : near ? 'default' : 'grab'
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(48, now - last) / 1000
      last = now
      if (!view.drag) {
        // after a throw it carries on, then eases back to its own pace and lean
        const own = still ? 0 : spin
        view.vLon += (own - view.vLon) * Math.min(1, dt * 1.4)
        view.vLat *= Math.pow(0.04, dt)
        view.lon += view.vLon * dt
        view.lat = clamp(view.lat + view.vLat * dt, -60, 60)
        view.lat += (tilt - view.lat) * Math.min(1, dt * 0.6) * (Math.abs(view.vLat) < 4 ? 1 : 0)
      }
      draw(now)
      const moving = !still || view.drag || Math.abs(view.vLon) > 0.01 || Math.abs(view.lat - tilt) > 0.05
      if (visible && moving) raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake() })
    io.observe(canvas)

    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * S, y: ((e.clientY - r.top) / r.height) * S } }
    let lp = { x: 0, y: 0, t: 0 }
    const onDown = (e: PointerEvent) => {
      const q = pos(e)
      if (Math.hypot(q.x - cx, q.y - cy) > R * 1.08) return
      view.drag = true; view.vLon = 0; view.vLat = 0
      lp = { ...q, t: performance.now() }
      canvas.setPointerCapture(e.pointerId)
      wake()
    }
    const onMove = (e: PointerEvent) => {
      const q = pos(e)
      hover = q
      if (view.drag) {
        const now = performance.now(), dt = Math.max(8, now - lp.t) / 1000
        // the surface follows your finger: a px is this many degrees at the middle
        const k = 1 / (R * RAD)
        const dLon = -(q.x - lp.x) * k, dLat = (q.y - lp.y) * k
        view.lon += dLon; view.lat = clamp(view.lat + dLat, -60, 60)
        view.vLon = dLon / dt; view.vLat = dLat / dt
        lp = { ...q, t: now }
      }
      wake()
    }
    const onUp = (e: PointerEvent) => {
      if (!view.drag) return
      view.drag = false
      if (performance.now() - lp.t > 80) { view.vLon = 0; view.vLat = 0 } // held still before letting go: no throw
      view.vLon = clamp(view.vLon, -400, 400); view.vLat = clamp(view.vLat, -200, 200)
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* already released */ }
      wake()
    }
    const onLeave = () => { hover = null; wake() }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    draw(performance.now())
    wake()

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [size, theme, places, arcs, accent, density, spin, tilt, start, c])

  return (
    <canvas
      ref={cv}
      role="img"
      aria-label={`A globe turning${places.length ? `, with ${places.map((p) => p.label).filter(Boolean).join(', ')}` : ''}`}
      className={`block touch-none select-none ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
