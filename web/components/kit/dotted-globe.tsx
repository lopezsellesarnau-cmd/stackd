'use client'

import { useEffect, useRef } from 'react'

/**
 * Dotted globe · StackD Kit
 * Where your users are, on a world made of dots. Where more people are, the land rises: the dots stack up off the
 * surface into soft hills, from grey at the foot to black at the top, like a 3D heat map you can turn. The busiest ones pulse now and
 * then, like someone just arrived. Drag to spin it, pinch to zoom, point at a city to see how many are there, click it
 * and the globe turns to it. Arcs between places are there too, if you want them.
 *
 * The land is built in (Natural Earth, public domain, at 1°), so there's nothing to load.
 * One canvas, drawn only on screen. React + Tailwind, no other dependencies. Respects reduced motion.
 */

export type GlobePlace = { lat: number; lon: number; label?: string; /** How many users are there: sets the darkness around it and its pillar. */ users?: number }
export type GlobeArc = { from: [number, number]; to: [number, number] }

type Props = {
  /** Width and height, px. */
  size?: number
  theme?: 'light' | 'dark'
  /** Where your users are. */
  places?: GlobePlace[]
  /** Arcs between two [lat, lon] points, with a light running along them. None by default. */
  arcs?: GlobeArc[]
  /** Colour of the city marks, pulses and arcs. */
  accent?: string
  /** Degrees between dots. Smaller is denser. */
  density?: number
  /** How fast it turns on its own, degrees a second. 0 to keep it still. */
  spin?: number
  /** How far it leans towards you, degrees (positive shows more of the north). */
  tilt?: number
  /** The longitude facing you at the start. */
  start?: number
  /** How big the globe is: 1 fits the box, above 1 it fills it and runs off the edges. */
  zoom?: number
  /** Pinch (or ctrl + scroll) to zoom between 0.8 and 3. */
  zoomable?: boolean
  /** The land rises where your users are (the 3D hills). Off: flat, darker dots instead. */
  hills?: boolean
  className?: string
}

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

// Users around the world, for the demo: big cities carry more
export const GLOBE_PLACES: GlobePlace[] = [
  { lat: 40.71, lon: -74.0, label: 'New York', users: 2310 },
  { lat: 37.77, lon: -122.42, label: 'San Francisco', users: 1876 },
  { lat: 34.05, lon: -118.24, label: 'Los Angeles', users: 1210 },
  { lat: 41.88, lon: -87.63, label: 'Chicago', users: 640 },
  { lat: 43.65, lon: -79.38, label: 'Toronto', users: 720 },
  { lat: 30.27, lon: -97.74, label: 'Austin', users: 520 },
  { lat: 47.61, lon: -122.33, label: 'Seattle', users: 690 },
  { lat: 19.43, lon: -99.13, label: 'Mexico City', users: 480 },
  { lat: -23.55, lon: -46.63, label: 'São Paulo', users: 942 },
  { lat: -34.6, lon: -58.38, label: 'Buenos Aires', users: 410 },
  { lat: 4.71, lon: -74.07, label: 'Bogotá', users: 260 },
  { lat: 51.51, lon: -0.13, label: 'London', users: 1980 },
  { lat: 52.37, lon: 4.9, label: 'Amsterdam', users: 1204 },
  { lat: 52.52, lon: 13.4, label: 'Berlin', users: 1120 },
  { lat: 48.86, lon: 2.35, label: 'Paris', users: 1050 },
  { lat: 40.42, lon: -3.7, label: 'Madrid', users: 760 },
  { lat: 41.39, lon: 2.17, label: 'Barcelona', users: 690 },
  { lat: 38.72, lon: -9.14, label: 'Lisbon', users: 540 },
  { lat: 45.46, lon: 9.19, label: 'Milan', users: 470 },
  { lat: 59.33, lon: 18.07, label: 'Stockholm', users: 430 },
  { lat: 52.23, lon: 21.01, label: 'Warsaw', users: 380 },
  { lat: 41.01, lon: 28.98, label: 'Istanbul', users: 520 },
  { lat: 25.2, lon: 55.27, label: 'Dubai', users: 610 },
  { lat: 30.04, lon: 31.24, label: 'Cairo', users: 300 },
  { lat: 6.52, lon: 3.38, label: 'Lagos', users: 518 },
  { lat: -1.29, lon: 36.82, label: 'Nairobi', users: 340 },
  { lat: -33.92, lon: 18.42, label: 'Cape Town', users: 290 },
  { lat: 19.08, lon: 72.88, label: 'Mumbai', users: 1397 },
  { lat: 12.97, lon: 77.59, label: 'Bangalore', users: 1150 },
  { lat: 28.61, lon: 77.21, label: 'Delhi', users: 980 },
  { lat: 1.35, lon: 103.82, label: 'Singapore', users: 806 },
  { lat: 13.76, lon: 100.5, label: 'Bangkok', users: 420 },
  { lat: -6.21, lon: 106.85, label: 'Jakarta', users: 560 },
  { lat: 22.32, lon: 114.17, label: 'Hong Kong', users: 690 },
  { lat: 31.23, lon: 121.47, label: 'Shanghai', users: 880 },
  { lat: 37.57, lon: 126.98, label: 'Seoul', users: 940 },
  { lat: 35.68, lon: 139.69, label: 'Tokyo', users: 1655 },
  { lat: -33.87, lon: 151.21, label: 'Sydney', users: 611 },
  { lat: -37.81, lon: 144.96, label: 'Melbourne', users: 450 },
  { lat: -36.85, lon: 174.76, label: 'Auckland', users: 210 },
]

// Arcs between some of them, if you want the flights
export const GLOBE_ARCS: GlobeArc[] = [
  { from: [52.37, 4.9], to: [40.71, -74.0] },
  { from: [51.51, -0.13], to: [19.08, 72.88] },
  { from: [37.77, -122.42], to: [35.68, 139.69] },
  { from: [1.35, 103.82], to: [-33.87, 151.21] },
]

export function DottedGlobe({ size = 440, theme = 'light', places = GLOBE_PLACES, arcs = [], accent = '#BE9344', density = 2, spin = 6, tilt = 18, start = 10, zoom = 1, zoomable = true, hills = true, className = '' }: Props) {
  const c = THEMES[theme]
  const cv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr)
    const g = canvas.getContext('2d')!
    const S = size, cx = S / 2, cy = S / 2
    const view = { lon: start, lat: tilt, vLon: 0, vLat: 0, drag: false, zoom, zoomTo: zoom, focus: null as null | { lon: number; lat: number; until: number } }
    const radius = () => S * 0.42 * view.zoom

    // ── the dots: rows of latitude, as many per row as fit, so they're even all over the sphere ──
    const pv = places.map((p) => ({ ...p, v: vec(p.lat, p.lon), users: p.users ?? 1, next: Math.random() * 6 }))
    const most = Math.max(1, ...pv.map((p) => p.users))
    const dots: number[] = [], heat: number[] = []
    const sig = 7 * RAD // how far a city's crowd spreads over the land
    for (let lat = -90 + density / 2; lat < 90; lat += density) {
      const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / density))
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i + 0.5) * (360 / n)
        if (!isLand(lat, lon)) continue
        const v = vec(lat, lon)
        // how many users are near this dot: each city's crowd, fading with distance
        let h = 0
        for (const p of pv) {
          const d = Math.acos(clamp(v[0] * p.v[0] + v[1] * p.v[1] + v[2] * p.v[2], -1, 1))
          if (d < sig * 3) h += (p.users / most) * Math.exp(-((d / sig) ** 2))
        }
        dots.push(...v); heat.push(h)
      }
    }
    const hot = Math.max(0.001, ...heat)
    for (let i = 0; i < heat.length; i++) heat[i] = Math.pow(Math.min(1, heat[i] / hot), 0.6)
    const LIFT = 0.1 // how high the busiest land rises, in globe radii
    // each city sits on top of its own hill
    const cityLift = pv.map((p) => {
      let h = 0
      for (const q of pv) {
        const d = Math.acos(clamp(p.v[0] * q.v[0] + p.v[1] * q.v[1] + p.v[2] * q.v[2], -1, 1))
        if (d < sig * 3) h += (q.users / most) * Math.exp(-((d / sig) ** 2))
      }
      return hills ? Math.pow(Math.min(1, h / hot), 0.6) * LIFT : 0
    })

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

    const project = (x: number, y: number, z: number) => {
      const R = radius()
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
      const R = radius()
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, S, S)
      // the sphere: a soft body, lit from the top left, and a thin rim
      const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R)
      body.addColorStop(0, c.sphere[0]); body.addColorStop(1, c.sphere[1])
      g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill()
      g.strokeStyle = c.rim; g.lineWidth = 1; g.stroke()

      const hidden = (x: number, y: number, z: number) => z < 0 && Math.hypot(x - cx, y - cy) < R
      // the dots: light grey where nobody is; where your users are, a little stack rising off the surface,
      // grey at the foot and black at the top, so the crowds make soft hills
      const B = 9, paths = Array.from({ length: B }, () => new Path2D())
      const base = R * 0.0072 + 0.3
      const add = (lvl: number, x: number, y: number, r: number) => { paths[lvl].moveTo(x + r, y); paths[lvl].arc(x, y, r, 0, Math.PI * 2) }
      for (let i = 0, j = 0; i < dots.length; i += 3, j++) {
        const vx = dots[i], vy = dots[i + 1], vz = dots[i + 2]
        const [x, y, z] = project(vx, vy, vz)
        if (z < -0.5) continue
        if (x < -40 || y < -40 || x > S + 40 || y > S + 40) continue
        const h = heat[j]
        const edge = clamp(z * 2.2, 0.25, 1) // towards the rim they crowd together, so they fade there
        if (!hills || h < 0.18) {
          const lvl = z < 0 ? 0 : hills ? 1 : Math.min(B - 1, 1 + Math.floor(h * edge * (B - 1.01)))
          add(lvl, x, y, z < 0 ? base * 0.7 : base * (0.75 + 0.25 * z) * (hills ? 1 : 1 + h * 0.6))
          continue
        }
        // the stack: one dot every step up, as many as its height needs
        // dots a little more than a dot apart, so they read as dots, not a line; at most five
        const top = h * LIFT, n = clamp(1 + Math.floor((top * R) / (base * 2.6)), 1, 5)
        for (let k = 0; k < n; k++) {
          const u = n === 1 ? 0 : k / (n - 1), lift = 1 + top * u
          const [px, py, pz] = project(vx * lift, vy * lift, vz * lift)
          if (hidden(px, py, pz)) continue
          // grey at the foot, black at the very top of the busiest hills
          const tone = (0.25 + 0.75 * u) * h * edge
          const lvl = Math.min(B - 1, 1 + Math.floor(tone * (B - 1.01)))
          add(lvl, px, py, base * (0.8 + 0.2 * Math.max(0, pz)) * (1 + u * h * 0.35))
        }
      }
      paths.forEach((p, i) => {
        const a = i === 0 ? 0.05 : 0.15 + ((i - 1) / (B - 2)) * 0.82
        g.fillStyle = `rgba(${c.dot},${a})`; g.fill(p)
      })

      // arcs, if any: a faint path and a light running along it
      g.lineCap = 'round'
      for (const a of av) {
        const P = a.pts.map((p) => project(p[0], p[1], p[2]))
        g.strokeStyle = accent; g.globalAlpha = 0.28; g.lineWidth = 1.1
        g.beginPath()
        let pen = false
        for (const [x, y, z] of P) { if (hidden(x, y, z)) { pen = false; continue } if (!pen) { g.moveTo(x, y); pen = true } else g.lineTo(x, y) }
        g.stroke()
        if (still) continue
        const run = ((time - a.delay) % 4.2) / 2.4
        if (run < 0 || run > 1) continue
        const head = run, tail = Math.max(0, run - 0.28)
        g.globalAlpha = 1; g.lineWidth = 2
        for (let k = Math.floor(tail * 48); k < Math.ceil(head * 48); k++) {
          const [x0, y0, z0] = P[k], [x1, y1, z1] = P[k + 1]
          if (hidden(x0, y0, z0) || hidden(x1, y1, z1)) continue
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke()
        }
        g.globalAlpha = 1
      }

      // the cities: a small mark on top of their hill, and now and then a pulse
      let near: { label: string; users: number; x: number; y: number } | null = null
      const order = pv.map((p, i) => ({ p, s: project(p.v[0] * (1 + cityLift[i]), p.v[1] * (1 + cityLift[i]), p.v[2] * (1 + cityLift[i])), base: project(p.v[0], p.v[1], p.v[2]) })).filter((o) => o.base[2] > 0.02).sort((a, b) => a.s[2] - b.s[2])
      for (const { p, s, base: b0 } of order) {
        const [tx, ty] = s, z = b0[2]
        const fade = clamp(z * 4, 0, 1)
        const k = p.users / most
        g.globalAlpha = fade
        g.fillStyle = accent; g.beginPath(); g.arc(tx, ty, 1.8 + k * 1.4, 0, Math.PI * 2); g.fill()
        // a pulse, as if someone just arrived: busier cities more often
        if (!still) {
          const period = 7 - k * 4.5, t = ((time + p.next) % period) / period
          if (t < 0.4) {
            const q = t / 0.4
            g.globalAlpha = fade * (1 - q); g.strokeStyle = accent; g.lineWidth = 1.2
            g.beginPath(); g.arc(tx, ty, 3 + q * 14, 0, Math.PI * 2); g.stroke()
          }
        }
        g.globalAlpha = 1
        if (hover && p.label && Math.hypot(hover.x - tx, hover.y - ty) < 12) near = { label: p.label, users: p.users, x: tx, y: ty }
      }

      // the city you point at: its name and how many are there
      if (near) {
        const detail = `${near.users.toLocaleString('en')} users`
        g.font = `600 12px ${FONT}`
        const w1 = g.measureText(near.label).width
        g.font = `400 12px ${FONT}`
        const w2 = g.measureText(detail).width
        const w = w1 + w2 + 28
        const lx = clamp(near.x - w / 2, 4, S - w - 4), ly = clamp(near.y - 38, 4, S - 30)
        g.fillStyle = c.label; g.beginPath(); g.roundRect(lx, ly, w, 26, 13); g.fill()
        g.textBaseline = 'middle'; g.fillStyle = c.labelText
        g.font = `600 12px ${FONT}`; g.fillText(near.label, lx + 10, ly + 13.5)
        g.globalAlpha = 0.6; g.font = `400 12px ${FONT}`; g.fillText(detail, lx + 18 + w1, ly + 13.5); g.globalAlpha = 1
      }
      canvas.style.cursor = view.drag ? 'grabbing' : near ? 'pointer' : 'grab'
      // bigger than its box: the edges fade into the page instead of cutting like a window
      const fadeEdge = clamp((view.zoom - 1) / 0.25, 0, 1)
      const mask = fadeEdge > 0 ? `radial-gradient(ellipse 50% 50% at 50% 50%, #000 ${Math.round(100 - fadeEdge * 30)}%, transparent 100%)` : ''
      if (canvas.style.maskImage !== mask) { canvas.style.maskImage = mask; canvas.style.webkitMaskImage = mask }
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(48, now - last) / 1000
      last = now
      view.zoom += (view.zoomTo - view.zoom) * Math.min(1, dt * 8)
      if (view.focus && !view.drag) {
        // turning to a city you clicked: the shortest way round, then a pause there
        const f = view.focus
        const dLon = ((((f.lon - view.lon) % 360) + 540) % 360) - 180
        view.lon += dLon * Math.min(1, dt * 3.2); view.lat += (f.lat - view.lat) * Math.min(1, dt * 3.2)
        view.vLon = 0; view.vLat = 0
        if (now > f.until) view.focus = null
      } else if (!view.drag) {
        // after a throw it carries on, then eases back to its own pace and lean
        const own = still ? 0 : spin
        view.vLon += (own - view.vLon) * Math.min(1, dt * 1.4)
        view.vLat *= Math.pow(0.04, dt)
        view.lon += view.vLon * dt
        view.lat = clamp(view.lat + view.vLat * dt, -60, 60)
        if (Math.abs(view.vLat) < 4) view.lat += (tilt - view.lat) * Math.min(1, dt * 0.6)
      }
      draw(now)
      const moving = !still || view.drag || !!view.focus || Math.abs(view.vLon) > 0.01 || Math.abs(view.lat - tilt) > 0.05 || Math.abs(view.zoomTo - view.zoom) > 0.001
      if (visible && moving) raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake() })
    io.observe(canvas)

    const pos = (e: { clientX: number; clientY: number }) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * S, y: ((e.clientY - r.top) / r.height) * S } }
    const touches = new Map<number, { x: number; y: number }>()
    let pinch = 0
    let lp = { x: 0, y: 0, t: 0 }, down = { x: 0, y: 0 }
    const onDown = (e: PointerEvent) => {
      const q = pos(e)
      touches.set(e.pointerId, q)
      canvas.setPointerCapture(e.pointerId)
      if (touches.size === 2) { const [a, b] = Array.from(touches.values()); pinch = Math.hypot(a.x - b.x, a.y - b.y); view.drag = false; return }
      if (Math.hypot(q.x - cx, q.y - cy) > radius() * 1.08 && view.zoom <= 1.05) return
      view.drag = true; view.vLon = 0; view.vLat = 0; view.focus = null
      lp = { ...q, t: performance.now() }; down = q
      wake()
    }
    const onMove = (e: PointerEvent) => {
      const q = pos(e)
      hover = q
      if (touches.has(e.pointerId)) touches.set(e.pointerId, q)
      if (touches.size === 2 && zoomable) {
        // two fingers: zoom
        const [a, b] = Array.from(touches.values()), d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch) view.zoomTo = clamp(view.zoomTo * (d / pinch), 0.8, 3)
        pinch = d
      } else if (view.drag) {
        const now = performance.now(), dt = Math.max(8, now - lp.t) / 1000
        // the surface follows your finger
        const k = 1 / (radius() * RAD)
        const dLon = -(q.x - lp.x) * k, dLat = (q.y - lp.y) * k
        view.lon += dLon; view.lat = clamp(view.lat + dLat, -60, 60)
        view.vLon = dLon / dt; view.vLat = dLat / dt
        lp = { ...q, t: now }
      }
      wake()
    }
    const onUp = (e: PointerEvent) => {
      touches.delete(e.pointerId)
      if (touches.size < 2) pinch = 0
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* already released */ }
      if (!view.drag) return
      view.drag = false
      // a click, not a drag: on a city, the globe turns to it
      const q = pos(e)
      if (Math.hypot(q.x - down.x, q.y - down.y) < 5) {
        for (const p of pv) {
          const [x, y, z] = project(p.v[0], p.v[1], p.v[2])
          if (z > 0.05 && Math.hypot(q.x - x, q.y - y) < 16) { view.focus = { lon: p.lon, lat: clamp(p.lat * 0.7, -40, 50), until: performance.now() + 3500 }; break }
        }
      }
      if (performance.now() - lp.t > 80) { view.vLon = 0; view.vLat = 0 }
      view.vLon = clamp(view.vLon, -400, 400); view.vLat = clamp(view.vLat, -200, 200)
      wake()
    }
    // a trackpad pinch arrives as ctrl + scroll; plain scrolling is left to the page
    const onWheel = (e: WheelEvent) => {
      if (!zoomable || !e.ctrlKey) return
      e.preventDefault()
      view.zoomTo = clamp(view.zoomTo * Math.exp(-e.deltaY * 0.01), 0.8, 3)
      wake()
    }
    const onLeave = () => { hover = null; wake() }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    draw(performance.now())
    wake()

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [size, theme, places, arcs, accent, density, spin, tilt, start, zoom, zoomable, hills, c])

  return (
    <canvas
      ref={cv}
      role="img"
      aria-label={`A globe of your users${places.length ? `, busiest in ${[...places].sort((a, b) => (b.users ?? 0) - (a.users ?? 0)).slice(0, 3).map((p) => p.label).filter(Boolean).join(', ')}` : ''}`}
      className={`block touch-none select-none ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
