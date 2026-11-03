import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'

export interface AsciiHandle { draw: (density: number) => void }
interface Props { src: string; cols?: number; className?: string; ramp?: string }

/**
 * Renders an image as a grid of monospace glyphs on a canvas. `density` 0 shows the image, 1 shows only glyphs;
 * in between the photo dims and the characters rise. Luminance is sampled once per image; each draw is fillText per
 * cell (≤ ~11k cells), which stays within a few ms on current hardware. Decorative: aria-hidden by the caller.
 */
export const AsciiCanvas = forwardRef<AsciiHandle, Props>(function AsciiCanvas({ src, cols = 160, className, ramp = ' .·:;-=+*#%@' }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef<{ img: HTMLImageElement | null; lum: Float32Array | null; cols: number; rows: number; last: number }>({ img: null, lum: null, cols, rows: 0, last: -1 })

  const sample = (img: HTMLImageElement, c: number, r: number) => {
    const off = document.createElement('canvas')
    off.width = c; off.height = r
    const ctx = off.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, c, r)
    const d = ctx.getImageData(0, 0, c, r).data
    const lum = new Float32Array(c * r)
    for (let i = 0; i < c * r; i++) {
      const l = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
      lum[i] = Math.pow(l, 1.35) // bias to black so the sky stays empty
    }
    return lum
  }

  const draw = (density: number) => {
    const cv = canvasRef.current, s = state.current
    if (!cv || !s.img || !s.lum) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = cv.clientWidth, H = cv.clientHeight
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr) }
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    // cover-fit the image
    const ir = s.img.naturalWidth / s.img.naturalHeight, cr = W / H
    const dw = ir > cr ? H * ir : W, dh = ir > cr ? H : W / ir
    const dx = (W - dw) / 2, dy = (H - dh) / 2
    const d = Math.max(0, Math.min(1, density))
    // the photo fades to black (fully gone by d = 0.75) while the glyph field develops on top of it
    const photo = Math.max(0, 1 - d / 0.75)
    if (photo > 0) { ctx.globalAlpha = photo * photo; ctx.drawImage(s.img, dx, dy, dw, dh) }
    if (d <= 0.01) return
    const cellW = dw / s.cols, cellH = dh / s.rows
    ctx.globalAlpha = Math.min(1, d * 1.6)
    ctx.font = `${Math.max(6, cellH * 0.92)}px "Geist Mono Variable", ui-monospace, Menlo, monospace`
    ctx.textBaseline = 'top'
    const n = ramp.length - 1
    // only cells with some light get a glyph; threshold rises slightly with density so the field "develops"
    const thr = 0.035
    let lastStyle = ''
    for (let r = 0; r < s.rows; r++) {
      const y = dy + r * cellH
      if (y + cellH < 0 || y > H) continue
      for (let c = 0; c < s.cols; c++) {
        const l = s.lum[r * s.cols + c]
        if (l < thr) continue
        const ch = ramp[Math.min(n, Math.round(l * n))]
        const g = Math.round(90 + l * 150)
        const style = l > 0.72 ? '#ececec' : `rgb(${g},${g + 4},${g + 10})`
        if (style !== lastStyle) { ctx.fillStyle = style; lastStyle = style }
        ctx.fillText(ch, dx + c * cellW, y)
      }
    }
    ctx.globalAlpha = 1
  }

  useImperativeHandle(ref, () => ({ draw }))

  useEffect(() => {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    const s = state.current
    const onLoad = () => {
      const cv = canvasRef.current
      const c = cv && cv.clientWidth < 700 ? Math.round(cols * 0.6) : cols
      const r = Math.round(c / (img.naturalWidth / img.naturalHeight) / 2.1) // glyph cells are ~2.1× taller than wide
      s.img = img; s.cols = c; s.rows = r; s.lum = sample(img, c, r)
      draw(0)
    }
    img.addEventListener('load', onLoad)
    return () => img.removeEventListener('load', onLoad)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, cols])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
})
