import { useState, type CSSProperties } from 'react'
import { CAMPAIGN, CORPUS, DEV_RUNS } from '../content/product'
import data from '../content/dev-evidence.json'
import { CountUp } from '../console/CountUp'
import { Eyebrow } from '../console/Eyebrow'
import './DevRuns.css'

const repos = data.repositories
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })
const passing = repos.filter((r) => r.tests_passing !== null).sort((a, b) => (b.tests_passing ?? 0) - (a.tests_passing ?? 0))
const declared = repos.filter((r) => r.tests_passing === null && r.outcome.startsWith('Declared'))
const red = repos.filter((r) => r.tests_passing === null && !r.outcome.startsWith('Declared'))
const rest = CORPUS.filter((n) => !repos.some((r) => r.name === n))
const widest = passing[0].tests_passing ?? 1
const className = (name: string) => CAMPAIGN.classes.find((c) => c.id === DEV_RUNS.classOf[name])?.name ?? ''
const groupOf = (name: string) => (red.some((r) => r.name === name) ? DEV_RUNS.groups.red : DEV_RUNS.groups.declared)

/** The repository writes commands between backticks. */
const inline = (text: string) => text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))

/** Campaign 13's development runs: where each of the 39 stands, and the record behind each answer. */
export function DevRuns() {
  const [selected, setSelected] = useState('fst')
  const cur = repos.find((r) => r.name === selected) ?? repos[0]
  const pick = (name: string) => ({ onClick: () => setSelected(name), onMouseEnter: () => setSelected(name), onFocus: () => setSelected(name), 'aria-pressed': name === selected })

  return (
    <div className="dr reveal">
      <Eyebrow>{DEV_RUNS.eyebrow}</Eyebrow>
      <div className="dr__head">
        <p className="dr__figure">
          <span className="dr__big tnum"><CountUp value={data.totals.tests_passing} format={fmt} /></span>
          <span className="dr__label">{DEV_RUNS.figureLabel}</span>
        </p>
        <p className="dr__lede">{DEV_RUNS.lede}</p>
      </div>

      <dl className="facts">
        {DEV_RUNS.facts.map((f) => (
          <div key={f.label} className="fact tile">
            <dd className="fact__value tnum"><CountUp value={f.value} decimals={f.dec ?? 0} prefix={f.prefix ?? ''} /></dd>
            <dt className="fact__label">{f.label}</dt>
          </div>
        ))}
      </dl>

      <div className="dr__board tile">
        <div className="dr__list">
          <div className="dr__strip" role="img" aria-label={`Of the 39 repositories: ${passing.length} suites pass, ${red.length} run without going green, ${declared.length} declared, ${rest.length} not in these runs.`}>
            {[...passing.map(() => 'unit--on'), ...red.map(() => 'unit--red'), ...declared.map(() => 'unit--scope'), ...rest.map(() => '')].map((kind, i) => (
              <i key={i} className={`unit ${kind}`} style={{ '--k': i } as CSSProperties} />
            ))}
          </div>

          <div className="dr__group">
            <div className="dr__title">
              <h4><i className="unit unit--on" aria-hidden="true" />{DEV_RUNS.groups.pass} <span className="tnum">{passing.length}</span></h4>
              <ul className="dr__legend" aria-label="Class of each repository">
                {CAMPAIGN.classes.map((c) => <li key={c.id}><i className={`dr__key dr__key--${c.id}`} aria-hidden="true" />{c.name}</li>)}
              </ul>
            </div>
            <ul>
              {passing.map((r) => (
                <li key={r.name}>
                  <button type="button" className="dr__row dr__row--bar" {...pick(r.name)}>
                    <span className="dr__name mono">{r.name}</span>
                    <span className="dr__track" aria-hidden="true"><i className={`dr__bar dr__key--${DEV_RUNS.classOf[r.name]}`} style={{ width: `${((r.tests_passing ?? 0) / widest) * 100}%` }} /></span>
                    <span className="dr__n tnum">{fmt(r.tests_passing ?? 0)}<span className="sr-only"> tests, {className(r.name)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {[{ title: DEV_RUNS.groups.red, unit: 'unit--red', items: red }, { title: DEV_RUNS.groups.declared, unit: 'unit--scope', items: declared }].map((g) => (
            <div key={g.title} className="dr__group">
              <h4><i className={`unit ${g.unit}`} aria-hidden="true" />{g.title} <span className="tnum">{g.items.length}</span></h4>
              <ul className="dr__chips">
                {g.items.map((r) => <li key={r.name}><button type="button" className="dr__row dr__chip mono" {...pick(r.name)}>{r.name}</button></li>)}
              </ul>
            </div>
          ))}

          <div className="dr__group">
            <h4><i className="unit" aria-hidden="true" />{DEV_RUNS.groups.rest} <span className="tnum">{rest.length}</span></h4>
            <ul className="dr__rest mono">{rest.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </div>

        <div className="dr__side" aria-live="polite">
          <div className="dr__panel" key={cur.name}>
            <p className="dr__panel-name mono"><span aria-hidden="true">&gt; </span>{cur.name}</p>
            <p className="dr__panel-kind">{cur.kind} · {className(cur.name)}</p>
            <p className="dr__panel-n tnum">{cur.tests_passing !== null ? <><strong>{fmt(cur.tests_passing)}</strong> tests pass</> : <strong className="dr__panel-state">{groupOf(cur.name)}</strong>}</p>
            <p className="dr__panel-outcome">{inline(cur.outcome)}</p>
            {DEV_RUNS.extra[cur.name] ? <p className="finding__caveat">{DEV_RUNS.extra[cur.name]}</p> : null}
            <a className="dr__record mono" href={DEV_RUNS.recordHref(cur.record)} rel="noopener">{cur.record.split('/').slice(-2).join('/')} ↗</a>
          </div>
        </div>
      </div>

      <ul className="camp__notes">{DEV_RUNS.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <ul className="finding__links">
        {DEV_RUNS.links.map((l) => <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>)}
      </ul>
    </div>
  )
}
