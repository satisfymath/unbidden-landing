import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { BEATS, FILM, KEYFRAMES, SCROLL_HINT, TAGLINE, WORDMARK } from '../content/film'
import { SPLASH_WORDMARK, TUI } from '../content/console'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { coarseQuery, portraitQuery } from '../lib/device'
import { clamp01, smooth, window01 } from '../lib/math'
import { AsciiCanvas, type AsciiHandle } from '../console/AsciiCanvas'
import { BrailleMark } from '../console/BrailleMark'
import { FilmEngine } from './FilmEngine'
import { buildTimeline, globalAt } from './timeline'
import './Film.css'

const clips = FILM.filter((i) => i.kind === 'clip')
const lastClip = clips[clips.length - 1]
/** The HTML brand closing is only shown when clip 07 ends on the clean plate; otherwise frame 8 carries the baked mark. */
const HTML_BRAND = lastClip?.kind === 'clip' && Boolean(lastClip.src)
/** The real last frame of the film, as a poster: the ASCII field grows out of this same image. */
const LAST_FRAME = './media/posters/last-07-1920.webp'

function Poster({ n, eager }: { n: number; eager?: boolean }) {
  const k = KEYFRAMES[n - 1]
  const d = k.poster(1920), m = k.poster(1080)
  return (
    <picture>
      <source type="image/avif" srcSet={`${m.avif} 1080w, ${d.avif} 1920w`} sizes="100vw" />
      <source type="image/webp" srcSet={`${m.webp} 1080w, ${d.webp} 1920w`} sizes="100vw" />
      <img src={d.webp} alt="" decoding="async" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} draggable={false} />
    </picture>
  )
}

/** The terminal's own splash: the mark in braille, the letterspaced wordmark, the tagline, the four verbs. */
function Splash({ verbsRef }: { verbsRef?: React.MutableRefObject<(HTMLSpanElement | null)[]> }) {
  return (
    <div className="splash">
      <div className="splash__head">
        <BrailleMark className="splash__mark" />
        <div className="splash__text">
          <p className="splash__word">{SPLASH_WORDMARK}<span className="splash__version">{TUI.VERSION}</span></p>
          <p className="splash__tag">{TUI.TAGLINE}</p>
        </div>
      </div>
      <pre className="splash__verbs">
        {TUI.VERBS.map((v, i) => (
          <span key={i} className="splash__row"><span className="splash__gt">&gt; </span><span ref={verbsRef ? (el) => { verbsRef.current[i] = el } : undefined} className="splash__verb">{verbsRef ? '' : v}</span>{'\n'}</span>
        ))}
      </pre>
    </div>
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
  const brandRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const asciiRef = useRef<AsciiHandle>(null)
  const asciiLayer = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const verbRefs = useRef<(HTMLSpanElement | null)[]>([])
  const lastDensity = useRef(-1)
  const mobile = useMediaQuery(coarseQuery)
  const portrait = useMediaQuery(portraitQuery)
  const tl = useMemo(() => buildTimeline(FILM), [])
  const beatSpans = useMemo(
    () => BEATS.map((b) => ({ id: b.id, a: globalAt(tl, b.anchor, b.span[0]), b: globalAt(tl, b.anchor, b.span[1]) })),
    [tl],
  )
  const brandEntry = useMemo(() => tl.entries.find((e) => e.item.id === 'hold-8'), [tl])

  useEffect(() => {
    const wrapper = wrapperRef.current, stage = stageRef.current
    if (!wrapper || !stage) return
    const engine = new FilmEngine({
      wrapper, stage, items: FILM, mobile, portrait,
      onFrame: (p) => {
        for (const s of beatSpans) {
          const el = beatRefs.current.get(s.id)
          if (!el) continue
          const edge = (s.b - s.a) * 0.3
          const op = window01(p, s.a, s.b, edge)
          el.style.opacity = op.toFixed(3)
          el.style.transform = `translate3d(0, ${((1 - op) * 10).toFixed(2)}px, 0)`
        }
        if (hintRef.current) hintRef.current.style.opacity = (1 - smooth(p / 0.035)).toFixed(3)
        if (!brandEntry) return
        const t = clamp01((p - brandEntry.start) / (brandEntry.end - brandEntry.start))
        // 1. the mark and the wordmark rise over the final plate, then give way
        if (brandRef.current) {
          const op = HTML_BRAND ? smooth((t - 0.04) / 0.16) * (1 - smooth((t - 0.4) / 0.12)) : 0
          brandRef.current.style.opacity = op.toFixed(3)
          brandRef.current.style.transform = `translate3d(0, ${((1 - op) * 12).toFixed(2)}px, 0)`
        }
        // 2. the last frame itself turns into glyphs
        const d = smooth((t - 0.36) / 0.34)
        if (asciiLayer.current) asciiLayer.current.style.opacity = smooth(d / 0.12).toFixed(3)
        if (Math.abs(d - lastDensity.current) > 0.004) { lastDensity.current = d; asciiRef.current?.draw(d) }
        // 3. the terminal's splash boots on top, and the verbs type in
        if (splashRef.current) {
          const o = smooth((t - 0.58) / 0.14)
          splashRef.current.style.opacity = o.toFixed(3)
          splashRef.current.style.transform = `translate3d(-50%, ${((1 - o) * 10).toFixed(1)}px, 0)`
        }
        verbRefs.current.forEach((v, i) => {
          if (!v) return
          const k = clamp01((t - (0.7 + i * 0.065)) / 0.06)
          const txt = TUI.VERBS[i].slice(0, Math.round(k * TUI.VERBS[i].length))
          if (v.textContent !== txt) v.textContent = txt
          v.classList.toggle('caret', k > 0 && k < 1)
          v.classList.toggle('splash__verb-on', k >= 1 && i === 3)
        })
      },
    })
    engine.start()
    return () => engine.destroy()
  }, [mobile, portrait, beatSpans, brandEntry])

  const style = { '--film-weight': tl.totalWeight } as CSSProperties
  return (
    <section id="film" className="film" ref={wrapperRef} style={style} aria-labelledby="film-title">
      <h1 id="film-title" className="sr-only">UNBIDDEN — The Unknown. {TAGLINE}</h1>
      <div className="film__stage" ref={stageRef} data-portrait={portrait || undefined}>
        {KEYFRAMES.map((k) => (
          <div key={k.n} className="film__layer film__poster" data-kf={k.n} style={{ opacity: k.n === 1 ? 1 : 0 }}>
            <Poster n={k.n} eager={k.n === 1} />
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
        <div className="film__brand" ref={brandRef} aria-hidden="true" style={{ opacity: 0 }}>
          <img className="film__lockup" src="./media/brand/lockup-white.png" alt="" decoding="async" draggable={false} />
          <p className="film__brand-tag">{TAGLINE}</p>
        </div>
        <div className="film__ascii" ref={asciiLayer} aria-hidden="true" style={{ opacity: 0 }}>
          <AsciiCanvas ref={asciiRef} src={LAST_FRAME} className="film__ascii-canvas" />
        </div>
        <div className="film__splash" ref={splashRef} aria-hidden="true" style={{ opacity: 0 }}>
          <Splash verbsRef={verbRefs} />
        </div>
        <div className="film__hint" ref={hintRef} aria-hidden="true">
          <span>{SCROLL_HINT}</span>
          <i />
        </div>
        <a className="film__skip btn btn--secondary btn--sm" href={`#${nextId}`}>Skip the film</a>
      </div>
      <ol className="sr-only">
        {KEYFRAMES.map((k) => (
          <li key={k.n}>{k.title}. {k.alt}</li>
        ))}
        <li>The terminal starts: the mark, {WORDMARK}, the tagline and the four verbs of the agent: {TUI.VERBS.join(' ')}</li>
      </ol>
    </section>
  )
}

/** Reduced motion, or no scrubbing: the eight approved frames as a readable sequence, then the terminal's splash. */
export function FilmStatic({ nextId }: { nextId: string }) {
  return (
    <section id="film" className="film film--static" aria-labelledby="film-title">
      <header className="film__static-head">
        <p className="eyebrow">UNBIDDEN — THE UNKNOWN</p>
        <h1 id="film-title" className="display">{TAGLINE}</h1>
        <a className="btn btn--secondary btn--sm" href={`#${nextId}`}>Skip the film</a>
      </header>
      <ol className="film__static-list">
        {KEYFRAMES.map((k) => (
          <li key={k.n} className="film__static-item">
            <figure>
              <Poster n={k.n} eager={k.n === 1} />
              <figcaption>
                <span className="eyebrow">{String(k.n).padStart(2, '0')} · {k.title}</span>
                <p>{k.alt}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>
      <div className="film__static-splash" aria-hidden="true"><Splash /></div>
    </section>
  )
}
