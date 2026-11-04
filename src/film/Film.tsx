import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { SPLASH_WORDMARK } from '../content/console'
import { BrailleMark } from '../console/BrailleMark'
import { BEATS, FILM, KEYFRAMES, SCROLL_HINT, TAGLINE, WORDMARK, posterOf } from '../content/film'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { coarseQuery, portraitQuery } from '../lib/device'
import { clamp01, lerp, smooth, window01 } from '../lib/math'
import { FilmEngine } from './FilmEngine'
import { GlyphClosing, type GlyphClosingHandle } from './GlyphClosing'
import { buildTimeline, globalAt } from './timeline'
import './Film.css'

const clips = FILM.filter((i) => i.kind === 'clip')
const lastClip = clips[clips.length - 1]
/** The real last frame of the film when the final clip exists, else the final master: the glyphs take its silhouette. */
const LAST_FRAME = lastClip?.kind === 'clip' && lastClip.src ? './media/posters/last-1920.webp' : './media/posters/kf-8-1920.webp'

const ACTS = [
  { id: 'discovery', label: 'Discovery', from: 'clip-1-2', to: 'clip-2-4' },
  { id: 'orbit', label: 'Orbit', from: 'clip-4-6A', to: 'clip-6E-6F' },
  { id: 'pullback', label: 'Pullback', from: 'clip-6F-7', to: 'clip-7-8' },
]

function Poster({ id, eager }: { id: string; eager?: boolean }) {
  const d = posterOf(id, 1920), m = posterOf(id, 1080)
  return (
    <picture>
      <source type="image/avif" srcSet={`${m.avif} 1080w, ${d.avif} 1920w`} sizes="100vw" />
      <source type="image/webp" srcSet={`${m.webp} 1080w, ${d.webp} 1920w`} sizes="100vw" />
      <img src={d.webp} alt="" decoding="async" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} draggable={false} />
    </picture>
  )
}

/** The official mark (geometry of public/media/brand/mark.svg). The ring draws itself while the dot orbits home. */
function DrawnMark({ svgRef }: { svgRef?: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} className="mark" viewBox="0 0 100 100" aria-hidden="true">
      <path className="mark__ring" pathLength={1} d="M 71.8 27.3 A 36 36 0 1 1 66.9 21.6" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
      <g className="mark__orbit"><circle cx="75" cy="16.7" r="4.4" fill="currentColor" /></g>
    </svg>
  )
}

export function Film({ nextId }: { nextId: string }) {
  const reduced = useReducedMotion()
  if (reduced) return <FilmStatic nextId={nextId} />
  return <FilmScrub nextId={nextId} />
}

function FilmScrub({ nextId }: { nextId: string }) {
  const wrapperRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef(new Map<string, HTMLElement>())
  const hintRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<SVGSVGElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const fillRefs = useRef<(HTMLElement | null)[]>([])
  const actLabelRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<HTMLDivElement>(null)
  const skipRing = useRef<SVGCircleElement>(null)
  const closingRef = useRef<GlyphClosingHandle>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLParagraphElement>(null)
  const iris = useRef({ x: 0, y: 0, ring: 100, far: 1000 })
  const mobile = useMediaQuery(coarseQuery)
  const portrait = useMediaQuery(portraitQuery)
  const tl = useMemo(() => buildTimeline(FILM), [])
  const beatSpans = useMemo(
    () => BEATS.map((b) => ({ id: b.id, a: globalAt(tl, b.anchor, b.span[0]), b: globalAt(tl, b.anchor, b.span[1]) })),
    [tl],
  )
  // the opening runs on into the first clip, so the planet is already moving inside the ring
  const irisEnd = useMemo(() => globalAt(tl, 'clip-1-2', 0.5), [tl])
  // the closing starts while the last clip still plays, so the fade to black is gradual
  const closeStart = useMemo(() => globalAt(tl, 'clip-7-8', 0.35), [tl])
  const acts = useMemo(() => ACTS.map((a) => ({
    ...a,
    start: tl.entries.find((e) => e.item.id === a.from)?.start ?? 0,
    end: tl.entries.find((e) => e.item.id === a.to)?.end ?? 1,
  })), [tl])

  // where the ring sits on screen, for the iris; measured with the mark at rest
  useEffect(() => {
    const measure = () => {
      const m = markRef.current
      if (!m) return
      const saved = m.style.transform
      m.style.transform = 'none'
      const b = m.getBoundingClientRect()
      m.style.transform = saved
      // the ring's own centre in the mark's viewBox, from its arc: (42.2, 47.8); the dot sits to its upper right
      const x = b.left + b.width * 0.422, y = b.top + b.height * 0.478
      iris.current = { x, y, ring: b.width * 0.36, far: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 4 }
      veilRef.current?.style.setProperty('--x', `${x}px`)
      veilRef.current?.style.setProperty('--y', `${y}px`)
    }
    measure()
    // the block's height settles when the wordmark and the fonts arrive
    const ro = new ResizeObserver(measure)
    if (stageRef.current) ro.observe(stageRef.current)
    if (heroTextRef.current) ro.observe(heroTextRef.current)
    void document.fonts?.ready.then(measure)
    window.addEventListener('load', measure)
    return () => { ro.disconnect(); window.removeEventListener('load', measure) }
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current, stage = stageRef.current
    if (!wrapper || !stage) return
    let lastAct = -1
    const engine = new FilmEngine({
      wrapper, stage, items: FILM, mobile, portrait,
      onFrame: (p) => {
        for (const s of beatSpans) {
          const el = beatRefs.current.get(s.id)
          if (!el) continue
          const edge = (s.b - s.a) * 0.3
          const op = window01(p, s.a, s.b, edge)
          el.style.opacity = op.toFixed(3)
          el.style.transform = `translate3d(0, ${((1 - op) * 14).toFixed(2)}px, 0)`
          el.style.filter = op > 0.98 ? 'none' : `blur(${((1 - op) * 7).toFixed(1)}px)`
        }

        // the opening: black, then the planet seen through the ring, then the ring opens onto the whole frame
        const u = clamp01(p / irisEnd)
        const textOp = 1 - smooth(u / 0.26)
        if (heroTextRef.current) {
          heroTextRef.current.style.opacity = textOp.toFixed(3)
          heroTextRef.current.style.transform = `translate3d(0, ${((1 - textOp) * -18).toFixed(1)}px, 0)`
          heroTextRef.current.style.filter = textOp > 0.98 ? 'none' : `blur(${((1 - textOp) * 8).toFixed(1)}px)`
          heroTextRef.current.style.visibility = textOp < 0.02 ? 'hidden' : 'visible'
        }
        if (hintRef.current) hintRef.current.style.opacity = (1 - smooth(u / 0.14)).toFixed(3)
        const { ring, far } = iris.current
        const inner = smooth((u - 0.06) / 0.36)
        const outer = clamp01((u - 0.42) / 0.58)
        const hole = u < 0.42 ? inner * ring : lerp(ring, far, outer * outer * outer)
        const scale = Math.max(1, hole / ring)
        if (markRef.current) {
          markRef.current.style.transform = scale > 1.001 ? `scale(${scale.toFixed(3)})` : 'none'
          const o = 1 - smooth((u - 0.5) / 0.32)
          markRef.current.style.opacity = o.toFixed(3)
          markRef.current.style.visibility = o < 0.02 ? 'hidden' : 'visible'
        }
        if (veilRef.current) {
          veilRef.current.style.setProperty('--r', `${Math.max(0.1, hole).toFixed(1)}px`)
          veilRef.current.style.visibility = u >= 1 ? 'hidden' : 'visible'
        }

        // the film's own instruments
        const closing = clamp01((p - closeStart) / (1 - closeStart))
        const instruments = smooth((u - 0.85) / 0.15) * (1 - smooth(closing / 0.16))
        if (hudRef.current) {
          hudRef.current.style.opacity = instruments.toFixed(3)
          hudRef.current.style.visibility = instruments < 0.02 ? 'hidden' : 'visible'
        }
        let current = 0
        acts.forEach((a, i) => {
          const k = clamp01((p - a.start) / (a.end - a.start))
          if (p >= a.start) current = i
          const fill = fillRefs.current[i]
          if (fill) fill.style.transform = `scaleX(${k.toFixed(4)})`
        })
        if (current !== lastAct) {
          lastAct = current
          if (actLabelRef.current) actLabelRef.current.textContent = `${String(current + 1).padStart(2, '0')}  ${acts[current].label}`
        }
        if (skipRing.current) skipRing.current.style.strokeDashoffset = (1 - p).toFixed(4)
        if (skipRef.current) {
          const op = 1 - smooth(closing / 0.16)
          skipRef.current.style.opacity = op.toFixed(3)
          skipRef.current.style.visibility = op < 0.02 ? 'hidden' : 'visible'
        }

        // the closing: the frame sinks into black while the glyphs fall into its silhouette, then become the logotype
        const t = closing
        if (blackRef.current) blackRef.current.style.opacity = smooth(t / 0.42).toFixed(3)
        closingRef.current?.set(t)
        if (splashRef.current) {
          const o = smooth((t - 0.8) / 0.06)
          splashRef.current.style.opacity = o.toFixed(3)
          splashRef.current.style.top = `${closingRef.current?.ringBottom() ?? 0}px`
        }
        if (wordRef.current) {
          const k = clamp01((t - 0.8) / 0.12)
          const txt = SPLASH_WORDMARK.slice(0, Math.round(k * SPLASH_WORDMARK.length))
          if (wordRef.current.textContent !== txt) wordRef.current.textContent = txt
          wordRef.current.classList.toggle('caret', k > 0 && k < 1)
        }
      },
    })
    engine.start()
    return () => engine.destroy()
  }, [mobile, portrait, beatSpans, irisEnd, closeStart, acts])

  const jump = (start: number) => {
    const w = wrapperRef.current
    if (!w) return
    window.scrollTo({ top: w.offsetTop + start * (w.offsetHeight - window.innerHeight) + 2, behavior: 'instant' })
  }

  const words = TAGLINE.split(' ')
  const style = { '--film-weight': tl.totalWeight } as CSSProperties
  return (
    <section id="film" className="film" ref={wrapperRef} style={style} aria-labelledby="film-title">
      <div className="film__stage" ref={stageRef} data-portrait={portrait || undefined}>
        {KEYFRAMES.map((k) => (
          <div key={k.id} className="film__layer film__poster" data-kf={k.id} style={{ opacity: k.id === '1' ? 1 : 0 }}>
            <Poster id={k.id} eager={k.id === '1'} />
          </div>
        ))}
        {clips.map((c) => (
          <div key={c.id} className="film__layer film__clip" data-clip={c.id} style={{ opacity: 0 }} />
        ))}
        <div className="film__scrim" aria-hidden="true" />
        <div className="film__beats" aria-hidden="true">
          {BEATS.map((b) => (
            <p
              key={b.id}
              className={`film__beat film__beat--${b.kind}`}
              ref={(el) => { if (el) beatRefs.current.set(b.id, el); else beatRefs.current.delete(b.id) }}
              style={{ opacity: 0 }}
            >
              {b.text}
            </p>
          ))}
        </div>

        <div className="film__veil" ref={veilRef} aria-hidden="true" />
        <div className="film__hero">
          <div className="film__logo">
            <DrawnMark svgRef={markRef} />
            <div className="film__hero-text" ref={heroTextRef}>
              <div className="film__word"><img src="./media/brand/wordmark-white.png" width={761} height={80} alt={WORDMARK} decoding="async" draggable={false} /></div>
              <h1 id="film-title" className="film__title">
                {words.map((w, i) => <span key={i} className="film__tw" style={{ '--i': i } as CSSProperties}>{w}{i < words.length - 1 ? ' ' : ''}</span>)}
              </h1>
            </div>
          </div>
        </div>
        <div className="film__hint" ref={hintRef} aria-hidden="true">
          <div className="film__hint-in"><span>{SCROLL_HINT}</span><i /></div>
        </div>

        <div className="film__hud" ref={hudRef} style={{ opacity: 0 }}>
          <span className="film__act mono" ref={actLabelRef} aria-hidden="true" />
          <div className="film__acts" role="group" aria-label="Chapters of the film">
            {acts.map((a, i) => (
              <button key={a.id} type="button" className="film__seg" aria-label={`Go to ${a.label}`} onClick={() => jump(a.start)}>
                <i ref={(el) => { fillRefs.current[i] = el }} />
              </button>
            ))}
          </div>
        </div>
        <div className="film__skipwrap" ref={skipRef}>
          <a className="film__skip" href={`#${nextId}`}>
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.2" />
              <circle ref={skipRing} cx="10" cy="10" r="8" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1" strokeDashoffset="1" transform="rotate(-90 10 10)" strokeLinecap="round" />
            </svg>
            <span>Skip the film</span>
            <span className="film__skip-arrow" aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="film__black" ref={blackRef} aria-hidden="true" style={{ opacity: 0 }} />
        <GlyphClosing ref={closingRef} src={LAST_FRAME} className="film__glyphs" />
        <div className="film__splash" ref={splashRef} aria-hidden="true" style={{ opacity: 0 }}>
          <p className="splash__word" ref={wordRef} />
        </div>
      </div>
      <ol className="sr-only">
        {KEYFRAMES.map((k) => (
          <li key={k.id}>{k.title}. {k.alt}</li>
        ))}
        <li>The last frame sinks into black while glyphs form its silhouette, then gather into the {WORDMARK} logotype.</li>
      </ol>
    </section>
  )
}

/** Reduced motion, or no scrubbing: the approved frames as a readable sequence, then the mark as the terminal draws it. */
export function FilmStatic({ nextId }: { nextId: string }) {
  return (
    <section id="film" className="film film--static" aria-labelledby="film-title">
      <header className="film__static-head">
        <DrawnMark />
        <div className="film__word"><img src="./media/brand/wordmark-white.png" width={761} height={80} alt={WORDMARK} decoding="async" draggable={false} /></div>
        <h1 id="film-title" className="film__title">{TAGLINE}</h1>
        <a className="btn btn--secondary btn--sm" href={`#${nextId}`}>Skip the film</a>
      </header>
      <ol className="film__static-list">
        {KEYFRAMES.map((k, i) => (
          <li key={k.id} className="film__static-item">
            <figure>
              <Poster id={k.id} eager={i === 0} />
              <figcaption>
                <span className="eyebrow">{String(i + 1).padStart(2, '0')} · {k.id} · {k.title}</span>
                <p>{k.alt}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>
      <div className="film__static-end" aria-hidden="true"><BrailleMark className="splash__mark" /><p className="splash__word">{SPLASH_WORDMARK}</p></div>
    </section>
  )
}
