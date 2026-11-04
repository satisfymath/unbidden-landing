import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface GlyphClosingHandle {
  /** Scroll position of the closing, 0..1. */
  set: (t: number) => void
  /** Where the logotype's ring ends on screen, for the word below it. */
  ringBottom: () => number
}
interface Props { src: string; className?: string }

const RAMP = ' .·:;-=+*#%@'
const NOISE = '01<>/\\[]{}#+*=~'
const hash = (a: number, b: number) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }
const ease = (x: number) => { const v = Math.min(1, Math.max(0, x)); return v * v * (3 - 2 * v) }

interface Glyph { hx: number; hy: number; l: number; ch: string; seed: number; tx?: number; ty?: number; dot?: boolean }

/**
 * The film's closing, in one continuous gesture driven by scroll: glyphs fall into the silhouette of the last frame,
 * hold there, shimmering; then most of them blow away while a few hundred swirl into the logotype, measured from the
 * official mark (a ring open at 39.5°–50.5°, a dot at 47° and 1.263 R). The logotype stands alone on black.
 */
export const GlyphClosing = forwardRef<GlyphClosingHandle, Props>(function GlyphClosing({ src, className }, ref) {
  const cv = useRef<HTMLCanvasElement>(null)
  const st = useRef({ t: 0, glyphs: [] as Glyph[], W: 0, H: 0, cx: 0, cy: 0, R: 0, cell: 9, font: '', raf: 0, last: 0, visible: true, img: null as HTMLImageElement | null })

  const build = () => {
    const c = cv.current, s = st.current
    if (!c || !s.img) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = c.clientWidth, H = c.clientHeight
    if (!W || !H) return
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
    c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
    const cols = W < 700 ? 74 : Math.min(190, Math.round(W / 8.4))
    const cellW = W / cols, cellH = cellW * 2.05
    const rows = Math.ceil(H / cellH)
    // the image, cover-fit, read one cell at a time
    const off = document.createElement('canvas')
    off.width = cols; off.height = rows
    const ox = off.getContext('2d', { willReadFrequently: true })!
    const ir = s.img.naturalWidth / s.img.naturalHeight, cr = W / H
    const dw = ir > cr ? rows * ir * (cellH / cellW) : cols, dh = ir > cr ? rows : cols / ir / (cellH / cellW)
    ox.drawImage(s.img, (cols - dw) / 2, (rows - dh) / 2, dw, dh)
    const d = ox.getImageData(0, 0, cols, rows).data
    const glyphs: Glyph[] = []
    const n = RAMP.length - 1
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const i = (r * cols + q) * 4
      const l = Math.pow((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, 0.85)
      if (l < 0.1) continue
      glyphs.push({ hx: q * cellW, hy: r * cellH, l, ch: RAMP[Math.min(n, Math.max(1, Math.round(l * n)))], seed: hash(q, r) })
    }
    // the logotype's targets
    const cx = W / 2, cy = H * 0.46, R = Math.min(H * 0.27, W * 0.33)
    const targets: { x: number; y: number; dot?: boolean }[] = []
    const step = (cellW * 0.96) / R
    for (const rad of [R, R - cellH * 0.34]) {
      for (let a = 39.5 * (Math.PI / 180); a > (50.5 - 360) * (Math.PI / 180); a -= step * (R / rad)) {
        targets.push({ x: cx + rad * Math.cos(a) - cellW / 2, y: cy - rad * Math.sin(a) - cellH / 2 })
      }
    }
    const dotA = 47 * (Math.PI / 180), dx = cx + 1.263 * R * Math.cos(dotA), dy = cy - 1.263 * R * Math.sin(dotA), dr = Math.max(0.122 * R, cellW * 1.6)
    for (let y = -dr; y <= dr; y += cellH * 0.62) for (let x = -dr; x <= dr; x += cellW * 0.95) {
      if (x * x + y * y <= dr * dr) targets.push({ x: dx + x - cellW / 2, y: dy + y - cellH / 2, dot: true })
    }
    // the brightest cells travel; sorted by angle on both sides so that the flow swirls instead of crossing
    const angle = (x: number, y: number) => Math.atan2(y - cy, x - cx)
    const travellers = [...glyphs].sort((a, b) => b.l - a.l).slice(0, targets.length).sort((a, b) => angle(a.hx, a.hy) - angle(b.hx, b.hy))
    const sorted = [...targets].sort((a, b) => angle(a.x, a.y) - angle(b.x, b.y))
    travellers.forEach((g, i) => { const t = sorted[i % sorted.length]; g.tx = t.x; g.ty = t.y; g.dot = t.dot })
    Object.assign(s, { glyphs, W, H, cx, cy, R, cell: cellW, font: `400 ${cellH * 0.8}px "Geist Mono Variable", ui-monospace, Menlo, monospace` })
    paint(performance.now())
  }

  const paint = (now: number) => {
    const c = cv.current, s = st.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const { W, H, t, cx, cy } = s
    ctx.clearRect(0, 0, W, H)
    if (t <= 0.001) return
    ctx.font = s.font
    ctx.textBaseline = 'top'
    const T = now / 1000
    const tick = Math.floor(T * 12)
    let style = ''
    for (const g of s.glyphs) {
      // 1. falling into the silhouette: a wave from the top, each glyph on its own delay
      const a = ease((t - 0.03 - (0.62 * g.seed + 0.38 * (g.hy / H)) * 0.3) / 0.16)
      if (a <= 0) continue
      let x = g.hx + (1 - a) * Math.sin(g.seed * 40) * 60
      let y = g.hy - (1 - a) * (70 + g.seed * 240)
      let alpha = a
      const wave = 0.72 + 0.28 * Math.sin(g.hx * 0.018 + g.hy * 0.03 - T * 2.2)
      let bright = g.l * wave
      let ch = a < 1 || hash(g.seed * 99, tick) < 0.02 ? NOISE[Math.floor(hash(g.seed * 31, tick) * NOISE.length)] : g.ch
      // 2. then the field lets go
      if (g.tx !== undefined && g.ty !== undefined) {
        const m = ease((t - 0.58 - g.seed * 0.1) / 0.2)
        if (m > 0) {
          const swirl = Math.sin(m * Math.PI) * (0.9 + g.seed * 0.6)
          const px = g.hx + (g.tx - g.hx) * m - cx, py = g.hy + (g.ty - g.hy) * m - cy
          x = cx + px * Math.cos(swirl) - py * Math.sin(swirl)
          y = cy + px * Math.sin(swirl) + py * Math.cos(swirl)
          bright = bright + (1 - bright) * m
          if (m > 0.2 && m < 0.98) ch = NOISE[Math.floor(hash(g.seed * 17, tick) * NOISE.length)]
          else if (m >= 0.98) ch = g.dot ? '@' : hash(g.seed * 7, Math.floor(T * 3)) < 0.92 ? '*' : '+'
        }
      } else {
        const out = ease((t - 0.54 - g.seed * 0.14) / 0.2)
        if (out >= 1) continue
        if (out > 0) {
          const ang = Math.atan2(g.hy - cy, g.hx - cx) + g.seed * 1.4
          x += Math.cos(ang) * out * (90 + g.seed * 200)
          y += Math.sin(ang) * out * (90 + g.seed * 200) + out * out * 70
          alpha *= 1 - out
          if (hash(g.seed * 3, tick) < out) ch = NOISE[Math.floor(hash(g.seed * 13, tick) * NOISE.length)]
        }
      }
      const shade = Math.round(96 + Math.min(1, bright) * 159)
      const al = Math.round(alpha * 10) / 10
      const next = g.dot && t > 0.72 ? `rgba(245,183,0,${al})` : `rgba(${shade},${shade},${shade + 2},${al})`
      if (next !== style) { ctx.fillStyle = next; style = next }
      ctx.fillText(ch, x, y)
    }
  }

  useImperativeHandle(ref, () => ({
    set: (t) => {
      const s = st.current, was = s.t
      s.t = t
      // the loop rests at 0, so the last frame has to be wiped here or it stays over the opening
      if (t <= 0.001 && was > 0.001) paint(performance.now())
    },
    ringBottom: () => st.current.cy + st.current.R,
  }))

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const s = st.current
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    const onLoad = () => { s.img = img; void document.fonts?.ready.then(build); build() }
    img.addEventListener('load', onLoad)
    const ro = new ResizeObserver(build)
    ro.observe(c)
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting })
    io.observe(c)
    const loop = (now: number) => {
      s.raf = requestAnimationFrame(loop)
      if (!s.visible || s.t <= 0.001 || now - s.last < 30) return
      s.last = now
      paint(now)
    }
    s.raf = requestAnimationFrame(loop)
    return () => { img.removeEventListener('load', onLoad); ro.disconnect(); io.disconnect(); cancelAnimationFrame(s.raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return <canvas ref={cv} className={className} aria-hidden="true" />
})
