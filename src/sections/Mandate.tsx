import { useId, useState, type ReactNode } from 'react'
import { BAR, EVERY_MODE, KILL, MANDATE_YAML, MODES, MODE_OUTPUT, PERMISSIONS, type Mode } from '../content/console'
import { CONTROL, LABELS, LINKS, MODELS, OPTIONS, STOPS } from '../content/product'
import { useReveal } from '../hooks/useReveal'
import { Eyebrow } from '../console/Eyebrow'
import { Bar, Term } from '../console/Term'
import './Mandate.css'

/** Minimal YAML colouring: keys, values, comments. Text is untouched. */
function Yaml({ text }: { text: string }) {
  const lines = text.split('\n').map((line, i) => {
    const c = line.indexOf('#')
    const code = c >= 0 ? line.slice(0, c) : line
    const comment = c >= 0 ? line.slice(c) : ''
    const parts: ReactNode[] = []
    const re = /([A-Za-z_][\w-]*)(:)(?=\s|$|[}\]])/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(code))) {
      parts.push(code.slice(last, m.index))
      parts.push(<span key={m.index} className="yaml__key">{m[1]}</span>, ':')
      last = m.index + m[0].length
    }
    parts.push(code.slice(last))
    return <span key={i}>{parts}{comment ? <span className="yaml__comment">{comment}</span> : null}{'\n'}</span>
  })
  return <pre className="yaml">{lines}</pre>
}

/** 03 — control: autonomy is granted, stops are named, and code decides what leaves. */
export function Mandate({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>(0.08)
  const [mode, setMode] = useState<Mode>('supervised')
  const [was, setWas] = useState<Mode | undefined>(undefined)
  const [killed, setKilled] = useState(false)
  const group = useId()
  const m = MODES.find((x) => x.id === mode)!
  const rows: [string, string | null][] = [['open_pull_requests', m.pr], ['merge_pull_requests', m.merge], ['deploy', m.deploy], ['rollback', m.rollback]]

  return (
    <section id={id} className="section mandate" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <Eyebrow n="03">{CONTROL.eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">{CONTROL.title}</h2>
          <p className="lede reveal" data-delay="2">{CONTROL.lede}</p>
        </header>

        <div className="mandate__grid reveal">
          <div className="modes" role="radiogroup" aria-labelledby={`${group}-l`}>
            <p id={`${group}-l`} className="eyebrow">Try it · unbidden mode</p>
            <div className="modes__row">
              {MODES.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={mode === x.id} className={`modes__btn mono ${mode === x.id ? 'modes__btn--on' : ''}`} onClick={() => { if (x.id !== mode) { setWas(mode); setMode(x.id) } }}>
                  {x.id}
                </button>
              ))}
            </div>
            <Term label="What `unbidden mode` prints" clock={false} fields={[`mode ${mode}`]} className="modes__term" footer={<Bar items={[<strong key="k" className={killed ? 'term__warn' : undefined}>{killed ? BAR.kill : `${'●'} agent`}</strong>, 'ollama ✓']} />}>
              <div className="modes__out">
                <p><span className="modes__prompt">$ </span>unbidden mode</p>
                <p className="modes__strong">{MODE_OUTPUT(mode, was)}</p>
                <dl className="modes__perms">
                  {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>)}
                </dl>
                <p className="modes__dim"># {m.readme}</p>
                <p className="modes__gap"><span className="modes__prompt">$ </span>unbidden {killed ? 'resume' : 'kill'}</p>
                <p className={killed ? 'modes__dim' : 'modes__warn'}>{killed ? KILL.cli_off : KILL.cli_on}</p>
              </div>
            </Term>
            <button type="button" className={`kill mono ${killed ? 'kill--on' : ''}`} aria-pressed={killed} onClick={() => setKilled((k) => !k)}>
              <span className="kill__label">{BAR.kill}</span>
              <span className="kill__text">{killed ? KILL.on : 'freeze everything now, in every process, until `unbidden resume`'}</span>
            </button>
          </div>

          <div className="mandate__side">
            <div className="mandate__block">
              <p className="eyebrow">In every mode</p>
              <ul className="mandate__list">
                {EVERY_MODE.map((r) => <li key={r}>{r.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}</li>)}
              </ul>
            </div>
            <div className="mandate__block">
              <p className="eyebrow">{STOPS.eyebrow}</p>
              <ul className="stops">
                {STOPS.items.map((s) => <li key={s.name} className="stop"><span className="stop__name">{s.name}</span><span>{s.body}</span></li>)}
              </ul>
              <p className="mandate__foot">{STOPS.note}</p>
            </div>
          </div>
        </div>

        <details className="fold reveal">
          <summary className="fold__sum"><span>The mandate, as a file</span><span className="fold__hint mono">mandate.yaml</span></summary>
          <div className="fold__body mandate__fold">
            <Term label="A mandate, as the documentation writes it" fields={['mandate.yaml', 'docs/RELEASE.md']} clock={false} className="mandate__yaml">
              <Yaml text={MANDATE_YAML} />
            </Term>
            <div className="mandate__block">
              <p className="mandate__perm mono">{PERMISSIONS.join(' · ')}</p>
              <p className="mandate__foot">Each permission is <code>allow</code>, <code>require_approval</code> or <code>deny</code>. The values the switch shows are the ones <a href={LINKS.readme} rel="noopener">README</a> and <a href={`${LINKS.repo}/blob/main/docs/RELEASE.md`} rel="noopener">RELEASE.md</a> state for each mode; a dash means the documentation does not fix it.</p>
            </div>
          </div>
        </details>

        <div className="where reveal">
          <div className="where__head">
            <Eyebrow>Where your code goes</Eyebrow>
            <h3 className="where__title">A model is never the control. Code decides what leaves.</h3>
          </div>
          <div className="where__labels">
            <ol className="labels mono" aria-label="Every request is labeled with its most sensitive part, lowest first">
              {LABELS.map((l) => <li key={l.name} className={`label ${l.stays ? 'label--stays' : ''}`}>{l.name}</li>)}
            </ol>
            <p className="labels__key">Every request is labeled with its most sensitive part. <strong>Secrets and production data stay on the machine in every option.</strong> Private code leaves only renamed by the privacy bridge, or when the mandate says so. The egress gate re-checks the label and scans every payload before it leaves.</p>
          </div>
          <div className="where__grid">
            <div className="where__col">
              <p className="eyebrow">Three options</p>
              <ul className="opts">
                {OPTIONS.map((o) => <li key={o.name}><code className="opts__name">{o.name}</code><span>{o.body}</span></li>)}
              </ul>
            </div>
            <div className="where__col">
              <p className="eyebrow">{MODELS.eyebrow}</p>
              <ul className="opts">
                {MODELS.items.map((x) => <li key={x.name}><span className="opts__model">{x.name}<span className="mono">{x.where}</span></span><span>{x.body}</span></li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
