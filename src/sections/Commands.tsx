import { useState, type CSSProperties } from 'react'
import { COMMAND_GROUPS, DOCTOR, HELP, KEYS, PROMPT_PLACEHOLDER, SLASH } from '../content/console'
import { useReveal } from '../hooks/useReveal'
import { Eyebrow } from '../console/Eyebrow'
import { Bar, Term } from '../console/Term'
import { Typewriter } from '../console/Typewriter'
import './Commands.css'

const ALL = 'all'

/** 04 — the CLI: every command of `--help`, grouped by what a person is doing, and `doctor` as it ran on a real machine. */
export function Commands({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>(0.08)
  const [group, setGroup] = useState(COMMAND_GROUPS[0].id)
  const selected = COMMAND_GROUPS.find((g) => g.id === group)
  const rows = selected ? selected.names.map((n) => HELP.commands.find(([name]) => name === n)!) : HELP.commands
  return (
    <section id={id} className="section commands" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <Eyebrow n="04">The command line</Eyebrow>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">Forty-five commands. Each one says what it does.</h2>
          <p className="lede reveal" data-delay="2">The CLI is the product. Its help text is written in the same voice as its feed: what happened, what it means, the one command that changes it.</p>
        </header>

        <div className="commands__grid reveal">
          <div className="commands__main">
            <div className="tabs" role="tablist" aria-label="Commands by what you are doing">
              {[...COMMAND_GROUPS.map((g) => ({ id: g.id, label: g.label })), { id: ALL, label: `All ${HELP.commands.length}` }].map((g) => (
                <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={`tab ${group === g.id ? 'tab--on' : ''}`} onClick={() => setGroup(g.id)}>{g.label}</button>
              ))}
            </div>
            <Term label="unbidden --help" fields={['--help', selected?.label ?? 'all commands']} clock={false} className="commands__help">
              <Typewriter command="unbidden --help">
                <ol key={group} className="help__list" aria-label="Commands">
                  {rows.map(([name, help], i) => (
                    <li key={name} className="help__row" style={{ '--i': Math.min(i, 12) } as CSSProperties}>
                      <span className="help__name">{name}</span>
                      <span className="help__text">{help}</span>
                    </li>
                  ))}
                </ol>
              </Typewriter>
            </Term>
          </div>

          <Term label="unbidden doctor, as recorded on a real machine" fields={['doctor']} version="walk 0.9.0" clock={false} className="commands__doctor" footer={<Bar items={[<strong key="n">{DOCTOR.note}</strong>]} />}>
            <Typewriter command={DOCTOR.command}>
              <p className="doctor__head">{DOCTOR.head}</p>
              {DOCTOR.rows.map((r, i) => (
                <p key={r.name} className="doctor__row" style={{ '--i': i + 1 } as CSSProperties}>
                  <span className={`doctor__mark doctor__mark--${r.mark === 'ok' ? 'ok' : 'opt'}`}>{r.mark}</span>
                  <span className="doctor__name">{r.name}</span>
                  <span className="doctor__detail">{r.detail}</span>
                </p>
              ))}
            </Typewriter>
          </Term>
        </div>

        <details className="fold reveal">
          <summary className="fold__sum"><span>Inside the app: {SLASH.length} slash commands</span><span className="fold__hint mono">/</span></summary>
          <div className="fold__body slash">
            <div className="slash__prompt mono" aria-hidden="true"><span className="slash__gt">&gt; </span><span className="slash__ph">{PROMPT_PLACEHOLDER}</span><span className="caret" /></div>
            <ul className="slash__list">
              {SLASH.map(([cmd, help]) => (
                <li key={cmd} className="slash__item"><code className="slash__cmd">{cmd}</code><span className="slash__help">{help}</span></li>
              ))}
            </ul>
            <p className="slash__keys">{KEYS}</p>
          </div>
        </details>
      </div>
    </section>
  )
}
