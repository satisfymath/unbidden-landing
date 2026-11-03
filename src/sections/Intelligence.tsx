import { useMemo, useState, type CSSProperties } from 'react'
import { CYCLE_NODES, FEED, GLYPHS, TUI, type Verb } from '../content/console'
import { CYCLE, INTELLIGENCE, MODELS } from '../content/product'
import { useReveal } from '../hooks/useReveal'
import { Bar, Term } from '../console/Term'
import { LogStream } from '../console/LogStream'
import { useScramble } from '../console/useScramble'
import './Intelligence.css'

function box(label: string, job: string, w: number) {
  const pad = (s: string) => ` ${s}${' '.repeat(Math.max(0, w - s.length - 1))}`
  return { top: `┌${'─'.repeat(w)}┐`, mid: `│${pad(label)}│`, low: `│${pad(job)}│`, bot: `└${'─'.repeat(w)}┘` }
}

/** The cycle as a box-drawing diagram; the node whose verbs are active lights up with the feed. */
function CycleDiagram({ active }: { active: Verb | null }) {
  const w = 13
  const boxes = CYCLE_NODES.map((n) => box(n.label, n.job, w))
  const joint = '──▶'
  const tail = ' ──▶ operate (mandate only)'
  const rows = (['top', 'mid', 'low', 'bot'] as const).map((k, ri) => (
    <span key={k} className="cycle__row">
      {boxes.map((b, i) => {
        const on = active !== null && (CYCLE_NODES[i].verbs as readonly Verb[]).includes(active)
        return (
          <span key={i} className={`cycle__node ${on ? 'cycle__node--on' : ''}`}>
            {b[k]}
            {i < boxes.length - 1 ? <span className="cycle__joint">{ri === 1 ? joint : '   '}</span> : ri === 1 ? <span className="cycle__tail">{tail}</span> : null}
          </span>
        )
      })}
      {'\n'}
    </span>
  ))
  return <pre className="cycle__diagram" role="img" aria-label="The cycle: observe, investigate, experiment, prove, propose, and operate only under a mandate.">{rows}</pre>
}

/** Warp-style status cells: one row per stage, filled as the replay advances. */
function GlyphGrid({ progress }: { progress: Record<string, number> }) {
  return (
    <div className="glyphs" aria-hidden="true">
      {CYCLE_NODES.map((n) => {
        const p = progress[n.label] ?? 0
        const cells = Array.from({ length: 12 }, (_, i) => { const t = i / 12; return t < p - 0.08 ? GLYPHS.done : t < p ? GLYPHS.full : t < p + 0.08 && p > 0 ? GLYPHS.half : GLYPHS.empty })
        return <span key={n.label} className="glyphs__row"><span className="glyphs__label">{n.label.toLowerCase()}</span><span className="glyphs__cells">{cells.join('')}</span></span>
      })}
    </div>
  )
}

/** Act II — the feed: where things stand, as the agent itself reports it. */
export function Intelligence({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  const h2 = useScramble<HTMLHeadingElement>()
  const [active, setActive] = useState<Verb | null>(null)
  const [count, setCount] = useState({ i: 0, total: 0 })
  const total = useMemo(() => FEED.groups.reduce((s, g) => s + g.lines.length, 0), [])
  const perVerb = useMemo(() => {
    const m: Record<string, number> = {}
    FEED.groups.forEach((g) => { m[g.verb] = (m[g.verb] ?? 0) + g.lines.length })
    return m
  }, [])
  // progress per stage: how many of that stage's lines have been shown
  const progress = useMemo(() => {
    const shownByVerb: Record<string, number> = {}
    let left = count.i + (count.total ? 1 : 0)
    for (const g of FEED.groups) { const take = Math.max(0, Math.min(g.lines.length, left)); shownByVerb[g.verb] = (shownByVerb[g.verb] ?? 0) + take; left -= take }
    const out: Record<string, number> = {}
    for (const n of CYCLE_NODES) {
      const vs = n.verbs as readonly Verb[]
      const have = vs.reduce((s, v) => s + (perVerb[v] ?? 0), 0)
      const got = vs.reduce((s, v) => s + (shownByVerb[v] ?? 0), 0)
      out[n.label] = have ? got / have : 0
    }
    return out
  }, [count, perVerb])

  return (
    <section id={id} className="section intelligence" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head">
          <p className="eyebrow reveal">Where things stand.</p>
          <h2 id={`${id}-title`} className="h2 reveal" data-delay="1" ref={h2}>{INTELLIGENCE.title}</h2>
          <p className="lede reveal" data-delay="2">{INTELLIGENCE.lede}</p>
        </header>

        <div className="feedgrid reveal">
          <Term
            label="The agent's feed, one real cycle"
            fields={[FEED.workspace, `head ${FEED.head}`]}
            className="feedgrid__term"
            footer={<Bar items={[<strong key="a">{'●'} agent</strong>, 'ollama ✓', `The last ${Math.min(count.i + 1, total)} things it did.`]} />}
          >
            <LogStream groups={FEED.groups} onVerb={(v, i, t) => { setActive(v); setCount({ i, total: t }) }} />
          </Term>
          <aside className="feedgrid__side">
            <GlyphGrid progress={progress} />
            <p className="feedgrid__note">{FEED.note}</p>
            <p className="feedgrid__note mono">src: {FEED.source}</p>
          </aside>
        </div>

        <div className="cycle reveal">
          <CycleDiagram active={active} />
          <ol className="cycle__steps" aria-label="The cycle">
            {CYCLE.map((s, i) => {
              const node = CYCLE_NODES[Math.min(i, CYCLE_NODES.length - 1)]
              const on = !s.dim && active !== null && (node.verbs as readonly Verb[]).includes(active)
              return (
                <li key={s.label} className={`cycle__step ${s.dim ? 'cycle__step--dim' : ''} ${on ? 'cycle__step--on' : ''}`} style={{ '--i': i } as CSSProperties}>
                  <span className="cycle__index mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cycle__label mono">{s.label}</span>
                  <p className="cycle__body">{s.body}</p>
                  <span className="cycle__ref mono">{s.ref}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="models reveal">
          <p className="eyebrow">{MODELS.eyebrow}</p>
          <div className="models__grid">
            {MODELS.items.map((m) => (
              <div key={m.name} className="models__item">
                <h3 className="models__name">{m.name} <span className="mono models__where">{m.where}</span></h3>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          <p className="models__rule"><span className="mono">{MODELS.labels}</span>{MODELS.rule}</p>
          <p className="models__mark mono" aria-hidden="true">{TUI.MARK} A model is never the control. Code decides what leaves.</p>
        </div>
      </div>
    </section>
  )
}
