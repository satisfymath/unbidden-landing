import { useEffect, useRef, type CSSProperties } from 'react'
import { SPLASH_ROWS, SPLASH_WORDMARK, TUI } from '../content/console'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { clamp01, smooth } from '../lib/math'
import { AsciiCanvas, type AsciiHandle } from '../console/AsciiCanvas'
import './Uplink.css'

const POSTER = './media/posters/kf-8-clean-1920.webp'
const POSTER_FALLBACK = './media/posters/kf-8-1920.webp'

/**
 * Uplink: the universe becomes data. The final plate is re-rendered as glyphs as the visitor scrolls, and the
 * terminal app's own splash (brand.py) boots on top of it: ring, wordmark, tagline, the four verbs.
 */
export function Uplink({ id }: { id: string }) {
  const reduced = useReducedMotion()
  const wrap = useRef<HTMLElement>(null)
  const ascii = useRef<AsciiHandle>(null)
  const splash = useRef<HTMLDivElement>(null)
  const verbs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let raf = 0, last = -1
    const render = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const travel = r.height - vh
      const p = travel > 0 ? clamp01(-r.top / travel) : 0
      if (reduced) {
        ascii.current?.draw(1)
        if (splash.current) splash.current.style.opacity = '1'
        verbs.current.forEach((v, i) => { if (v) v.textContent = TUI.VERBS[i] })
        return
      }
      if (Math.abs(p - last) < 0.002) return
      last = p
      ascii.current?.draw(smooth(p / 0.5))
      if (splash.current) {
        const o = smooth((p - 0.3) / 0.22)
        splash.current.style.opacity = o.toFixed(3)
        splash.current.style.transform = `translate3d(-50%, ${((1 - o) * 10).toFixed(1)}px, 0)`
      }
      verbs.current.forEach((v, i) => {
        if (!v) return
        const t = clamp01((p - (0.52 + i * 0.09)) / 0.08)
        const n = Math.round(t * TUI.VERBS[i].length)
        const txt = TUI.VERBS[i].slice(0, n)
        if (v.textContent !== txt) v.textContent = txt
        v.classList.toggle('caret', t > 0 && t < 1)
        v.classList.toggle('uplink__verb-on', t >= 1 && i === 3)
      })
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(render) }
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake, { passive: true })
    const t = window.setTimeout(wake, 300) // after the image decodes
    return () => { window.removeEventListener('scroll', wake); window.removeEventListener('resize', wake); window.clearTimeout(t); if (raf) cancelAnimationFrame(raf) }
  }, [reduced])

  const style = { '--uplink-weight': reduced ? 0 : 1.6 } as CSSProperties
  return (
    <section id={id} ref={wrap} className={`uplink ${reduced ? 'uplink--static' : ''}`} style={style} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="sr-only">The terminal starts: the mark, the wordmark, the tagline and the four verbs of the agent.</h2>
      <div className="uplink__stage">
        <AsciiCanvas ref={ascii} src={POSTER} className="uplink__canvas" />
        <noscript><img src={POSTER_FALLBACK} alt="" /></noscript>
        <div className="uplink__splash" ref={splash} style={{ opacity: reduced ? 1 : 0 }} aria-hidden="true">
          <pre className="uplink__ring">
            {`  ${SPLASH_ROWS[0]}`}<span className="uplink__dot">{TUI.DOT}</span>{'\n'}
            {`  ${SPLASH_ROWS[1]}`}<span className="uplink__word">{`    ${SPLASH_WORDMARK}   ${TUI.VERSION}`}</span>{'\n'}
            {`  ${SPLASH_ROWS[2]}`}<span className="uplink__tag">{`     ${TUI.TAGLINE}`}</span>
          </pre>
          <pre className="uplink__verbs">
            {TUI.VERBS.map((_, i) => (
              <span key={i} className="uplink__verb-row"><span className="uplink__gt">&gt; </span><span ref={(el) => { verbs.current[i] = el }} className="uplink__verb" />{'\n'}</span>
            ))}
          </pre>
        </div>
      </div>
    </section>
  )
}
