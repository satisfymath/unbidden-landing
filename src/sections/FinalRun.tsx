import type { CSSProperties } from 'react'
import { FINAL_PASS } from '../content/product'
import data from '../content/final-pass.json'

const COPY = FINAL_PASS.run
const { story } = data
const stamp = (ts: string) => new Date(ts).getTime()
const start = stamp(story.steps[0].ts)
const span = stamp(story.steps[story.steps.length - 1].ts) - start
const place = (ts: string) => ((stamp(ts) - start) / span) * 100
const opened = story.steps.find((s) => s.kind === 'wait')?.ts ?? story.steps[0].ts
const green = story.steps[story.steps.findIndex((s) => s.kind === 'wait') + 1].ts
const minutes = Math.round((stamp(green) - stamp(opened)) / 60000)
const widest = Math.max(...story.endpoints.flatMap((e) => [e.before, e.after]))

/** One real improvement: the product's event log, on a clock, and the health it judged after the deploy. */
export function FinalRun() {
  return (
    <figure className="fc tile fr">
      <figcaption className="fc__head">
        <div><h3 className="fc__title">{COPY.title}</h3><p className="fc__sub">{COPY.body}</p></div>
        <a className="mono fr__pr" href={story.pr} rel="noopener">c13-aegra #7 ↗</a>
      </figcaption>

      <div className="fr__clock" aria-hidden="true">
        <i className="fr__wait" style={{ left: `${place(opened)}%`, width: `${place(green) - place(opened)}%` }}><span className="tnum">{minutes} min {COPY.wait}</span></i>
        {story.steps.map((s) => <i key={s.ts} className={`fr__tick ${s.kind ? `fr__tick--${s.kind}` : ''}`} style={{ left: `${place(s.ts)}%` }} />)}
      </div>

      <ol className="fr__log mono">
        {story.steps.map((s, i) => (
          <li key={s.ts} className={`fr__line ${s.kind ? `fr__line--${s.kind}` : ''}`} style={{ '--k': i } as CSSProperties}>
            <span className="fr__at tnum">{s.at}</span>
            <span className="fr__actor">{s.actor}</span>
            <span className="fr__text">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className="fr__after">
        <div>
          <h4 className="fc__minor">{COPY.endpoints}</h4>
          <ul className="fe">
            {story.endpoints.map((e) => (
              <li key={e.target} className="fe__row">
                <span className="fe__name mono">{e.target.replace('GET ', '')}</span>
                <span className="fe__track" aria-hidden="true">
                  <i className="fe__dot fe__dot--before" style={{ left: `${(e.before / widest) * 100}%` }} />
                  <i className="fe__dot fe__dot--after" style={{ left: `${(e.after / widest) * 100}%` }} />
                </span>
                <span className="fe__n tnum">{e.before.toFixed(1)} → {e.after.toFixed(1)}</span>
              </li>
            ))}
          </ul>
          <p className="fc__note">{COPY.endpointsNote}</p>
        </div>
        <div className="fr__verify">
          <h4 className="fc__minor">{COPY.verify}</h4>
          <dl className="fr__dl mono">
            <div><dt>changed</dt><dd>{story.verify.changed.join(', ')}</dd></div>
            <div><dt>advisories at base</dt><dd>{story.verify.at_base.join(', ')}</dd></div>
            <div><dt>advisories at head</dt><dd className="tnum">{story.verify.at_head.length}</dd></div>
            <div><dt>verify.py</dt><dd className="fr__ok">{story.verify.verdict}</dd></div>
          </dl>
          <p className="fc__note">{COPY.caveat}</p>
        </div>
      </div>
    </figure>
  )
}
