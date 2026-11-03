import { EVIDENCE } from '../content/product'
import { useReveal } from '../hooks/useReveal'
import './Evidence.css'

/** Act III — THE EVIDENCE: real, verifiable results, each with the level the repository itself assigns. */
export function Evidence({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  return (
    <section id={id} className="section evidence" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <p className="eyebrow reveal">{EVIDENCE.eyebrow}</p>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">{EVIDENCE.title}</h2>
          <p className="lede reveal" data-delay="2">{EVIDENCE.lede}</p>
        </header>

        <ol className="levels reveal" aria-label="Evidence levels">
          {EVIDENCE.levels.map((l) => (
            <li key={l.id} className="levels__item"><span className="mono levels__id">{l.id}</span><span>{l.name}</span></li>
          ))}
        </ol>

        <ul className="findings">
          {EVIDENCE.findings.map((f, i) => (
            <li key={f.id} className="finding reveal" data-delay={String(Math.min(2, i))}>
              <div className="finding__head">
                <span className={`finding__level mono finding__level--${f.levelClass}`}>{f.level}</span>
                <h3 className="finding__title">{f.title}</h3>
              </div>
              <p className="finding__figure tnum">
                {f.figure.map((part, j) => (
                  <span key={j} className={part.big ? 'finding__big' : 'finding__small'}>{part.text}</span>
                ))}
              </p>
              <p className="finding__body">{f.body}</p>
              {f.caveat ? <p className="finding__caveat">{f.caveat}</p> : null}
              <ul className="finding__links">
                {f.links.map((l) => (
                  <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="evidence__foot reveal">
          {EVIDENCE.foot} <a href={EVIDENCE.footLink.href} rel="noopener">{EVIDENCE.footLink.label}</a>
        </p>
      </div>
    </section>
  )
}
