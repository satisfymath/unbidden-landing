import { Fragment, useState } from 'react'
import { CAMPAIGN, FINAL_PASS } from '../content/product'
import data from '../content/final-pass.json'

const COPY = FINAL_PASS.matrix
const className = (id: string) => CAMPAIGN.classes.find((c) => c.id === id)?.name ?? ''
const fmt = (n: number) => n.toLocaleString('en-US')
const RANK = ['-', 'L1', 'L2', 'L3', 'L4', 'L5']
type Repo = (typeof data.repositories)[number]

/** A number, or a dash that stays quiet when there is nothing there. */
function Count({ n, strong }: { n: number; strong?: boolean }) {
  return <span className={`mx__c tnum ${n ? '' : 'mx__c--zero'} ${n && strong ? 'mx__c--strong' : ''}`}>{n || '·'}</span>
}

function Pips({ level }: { level: string | null }) {
  const reached = level ? RANK.indexOf(level) : 0
  return (
    <span className="mx__level">
      <span className="mx__pips" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= reached ? (reached === 5 ? 'on on--top' : 'on') : ''} />)}</span>
      <span className="mono">{level && level !== '-' ? level : '–'}</span>
    </span>
  )
}

function Detail({ repo }: { repo: Repo }) {
  if (repo.stopped) return <p className="mx__stopped">{COPY.stopped}</p>
  return (
    <div className="mx__detail">
      {repo.runs.map((run) => (
        <section key={run.version} className="mx__run">
          <p className="mx__run-head mono">
            <span>{run.version}</span>
            <span>{run.mode}</span>
            <span>{COPY.checks[run.checks ?? ''] ?? run.checks}{run.tests ? `, ${fmt(run.tests)} tests` : ''}</span>
            <span>{run.deploys} deploys</span>
            <span>{run.calls} model calls</span>
            <span>US${run.spent.toFixed(4)}</span>
            {run.first_pr_min ? <span>first PR at {run.first_pr_min} min</span> : null}
            <a href={FINAL_PASS.matrixHref(repo.name, run.version)} rel="noopener">{COPY.record} ↗</a>
          </p>
          {run.host && run.host !== 'up' ? <p className="mx__host">Self-host: {run.host}</p> : null}
          {run.prs.length ? (
            <ul className="mx__prs">
              {run.prs.map((p) => (
                <li key={p.url} className="mono">
                  <a href={p.url} rel="noopener">#{p.n} ↗</a>
                  <span className="mx__pr-title">{p.title}</span>
                  <span className={`mx__ci mx__ci--${p.merged ? 'merged' : p.ci}`}>{p.merged ? `merged, ${p.verified}` : p.ci === 'none' ? 'no CI' : p.ci}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {run.items.length ? (
            <div className="mx__items-wrap">
              <table className="mx__items">
                <thead><tr><th scope="col">Opportunity</th><th scope="col">Status</th><th scope="col">Level</th><th scope="col">Why</th></tr></thead>
                <tbody>
                  {run.items.map((o, i) => (
                    <tr key={i}>
                      <td>{o.title}</td>
                      <td className={`mx__status mx__status--${o.status}`}>{o.status}</td>
                      <td className="mono">{o.level}</td>
                      <td>{o.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mx__host">No opportunity recorded.</p>}
        </section>
      ))}
    </div>
  )
}

/** The 39 by what each one did. Every row opens the opportunities, the decisions and the reasons behind its numbers. */
export function FinalMatrix() {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState('fst')
  const filters = [
    { id: 'all', label: COPY.all, test: () => true },
    ...CAMPAIGN.classes.map((c) => ({ id: c.id, label: `${c.name} ${c.n}`, test: (r: Repo) => r.cls === c.id })),
    { id: 'merged', label: `${COPY.merged} ${data.totals.merged_by_unbidden}`, test: (r: Repo) => r.merged > 0 },
  ]
  const rows = data.repositories.filter(filters.find((f) => f.id === filter)?.test ?? (() => true))
  const widest = Math.max(...data.repositories.map((r) => r.spent))
  return (
    <div className="mx">
      <div className="mx__head">
        <div><h3 className="fc__title">{COPY.title}</h3><p className="fc__sub">{COPY.sub}</p></div>
        <div className="mx__filters" role="group" aria-label="Filter the repositories">
          {filters.map((f) => <button key={f.id} type="button" className="mx__filter" aria-pressed={f.id === filter} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
      </div>
      <div className="mx__scroll tile">
        <table className="mx__table">
          <caption className="sr-only">Campaign 13 final pass, one row per repository</caption>
          <thead><tr>{COPY.columns.map((c, i) => <th key={c} scope="col" className={`${i ? 'mx__num' : ''} ${[1, 2, 3, 5, 8].includes(i) ? 'mx__wide' : ''}`}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = open === r.name
              return (
                <Fragment key={r.name}>
                  <tr className={`mx__row ${r.stopped ? 'mx__row--stopped' : ''} ${isOpen ? 'mx__row--open' : ''}`} onClick={() => setOpen(isOpen ? '' : r.name)}>
                    <th scope="row">
                      <button type="button" className="mx__name mono" aria-expanded={isOpen} onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? '' : r.name) }}>
                        <i className={`dr__key dr__key--${r.cls}`} aria-hidden="true" />{r.name}<span className="sr-only">, {className(r.cls)}</span>
                        {r.runs.length > 1 ? <span className="mx__twice" title={COPY.multi}>×{r.runs.length}</span> : null}
                      </button>
                    </th>
                    {r.stopped ? <td colSpan={8} className="mx__none">stopped at the close, no record</td> : (
                      <>
                        <td className="mx__num mx__wide"><span className={`mx__checks mx__checks--${r.checks}`}>{r.checks === 'passed' || r.checks === 'failed' ? <span className="tnum">{fmt(r.tests ?? 0)}</span> : null} <span className="mx__checks-word">{COPY.checks[r.checks ?? ''] ?? r.checks}</span></span></td>
                        <td className="mx__num mx__wide"><Count n={r.opportunities} /></td>
                        <td className="mx__num mx__wide"><Count n={r.experiments} /></td>
                        <td className="mx__num"><Count n={r.pulls} /></td>
                        <td className="mx__num mx__wide"><Count n={r.green} /></td>
                        <td className="mx__num"><Count n={r.merged} strong /></td>
                        <td className="mx__num"><Pips level={r.level} /></td>
                        <td className="mx__num mx__spent mx__wide"><span className="tnum">{r.spent.toFixed(2)}</span><i aria-hidden="true" style={{ width: `${Math.max((r.spent / widest) * 100, 2)}%` }} /></td>
                      </>
                    )}
                  </tr>
                  {isOpen ? <tr className="mx__open"><td colSpan={9}><Detail repo={r} /></td></tr> : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
