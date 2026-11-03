import { useId, useState, type ReactNode } from 'react'
import { BAR, EVERY_MODE, KILL, MANDATE_YAML, MODES, MODE_OUTPUT, PERMISSIONS, type Mode } from '../content/console'
import { CONTROL, LINKS } from '../content/product'
import { useReveal } from '../hooks/useReveal'
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

/** Act II-b — the mandate: autonomy is granted, never assumed. */
export function Mandate({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
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
          <p className="eyebrow reveal">{CONTROL.eyebrow}</p>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">{CONTROL.title}</h2>
          <p className="lede reveal" data-delay="2">{CONTROL.lede}</p>
        </header>

        <div className="mandate__grid reveal">
          <Term label="A mandate, as the documentation writes it" fields={['mandate.yaml', 'docs/RELEASE.md']} clock={false} className="mandate__yaml">
            <Yaml text={MANDATE_YAML} />
          </Term>

          <div className="mandate__ctl">
            <div className="modes" role="radiogroup" aria-labelledby={`${group}-l`}>
              <p id={`${group}-l`} className="eyebrow">unbidden mode</p>
              <div className="modes__row">
                {MODES.map((x) => (
                  <button key={x.id} type="button" role="radio" aria-checked={mode === x.id} className={`modes__btn mono ${mode === x.id ? 'modes__btn--on' : ''}`} onClick={() => { if (x.id !== mode) { setWas(mode); setMode(x.id) } }}>
                    {x.id}
                  </button>
                ))}
              </div>
              <Term label="What `unbidden mode` prints" clock={false} fields={[`mode ${mode}`]} className="modes__term" footer={<Bar items={[<strong key="k" className={killed ? 'term__warn' : undefined}>{killed ? BAR.kill : `${'●'} agent`}</strong>, 'ollama ✓']} />}>
                <pre className="modes__out">
                  <span className="modes__prompt">$ </span>unbidden mode{'\n'}
                  <span className="modes__strong">{MODE_OUTPUT(mode, was)}</span>{'\n'}
                  {rows.map(([k, v]) => `  ${k.padEnd(24)} ${v ?? '—'}\n`).join('')}
                  <span className="modes__dim">{`  # ${m.readme}`}</span>{'\n\n'}
                  <span className="modes__prompt">$ </span>unbidden {killed ? 'resume' : 'kill'}{'\n'}
                  <span className={killed ? 'modes__dim' : 'modes__warn'}>{killed ? KILL.cli_off : KILL.cli_on}</span>
                </pre>
              </Term>
              <button type="button" className={`kill mono ${killed ? 'kill--on' : ''}`} aria-pressed={killed} onClick={() => setKilled((k) => !k)}>
                <span className="kill__label">{BAR.kill}</span>
                <span className="kill__text">{killed ? KILL.on : 'freeze everything now, in every process, until `unbidden resume`'}</span>
              </button>
            </div>

            <div className="mandate__rules">
              <p className="eyebrow">In every mode</p>
              <ul className="mandate__list">
                {EVERY_MODE.map((r) => <li key={r} className="mono">{r}</li>)}
              </ul>
              <p className="mandate__perm mono">{PERMISSIONS.join(' · ')}</p>
              <p className="mandate__foot">Each permission is <code>allow</code>, <code>require_approval</code> or <code>deny</code>. Values shown above are the ones <a href={LINKS.readme} rel="noopener">README</a> and <a href={`${LINKS.repo}/blob/main/docs/RELEASE.md`} rel="noopener">RELEASE.md</a> state for each mode; a dash means the documentation does not fix it.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
