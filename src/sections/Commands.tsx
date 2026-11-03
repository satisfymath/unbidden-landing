import { useState, type CSSProperties } from 'react'
import { DOCTOR, HELP, HOME, KEYS, PROMPT_PLACEHOLDER, SLASH } from '../content/console'
import { useReveal } from '../hooks/useReveal'
import { Bar, Term } from '../console/Term'
import { Typewriter } from '../console/Typewriter'
import './Commands.css'

/** Act II-c — the whole CLI, as `--help` prints it, and `doctor` as it ran on this machine. */
export function Commands({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  const [hover, setHover] = useState<string | null>(null)
  const width = Math.max(...HELP.commands.map(([n]) => n.length)) + 2
  return (
    <section id={id} className="section commands" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <p className="eyebrow reveal">The command line</p>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">Forty-three commands. Each one says what it does.</h2>
          <p className="lede reveal" data-delay="2">The CLI is the product. Its help text is written in the same voice as its feed: what happened, what it means, the one command that changes it.</p>
        </header>

        <div className="commands__grid reveal">
          <Term label="unbidden --help" fields={['--help']} className="commands__help">
            <Typewriter command="unbidden --help">
              <pre className="help__usage">{HELP.usage}{'\n\n'}{HELP.description}{'\n\n'}options:{'\n'}{HELP.options.map(([f, h]) => `  ${f.padEnd(12)}${h}`).join('\n')}{'\n\n'}commands:</pre>
              <ol className="help__list" aria-label="Commands">
                {HELP.commands.map(([name, help], i) => (
                  <li key={name} className={`help__row ${hover === name ? 'help__row--on' : ''}`} style={{ '--i': Math.min(i, 24) } as CSSProperties} onMouseEnter={() => setHover(name)} onMouseLeave={() => setHover(null)}>
                    <span className="help__caret" aria-hidden="true">{hover === name ? '›' : ' '}</span>
                    <span className="help__name">{name.padEnd(width)}</span>
                    <span className="help__text">{help}</span>
                  </li>
                ))}
              </ol>
            </Typewriter>
          </Term>

          <div className="commands__side">
            <Term label="unbidden doctor, as recorded on this machine" fields={['doctor']} clock={false} footer={<Bar items={[<strong key="n">{DOCTOR.note}</strong>]} />}>
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

            <Term label="unbidden with no command: the home screen" fields={['home']} clock={false}>
              <Typewriter command="unbidden --plain">
                {HOME.map((l, i) => <p key={l} className={`home__line ${i === HOME.length - 1 ? 'home__next' : ''}`} style={{ '--i': i + 1 } as CSSProperties}>{l}</p>)}
              </Typewriter>
            </Term>
          </div>
        </div>

        <div className="slash reveal">
          <p className="eyebrow">Inside the app</p>
          <div className="slash__prompt mono" aria-hidden="true"><span className="slash__gt">&gt; </span><span className="slash__ph">{PROMPT_PLACEHOLDER}</span><span className="caret" /></div>
          <ul className="slash__list">
            {SLASH.map(([cmd, help]) => (
              <li key={cmd} className="slash__item"><code className="slash__cmd">{cmd}</code><span className="slash__help">{help}</span></li>
            ))}
          </ul>
          <p className="slash__keys mono">{KEYS}</p>
        </div>
      </div>
    </section>
  )
}
