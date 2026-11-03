import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { BEATS, FILM, KEYFRAMES, SCROLL_HINT, TAGLINE, WORDMARK } from '../content/film'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { coarseQuery, portraitQuery } from '../lib/device'
import { smooth, window01 } from '../lib/math'
import { LogoDisplay, Wordmark } from '../ui/Logo'
import { FilmEngine } from './FilmEngine'
import { buildTimeline, globalAt } from './timeline'
import './Film.css'

const clips = FILM.filter((i) => i.kind === 'clip')
const lastClip = clips[clips.length - 1]
/** The HTML brand closing is only shown when clip 07 ends on the clean plate; otherwise frame 8 carries the baked mark. */
const HTML_BRAND = lastClip?.kind === 'clip' && Boolean(lastClip.src)

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
        if (brandRef.current && brandEntry) {
          const local = (p - brandEntry.start) / (brandEntry.end - brandEntry.start)
          const op = HTML_BRAND ? smooth((local - 0.12) / 0.45) : 0
          brandRef.current.style.opacity = op.toFixed(3)
          brandRef.current.style.transform = `translate3d(0, ${((1 - op) * 12).toFixed(2)}px, 0)`
        }
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
          <LogoDisplay className="film__brand-mark" />
          <Wordmark text={WORDMARK} className="film__brand-word" />
          <p className="film__brand-tag">{TAGLINE}</p>
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
      </ol>
    </section>
  )
}

/** Reduced motion, or no scrubbing: the eight approved frames as a readable sequence. */
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
    </section>
  )
}
