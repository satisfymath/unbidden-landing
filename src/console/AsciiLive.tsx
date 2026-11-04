import { useEffect, useMemo, useRef } from 'react'
import { prefersReducedMotion } from '../lib/device'

const RAMP = ' .·:;-=+*#%@'
const NOISE = '01<>/\\[]{}#+*=~'
/** Returned by a sampler for a cell painted in the accent. */
const ACCENT = 2

type Sampler = (c: number, r: number, t: number, light: { x: number; y: number }) => number
interface Prepared { cols: number; rows: number; sample: Sampler }

const hash = (a: number, b: number) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }

/**
 * A live field of monospace glyphs on a canvas. Glyphs develop in when it enters the viewport, a band of noise sweeps
 * through them, and they scramble under the pointer, without changing in brightness. Runs at 30 fps only while on
 * screen; reduced motion gets one still frame. Decorative: hidden from assistive technology.
 */
function AsciiField({ prepare, className, cell = 7 }: { prepare: (cols: number, rows: number) => Prepared | Promise<Prepared>; className?: string; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const reduced = prefersReducedMotion()
    const ctx = cv.getContext('2d')!
    const cellW = cell, cellH = cell * 1.9
    let field: Prepared | null = null
    let raf = 0, last = 0, t0 = 0, visible = false, dead = false, W = 0, H = 0
    const ptr = { x: -9999, y: -9999, on: 0, target: 0 }
    const light = { x: -0.5, y: -0.55 }

    const size = async () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      field = await prepare(Math.floor(W / cellW), Math.floor(H / cellH))
      if (!dead && reduced) paint(1000)
    }
    const paint = (t: number) => {
      if (!field) return
      ctx.clearRect(0, 0, W, H)
      ctx.font = `400 ${cellH * 0.84}px "Geist Mono Variable", ui-monospace, Menlo, monospace`
      ctx.textBaseline = 'top'
      ptr.on += (ptr.target - ptr.on) * 0.12
      const dev = reduced ? 1 : Math.min(1, t / 1.6)
      const tick = Math.floor(t * 14)
      const span = field.cols + field.rows * 1.6 + 12
      const sweep = ((t * 14) % (span * 1.6))
      let style = ''
      const n = RAMP.length - 1
      for (let r = 0; r < field.rows; r++) {
        for (let c = 0; c < field.cols; c++) {
          const l = field.sample(c, r, t, light)
          const accent = l >= ACCENT
          if (l < 0.03) continue
          if (hash(c, r) > dev) continue
          const x = c * cellW, y = r * cellH
          const d = Math.hypot(x - ptr.x, y - ptr.y)
          const lens = ptr.on * Math.max(0, 1 - d / 80)
          const band = sweep - (c + r * 1.6)
          const swept = band > 0 && band < 7 ? 1 - band / 7 : 0
          let ch = accent ? '@' : RAMP[Math.min(n, Math.max(1, Math.round(l * n)))]
          if ((lens > 0.2 && hash(c + tick, r) < lens) || (swept > 0 && hash(c + tick, r + 3) < swept)) ch = NOISE[Math.floor(hash(r, c + tick) * NOISE.length)]
          const g = Math.round(58 + l * 197)
          const next = accent ? '#F5B700' : `rgb(${g},${g},${g + 2})`
          if (next !== style) { ctx.fillStyle = next; style = next }
          ctx.fillText(ch, x, y)
        }
      }
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || now - last < 33) return
      last = now
      if (!t0) t0 = now
      paint((now - t0) / 1000)
    }
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect()
      ptr.x = e.clientX - b.left; ptr.y = e.clientY - b.top
      ptr.target = ptr.x > -60 && ptr.y > -60 && ptr.x < b.width + 60 && ptr.y < b.height + 60 ? 1 : 0
      light.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
      light.y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1))
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '80px' })
    const ro = new ResizeObserver(() => { void size() })
    io.observe(cv); ro.observe(cv)
    if (!reduced) { raf = requestAnimationFrame(loop); window.addEventListener('pointermove', onMove, { passive: true }) }
    return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener('pointermove', onMove) }
  }, [prepare, cell])
  return <canvas ref={ref} className={className} aria-hidden="true" />
}

/** Text set large, in glyphs, breathing slowly. */
const prepareText = (text: string) => async (cols: number, rows: number): Promise<Prepared> => {
  await document.fonts?.load('600 200px "Geist Variable"')
  const sx = 4, sy = 7.6
  const off = document.createElement('canvas')
  off.width = Math.max(1, cols * sx); off.height = Math.max(1, rows * sy)
  const c2 = off.getContext('2d', { willReadFrequently: true })!
  let size = off.height * 1.12
  c2.font = `600 ${size}px "Geist Variable", system-ui, sans-serif`
  const w = c2.measureText(text).width
  if (w > off.width * 0.98) { size *= (off.width * 0.98) / w; c2.font = `600 ${size}px "Geist Variable", system-ui, sans-serif` }
  c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillStyle = '#fff'
  c2.fillText(text, off.width / 2, off.height * 0.54)
  const d = c2.getImageData(0, 0, off.width, off.height).data
  const lum = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let s = 0, k = 0
    for (let y = r * sy; y < (r + 1) * sy; y += 2) for (let x = c * sx; x < (c + 1) * sx; x += 2) { s += d[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3]; k++ }
    lum[r * cols + c] = s / k / 255
  }
  return {
    cols, rows,
    sample: (c, r, t) => {
      const l = lum[r * cols + c]
      if (l < 0.2) return 0
      return l * (0.42 + 0.34 * (0.5 + 0.5 * Math.sin(c * 0.14 - r * 0.22 + t * 0.9)) + 0.24 * (1 - r / rows))
    },
  }
}
export function AsciiText({ text, className, cell }: { text: string; className?: string; cell?: number }) {
  const prepare = useMemo(() => prepareText(text), [text])
  return <AsciiField prepare={prepare} className={className} cell={cell} />
}

const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** A turning planet and its small moon, the logotype's ring and dot in another life. The light follows the pointer. */
const preparePlanet = (cols: number, rows: number): Prepared => {
  const aspect = 1.9
  const cx = cols / 2, cy = rows / 2
  const R = Math.min(cols * 0.36, (rows / 2) * aspect * 0.76)
  const tilt = 0.34, ct = Math.cos(tilt), st = Math.sin(tilt)
  const mR = Math.max(2, R * 0.13), orbit = R * 1.32
  return {
    cols, rows,
    sample: (c, r, t, light) => {
      const px = c - cx, py = (r - cy) * aspect
      const a = t * 0.32
      const mx = Math.cos(a) * orbit, my = Math.sin(a) * orbit * 0.26 - Math.cos(a) * orbit * 0.1, mz = Math.sin(a)
      const inMoon = (px - mx) ** 2 + (py - my) ** 2 < mR * mR
      const d2 = (px * px + py * py) / (R * R)
      if (inMoon && (mz > 0 || d2 >= 1)) return ACCENT
      if (d2 >= 1) {
        const halo = 1 - (Math.sqrt(d2) - 1) / 0.05
        return halo > 0 ? halo * 0.1 : 0
      }
      const x = px / R, y0 = py / R, z0 = Math.sqrt(1 - d2)
      const y = y0 * ct - z0 * st, z = y0 * st + z0 * ct
      const lon = Math.atan2(x, z) + t * 0.24, lat = Math.asin(y)
      const nx = Math.cos(lon) * 2.2, ny = Math.sin(lon) * 2.2
      const land = vnoise(nx + 7, ny + lat * 2.6 + 3) * 0.6 + vnoise(nx * 2.3, ny * 2.3 + lat * 5) * 0.28 + vnoise(nx * 5 + 2, ny * 5 + lat * 9) * 0.12
      const len = Math.hypot(light.x, light.y, 0.75)
      const lambert = 0.08 + 0.92 * Math.max(0, (x * light.x + y0 * light.y + z0 * 0.75) / len)
      const surface = land > 0.5 ? 0.72 + (land - 0.5) * 1.5 : 0.2 + land * 0.32
      const limb = Math.pow(1 - z0, 3) * 0.55
      return Math.min(1, lambert * surface + limb * (0.25 + lambert))
    },
  }
}
export function AsciiPlanet({ className, cell }: { className?: string; cell?: number }) {
  return <AsciiField prepare={preparePlanet} className={className} cell={cell} />
}
