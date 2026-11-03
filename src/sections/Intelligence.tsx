import { CONTROL, CYCLE, INTELLIGENCE, MODELS } from '../content/product'
import { useReveal } from '../hooks/useReveal'
import './Intelligence.css'

/** Act II — THE INTELLIGENCE: what the agent does, its cycle, and who stays in control. */
export function Intelligence({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  return (
    <section id={id} className="section intelligence" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <p className="eyebrow reveal">{INTELLIGENCE.eyebrow}</p>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1">{INTELLIGENCE.title}</h2>
          <p className="lede reveal" data-delay="2">{INTELLIGENCE.lede}</p>
        </header>

        <ol className="cycle" aria-label="The cycle">
          {CYCLE.map((s, i) => (
            <li key={s.label} className={`cycle__step reveal ${s.dim ? 'cycle__step--dim' : ''}`} data-delay={String(Math.min(3, i % 4))}>
              <span className="cycle__index mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="cycle__label mono">{s.label}</span>
              <p className="cycle__body">{s.body}</p>
              <span className="cycle__ref mono">{s.ref}</span>
            </li>
          ))}
        </ol>

        <div className="control">
          <div className="control__text">
            <p className="eyebrow reveal">{CONTROL.eyebrow}</p>
            <h3 className="control__title reveal" data-delay="1">{CONTROL.title}</h3>
            <p className="control__lede reveal" data-delay="2">{CONTROL.lede}</p>
            <dl className="modes reveal" data-delay="2">
              {CONTROL.modes.map((m) => (
                <div key={m.name} className="modes__row">
                  <dt className="mono">{m.name}</dt>
                  <dd>{m.body}</dd>
                </div>
              ))}
            </dl>
            <p className="control__note reveal" data-delay="3">{CONTROL.note}</p>
          </div>
          <figure className="cli reveal" data-delay="1">
            <figcaption className="cli__bar"><span className="mono">unbidden 0.12.2</span></figcaption>
            <pre className="cli__pre" aria-label="Real commands of the unbidden CLI"><code>{CONTROL.cli.map((l) => `${l.cmd.padEnd(26)}${l.help}`).join('\n')}</code></pre>
          </figure>
        </div>

        <div className="models">
          <p className="eyebrow reveal">{MODELS.eyebrow}</p>
          <div className="models__grid">
            {MODELS.items.map((m, i) => (
              <div key={m.name} className="models__item reveal" data-delay={String(i + 1)}>
                <h3 className="models__name">{m.name} <span className="mono models__where">{m.where}</span></h3>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          <p className="models__rule reveal" data-delay="3"><span className="mono">{MODELS.labels}</span>{MODELS.rule}</p>
        </div>
      </div>
    </section>
  )
}
