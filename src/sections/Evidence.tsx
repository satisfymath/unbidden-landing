import type { CSSProperties } from 'react'
import { LEVELS } from '../content/console'
import { CAMPAIGN, CORPUS, EVIDENCE, SINCE, type CampaignCell } from '../content/product'
import { useReveal } from '../hooks/useReveal'
import { AsciiText } from '../console/AsciiLive'
import { CountUp } from '../console/CountUp'
import { Eyebrow } from '../console/Eyebrow'
import { DevRuns } from './DevRuns'
import './Evidence.css'

/** `L1 ▰ L2 ▰ L3 ▰ L4 ▰ L5 ▱ L6 ▱` with the exact definition on hover/focus. */
function Ladder({ reached }: { reached: number }) {
  return (
    <ol className="ladder" aria-label={`Evidence level reached: L${reached}`}>
      {LEVELS.map((l, i) => {
        const on = i + 1 <= reached
        return (
          <li key={l.id} className={`ladder__step ${on ? 'ladder__step--on' : ''}`} tabIndex={0}>
            <span className="ladder__glyph" aria-hidden="true">{on ? '▰' : '▱'}</span>
            <span className="ladder__id">{l.id}</span>
            <span className="ladder__tip" role="tooltip"><strong>{l.name}.</strong> {l.def}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** One square per repository: reached, reached under a variant or said out of scope, not reached. */
function Units({ cell }: { cell: CampaignCell }) {
  const extra = cell.also ?? 0
  return (
    <span className="units" aria-hidden="true">
      {Array.from({ length: cell.of }, (_, i) => (
        <i key={i} className={i < cell.on ? 'unit unit--on' : i < cell.on + extra ? `unit unit--${cell.alsoKind}` : 'unit'} style={{ '--k': i } as CSSProperties} />
      ))}
    </span>
  )
}

function Cell({ cell, label, cls }: { cell: CampaignCell | null; label: string; cls: string }) {
  if (!cell) return <td className={`camp__cell camp__cell--${cls} camp__cell--none`} data-label={label}><span className="camp__count">not run</span></td>
  return (
    <td className={`camp__cell camp__cell--${cls}`} data-label={label}>
      <span className="camp__count tnum"><strong>{cell.on}</strong> of {cell.of}</span>
      <Units cell={cell} />
      {cell.note ? <span className="camp__note">{cell.note}</span> : null}
    </td>
  )
}

/** 02 — the evidence: the 39-repository campaign first, then single systems, each at the level it reached. */
export function Evidence({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>(0.05)
  return (
    <section id={id} className="section evidence" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="ev__head">
          <Eyebrow n="02" className="ev__eyebrow">{EVIDENCE.eyebrow}</Eyebrow>
          <div className="ev__num reveal"><AsciiText text="39" className="ev__canvas" /></div>
          <div className="ev__text">
            <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">{EVIDENCE.title}</h2>
            <p className="lede reveal" data-delay="2">{EVIDENCE.lede}</p>
          </div>
        </header>
      </div>

      <div className="marquee ev__marquee reveal" aria-label={`The 39 repositories: ${CORPUS.join(', ')}`}>
        <div className="marquee__track mono" aria-hidden="true">
          {[0, 1].map((k) => <span key={k} className="ev__names">{CORPUS.map((n) => <span key={n}>{n}<i> / </i></span>)}</span>)}
        </div>
      </div>

      <div className="container">
        <div className="camp reveal">
          <div className="camp__scroll tile">
            <table className="camp__table">
              <caption className="sr-only">{CAMPAIGN.eyebrow}: how far Unbidden got on each class of repository</caption>
              <thead>
                <tr>
                  <th scope="col" className="camp__stage-head"><span className="eyebrow">{CAMPAIGN.eyebrow}</span></th>
                  {CAMPAIGN.classes.map((c) => (
                    <th key={c.id} scope="col" className={`camp__class camp__class--${c.id}`}>
                      <span className="camp__class-name">{c.name} <span className="tnum">{c.n}</span></span>
                      <span className="camp__class-note">{c.note}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAMPAIGN.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="camp__stage">
                      <span className="camp__stage-label">{r.label}</span>
                      <span className="camp__stage-scope">{r.scope}</span>
                    </th>
                    <Cell cell={r.dev} label={CAMPAIGN.classes[0].name} cls="dev" />
                    <Cell cell={r.independent} label={CAMPAIGN.classes[1].name} cls="independent" />
                    <Cell cell={r.frontier} label={CAMPAIGN.classes[2].name} cls="frontier" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="facts">
            {CAMPAIGN.facts.map((f) => (
              <div key={f.label} className="fact tile">
                <dd className="fact__value tnum"><CountUp value={f.value} decimals={f.dec ?? 0} prefix={f.prefix ?? ''} suffix={f.unit ?? ''} /></dd>
                <dt className="fact__label">{f.label}</dt>
              </div>
            ))}
          </dl>

          <ul className="camp__notes">
            {CAMPAIGN.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <ul className="finding__links">
            {CAMPAIGN.links.map((l) => <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>)}
          </ul>
        </div>

        <DevRuns />

        <div className="since reveal">
          <div className="since__main">
            <Eyebrow>{SINCE.eyebrow}</Eyebrow>
            <ol className="since__list">
              {SINCE.items.map((it) => (
                <li key={it.title} className="since__item">
                  <span className="since__version mono">{it.version}</span>
                  <div><h3 className="since__title">{it.title}</h3><p className="since__body">{it.body}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="road">
            <p className="eyebrow">{SINCE.roadTitle}</p>
            <ul className="road__classes mono">{SINCE.classes.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="road__body">{SINCE.road}</p>
            <ul className="finding__links">
              {SINCE.links.map((l) => <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>)}
            </ul>
          </aside>
        </div>

        <div className="results">
          <Eyebrow>{EVIDENCE.resultsEyebrow}</Eyebrow>
          <ul className="findings">
            {EVIDENCE.findings.map((f) => (
              <li key={f.id} className="finding reveal">
                <div className="finding__head">
                  <span className={`finding__level mono finding__level--${f.levelClass}`}>{f.level}</span>
                  <h3 className="finding__title">{f.title}</h3>
                  <p className="finding__figure tnum">
                    {f.figure.map((part, j) =>
                      part.big ? (
                        <span key={j} className="finding__big">{part.num !== undefined ? <CountUp value={part.num} decimals={part.dec ?? (Number.isInteger(part.num) ? 0 : 2)} suffix={part.unit} /> : part.text}</span>
                      ) : (
                        <span key={j} className="finding__small">{part.text}</span>
                      ),
                    )}
                  </p>
                  {f.levelN > 0 ? <Ladder reached={f.levelN} /> : null}
                </div>
                <div className="finding__text">
                  <p className="finding__body">{f.body}</p>
                  {f.caveat ? <p className="finding__caveat">{f.caveat}</p> : null}
                  {f.verdict ? <p className="finding__verdict mono"><span className="finding__gt" aria-hidden="true">&gt; </span>{f.verdict}</p> : null}
                  <ul className="finding__links">
                    {f.links.map((l) => <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          <p className="evidence__foot reveal">
            {EVIDENCE.foot} <a href={EVIDENCE.footLink.href} rel="noopener">{EVIDENCE.footLink.label}</a>
          </p>
        </div>
      </div>
    </section>
  )
}
