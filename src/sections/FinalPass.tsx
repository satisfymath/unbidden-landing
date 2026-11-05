import { useState, type CSSProperties } from 'react'
import { CAMPAIGN, FINAL_PASS as COPY } from '../content/product'
import data from '../content/final-pass.json'
import { CountUp } from '../console/CountUp'
import { Eyebrow } from '../console/Eyebrow'
import { FinalMatrix } from './FinalMatrix'
import { FinalRun } from './FinalRun'
import './FinalPass.css'

const CLASSES = ['dev', 'independent', 'frontier'] as const
const className = (id: string) => CAMPAIGN.classes.find((c) => c.id === id)?.name ?? ''
const classOf = Object.fromEntries(data.repositories.map((r) => [r.name, r.cls]))

function Legend() {
  return (
    <ul className="dr__legend" aria-label="Class of each repository">
      {CLASSES.map((c) => <li key={c}><i className={`dr__key dr__key--${c}`} aria-hidden="true" />{className(c)}</li>)}
    </ul>
  )
}

/** Stage by stage, repositories that got there, split by class on one scale of 39. */
function Funnel() {
  const [stage, setStage] = useState('merged')
  const cur = data.funnel.find((f) => f.id === stage) ?? data.funnel[0]
  const pick = (id: string) => ({ onClick: () => setStage(id), onMouseEnter: () => setStage(id), onFocus: () => setStage(id), 'aria-pressed': id === stage })
  return (
    <figure className="fc tile fc--funnel">
      <figcaption className="fc__head">
        <div><h3 className="fc__title">{COPY.funnel.title}</h3><p className="fc__sub">{COPY.funnel.sub}</p></div>
        <Legend />
      </figcaption>
      <ol className="fn">
        {data.funnel.map((f) => {
          const by = f.by as Record<string, number>
          return (
            <li key={f.id}>
              <button type="button" className="dr__row fn__row" {...pick(f.id)}>
                <span className="fn__label">{f.label}</span>
                <span className="fn__track" aria-hidden="true" style={{ '--w': `${(f.n / 39) * 100}%` } as CSSProperties}>
                  {CLASSES.filter((c) => by[c]).map((c) => <i key={c} className={`fn__seg dr__key--${c}`} style={{ flexGrow: by[c] }} />)}
                </span>
                <span className="fn__n tnum">{f.n}</span>
                <span className="sr-only">{CLASSES.filter((c) => by[c]).map((c) => `${by[c]} ${className(c)}`).join(', ')}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="fn__names mono" aria-live="polite">
        <span className="fn__names-by">{CLASSES.filter((c) => (cur.by as Record<string, number>)[c]).map((c) => `${(cur.by as Record<string, number>)[c]} ${className(c).toLowerCase()}`).join(' · ')}</span>
        {cur.names.join('  ')}
      </p>
      <p className="fc__note">{COPY.funnel.note}</p>
    </figure>
  )
}

const fateOf = (p: { merged: boolean; ci: string }) => (p.merged ? 'merged' : p.ci)
const fateOrder = ['merged', 'green', 'red', 'none']

/** Every pull request is a square, and every square opens it. */
function Fate() {
  const [hover, setHover] = useState<(typeof data.pull_requests)[number] | null>(null)
  const sorted = [...data.pull_requests].sort((a, b) => fateOrder.indexOf(fateOf(a)) - fateOrder.indexOf(fateOf(b)))
  return (
    <figure className="fc tile">
      <figcaption className="fc__head"><div><h3 className="fc__title">{COPY.fate.title}</h3><p className="fc__sub">{COPY.fate.sub}</p></div></figcaption>
      <div className="fs" onMouseLeave={() => setHover(null)}>
        {sorted.map((p, i) => (
          <a
            key={p.url}
            href={p.url}
            rel="noopener"
            className={`fs__sq fs__sq--${fateOf(p)}`}
            style={{ '--k': i } as CSSProperties}
            aria-label={`${p.repo} #${p.n}: ${p.title}. ${COPY.fate.groups[fateOf(p)].label}`}
            onMouseEnter={() => setHover(p)}
            onFocus={() => setHover(p)}
          />
        ))}
      </div>
      <p className="fs__tip mono" aria-hidden="true">{hover ? <><span>{hover.repo} #{hover.n}</span> {hover.title}</> : <span className="fs__tip-idle">{COPY.fate.kinds}</span>}</p>
      <ul className="fs__legend">
        {fateOrder.map((k) => (
          <li key={k}>
            <i className={`fs__sq fs__sq--${k}`} aria-hidden="true" />
            <span className="fs__n tnum">{data.fate[k as keyof typeof data.fate]}</span>
            <span><strong>{COPY.fate.groups[k].label}.</strong> {COPY.fate.groups[k].note}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function Bars({ rows, label }: { rows: [string, number][]; label: (id: string) => string }) {
  const widest = Math.max(...rows.map((r) => r[1]))
  return (
    <ul className="fb">
      {rows.map(([id, n]) => (
        <li key={id} className="fb__row">
          <span className="fb__label">{label(id)}</span>
          <span className="fb__track" aria-hidden="true"><i className={`fb__bar fb__bar--${id}`} style={{ width: `${(n / widest) * 100}%` }} /></span>
          <span className="fb__n tnum">{n}</span>
        </li>
      ))}
    </ul>
  )
}

function Decisions() {
  return (
    <figure className="fc tile">
      <figcaption className="fc__head"><div><h3 className="fc__title">{COPY.decisions.title}</h3><p className="fc__sub">{COPY.decisions.sub}</p></div></figcaption>
      <Bars rows={data.decisions as [string, number][]} label={(id) => COPY.decisions.labels[id] ?? id} />
      <h4 className="fc__minor">{COPY.decisions.declinedTitle}</h4>
      <Bars rows={data.declined as [string, number][]} label={(id) => id} />
    </figure>
  )
}

/** A staircase of names: nothing is averaged away. */
function Levels() {
  const at = (id: string) => data.repositories.filter((r) => (id === 'stopped' ? r.stopped : r.level === id)).map((r) => r.name)
  return (
    <figure className="fc tile fc--levels">
      <figcaption className="fc__head"><div><h3 className="fc__title">{COPY.levels.title}</h3></div><Legend /></figcaption>
      <ol className="fl">
        {COPY.levels.rows.map((row) => {
          const names = at(row.id)
          return (
            <li key={row.id} className={`fl__row fl__row--${row.id === '-' ? 'none' : row.id}`}>
              <span className="fl__id mono">{row.label}</span>
              <span className="fl__n tnum">{names.length}</span>
              <span className="fl__note">{row.note}</span>
              <ul className="fl__names mono">
                {names.map((n) => <li key={n}><i className={`dr__key dr__key--${classOf[n]}`} aria-hidden="true" />{n}<span className="sr-only"> ({className(classOf[n])})</span></li>)}
              </ul>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}

function Merges() {
  const merged = data.pull_requests.filter((p) => p.merged)
  return (
    <div className="fm">
      <h3 className="fc__title">{COPY.merges.title} <span className="tnum fc__count">{merged.length}</span></h3>
      <ol className="fp__list tile">
        {merged.map((p) => (
          <li key={p.url} className="fp__row">
            <span className="fp__repo mono">{p.repo}</span>
            <span className={`fp__class fp__class--${classOf[p.repo]}`}>{className(classOf[p.repo])}</span>
            <span className="fp__title mono">{p.title}</span>
            <span className="fp__checks tnum">{p.ci === 'green' ? 'CI green' : 'no CI'} · {p.verified} · {p.version}</span>
            <a className="fp__pr mono" href={p.url} rel="noopener">#{p.n} ↗</a>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Campaign 12 and 13 side by side: same dimension, one 0-100 axis, each with its interval. */
function Compare() {
  const classes = ['independent', 'dev'] as const
  return (
    <figure className="fc tile fc--compare">
      <figcaption className="fc__head">
        <div><h3 className="fc__title">{COPY.compare.title}</h3><p className="fc__sub">{COPY.compare.sub}</p></div>
        <ul className="dr__legend">
          <li><i className="cmp__dot cmp__dot--c12" aria-hidden="true" />{COPY.compare.c12}</li>
          <li><i className="cmp__dot cmp__dot--c13" aria-hidden="true" />{COPY.compare.c13}</li>
        </ul>
      </figcaption>
      <div className="cmp">
        {classes.map((cls) => (
          <div key={cls} className="cmp__col">
            <h4 className="fc__minor">{className(cls)}</h4>
            <ul>
              {data.compare.filter((c) => c.cls === cls).map((c) => (
                <li key={c.id} className="cmp__row">
                  <span className="cmp__label">{c.label}</span>
                  <span className="cmp__track" aria-hidden="true">
                    <i className="cmp__link" style={{ left: `${Math.min(c.c12.pct, c.c13.pct)}%`, width: `${Math.abs(c.c13.pct - c.c12.pct)}%` }} />
                    <i className="cmp__ci cmp__ci--c12" style={{ left: `${c.c12.lo}%`, width: `${c.c12.hi - c.c12.lo}%` }} />
                    <i className="cmp__ci cmp__ci--c13" style={{ left: `${c.c13.lo}%`, width: `${c.c13.hi - c.c13.lo}%` }} />
                    <i className="cmp__dot cmp__dot--c12" style={{ left: `${c.c12.pct}%` }} />
                    <i className="cmp__dot cmp__dot--c13" style={{ left: `${c.c13.pct}%` }} />
                  </span>
                  <span className="cmp__vals tnum"><span>{c.c12.on}/{c.c12.of}</span><span aria-hidden="true"> → </span><span className="sr-only"> then </span><strong>{c.c13.on}/{c.c13.of}</strong></span>
                </li>
              ))}
            </ul>
            <div className="cmp__axis" aria-hidden="true"><span>0</span><span>50</span><span>100%</span></div>
          </div>
        ))}
      </div>
      <p className="fc__note">{COPY.compare.note}</p>
    </figure>
  )
}

/** What opens under the pass: the pull requests, the repositories, how to read it. */
export function FinalPullRequests() {
  return (
    <>
      <div className="fp__pair"><Fate /><Decisions /></div>
      <Merges />
    </>
  )
}

export function FinalRepositories() {
  return (
    <>
      <Levels />
      <FinalMatrix />
    </>
  )
}

export function FinalNotes() {
  return (
    <>
      <p className="fp__stamp mono">{COPY.stamp}</p>
      <p className="fc__sub">{COPY.intro}</p>
      <ul className="camp__notes">{COPY.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <ul className="finding__links">{COPY.links.map((l) => <li key={l.href}><a className="mono" href={l.href} rel="noopener">{l.label} ↗</a></li>)}</ul>
    </>
  )
}

export { Compare as FinalCompare, FinalRun }

/** Campaign 13's final pass at a glance: the number, what it rests on, and where the 39 went. */
export function FinalPass() {
  const { totals } = data
  const facts = [
    { value: totals.repositories_run, unit: ' of 39', label: COPY.facts.record },
    { value: totals.pull_requests, label: COPY.facts.pulls },
    { value: 3, label: COPY.facts.l5 },
    { value: data.spent_usd, dec: 2, prefix: 'US$', label: COPY.facts.spend },
  ]
  return (
    <div className="fp reveal">
      <Eyebrow>{COPY.eyebrow}</Eyebrow>
      <div className="dr__head">
        <p className="dr__figure">
          <span className="dr__big tnum"><CountUp value={totals.merged_by_unbidden} decimals={0} /></span>
          <span className="dr__label">{COPY.figureLabel}</span>
        </p>
        <p className="dr__lede">{COPY.lede}</p>
      </div>

      <dl className="facts">
        {facts.map((f) => (
          <div key={f.label} className="fact tile">
            <dd className="fact__value tnum"><CountUp value={f.value} decimals={f.dec ?? 0} prefix={f.prefix ?? ''} suffix={f.unit ?? ''} /></dd>
            <dt className="fact__label">{f.label}</dt>
          </div>
        ))}
      </dl>

      <Funnel />
    </div>
  )
}
