import type { CSSProperties } from 'react'
import { CAMPAIGN, FINAL_PASS } from '../content/product'
import data from '../content/final-pass.json'
import { CountUp } from '../console/CountUp'
import { Eyebrow } from '../console/Eyebrow'
import './FinalPass.css'

const merged = data.prs.filter((p) => p.state === 'MERGED')
const open = data.prs.filter((p) => p.state === 'OPEN')
const closed = data.prs.filter((p) => p.state === 'CLOSED')
const independent = merged.filter((p) => p.cls === 'independent').length
const security = merged.filter((p) => p.title.startsWith('security:')).length
const className = (id: string) => CAMPAIGN.classes.find((c) => c.id === id)?.name ?? ''
const number = (url: string) => `#${url.split('/').pop()}`

/** Campaign 13's final pass while it runs: what its records and GitHub say at the moment written above it. */
export function FinalPass() {
  const facts = [
    { value: data.done, unit: ` of ${data.corpus}`, label: `repositories finished: ${data.by_class.dev} development, ${data.by_class.independent} independent, ${data.by_class.frontier} frontier` },
    { value: data.l5_verified_deploy.length, label: `L5 by verified deploy: ${data.l5_verified_deploy.join(', ')}. No effect measured` },
    { value: open.length, label: 'more pull requests open, each with failing checks' },
    { value: data.spent_usd, dec: 2, prefix: 'US$', label: 'of model spend in these runs' },
  ]
  return (
    <div className="fp reveal">
      <Eyebrow>{FINAL_PASS.eyebrow}</Eyebrow>
      <div className="dr__head">
        <p className="dr__figure">
          <span className="dr__big tnum"><CountUp value={merged.length} decimals={0} /></span>
          <span className="dr__label">{FINAL_PASS.figureLabel(independent, merged.length - independent)}</span>
        </p>
        <p className="dr__lede">{FINAL_PASS.lede} <span className="fp__stamp mono">As of {data.as_of} (UTC−3), on 0.18.6.</span></p>
      </div>

      <dl className="facts">
        {facts.map((f) => (
          <div key={f.label} className="fact tile">
            <dd className="fact__value tnum"><CountUp value={f.value} decimals={f.dec ?? 0} prefix={f.prefix ?? ''} suffix={f.unit ?? ''} /></dd>
            <dt className="fact__label">{f.label}</dt>
          </div>
        ))}
      </dl>

      <ol className="fp__list tile">
        {merged.map((p, i) => (
          <li key={p.url} className="fp__row" style={{ '--k': i } as CSSProperties}>
            <span className="fp__repo mono">{p.repo}</span>
            <span className={`fp__class fp__class--${p.cls}`}>{className(p.cls)}</span>
            <span className="fp__title mono">{p.title}</span>
            <span className="fp__checks tnum">{p.checks ? `${p.green} checks green${p.checks > p.green ? `, ${p.checks - p.green} skipped` : ''}` : 'no checks: its CI skips pull requests'}</span>
            <a className="fp__pr mono" href={p.url} rel="noopener">{number(p.url)} ↗</a>
          </li>
        ))}
      </ol>

      <ul className="camp__notes">
        <li>{FINAL_PASS.notes[0]}</li>
        <li>{FINAL_PASS.notes[1]}</li>
        <li>{FINAL_PASS.nature(security, merged.length - security, closed.length)}</li>
      </ul>
    </div>
  )
}
