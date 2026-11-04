import { useMemo, useState, type CSSProperties } from 'react'
import { CYCLE_NODES, GLYPHS, type Verb } from '../content/console'
import { CYCLE, INTELLIGENCE } from '../content/product'
import { ROW_VERBS } from '../content/tui'
import { useReveal } from '../hooks/useReveal'
import { AppReplay } from '../console/AppReplay'
import { Eyebrow } from '../console/Eyebrow'
import { ScrubText } from '../console/ScrubText'
import './Intelligence.css'

/** The stage's replay progress, in the TUI's status cells. */
function Cells({ p }: { p: number }) {
  const cells = Array.from({ length: 10 }, (_, i) => { const t = i / 10; return t < p - 0.08 ? GLYPHS.done : t < p ? GLYPHS.full : t < p + 0.08 && p > 0 ? GLYPHS.half : GLYPHS.empty })
  return <span className="cycle__cells mono" aria-hidden="true">{cells.join('')}</span>
}

const TOTALS = (() => {
  const m: Record<string, number> = {}
  for (const v of ROW_VERBS) if (v) m[v] = (m[v] ?? 0) + 1
  return m
})()

/** 01 — how it works: the cycle, driven by the real app replaying a real chain. */
export function Intelligence({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  const [shown, setShown] = useState(-1)
  const active: Verb | null = shown >= 0 ? ROW_VERBS[shown] ?? null : null
  const progress = useMemo(() => {
    const seen: Record<string, number> = {}
    for (let i = 0; i <= shown && i < ROW_VERBS.length; i++) { const v = ROW_VERBS[i]; if (v) seen[v] = (seen[v] ?? 0) + 1 }
    const out: Record<string, number> = {}
    for (const n of CYCLE_NODES) {
      const vs = n.verbs as readonly Verb[]
      const have = vs.reduce((s, v) => s + (TOTALS[v] ?? 0), 0)
      const got = vs.reduce((s, v) => s + (seen[v] ?? 0), 0)
      out[n.label] = have ? got / have : 0
    }
    return out
  }, [shown])

  return (
    <section id={id} className="section intelligence" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="how__head">
          <Eyebrow n="01">How it works</Eyebrow>
          <h2 id={`${id}-title`} className="h2 how__title reveal">{INTELLIGENCE.title}</h2>
          <ScrubText className="how__statement" text={INTELLIGENCE.lede} />
        </header>

        <ol className="cycle__steps reveal" aria-label="The cycle">
          {CYCLE.map((s, i) => {
            const node = s.dim ? null : CYCLE_NODES[i]
            const on = node !== null && active !== null && (node.verbs as readonly Verb[]).includes(active)
            return (
              <li key={s.label} className={`cycle__step ${s.dim ? 'cycle__step--dim' : ''} ${on ? 'cycle__step--on' : ''}`} style={{ '--i': i } as CSSProperties}>
                <span className="cycle__index mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="cycle__label">{s.label}</h3>
                {node ? <Cells p={progress[node.label] ?? 0} /> : <span className="cycle__cells mono" aria-hidden="true">mandate only</span>}
                <p className="cycle__body">{s.body}</p>
                <span className="cycle__ref mono">{s.ref}</span>
              </li>
            )
          })}
        </ol>

        <div className="how__app reveal">
          <div className="how__app-head">
            <Eyebrow>The app, recorded</Eyebrow>
            <h3 className="how__app-title">A vulnerability, found, proven, merged and deployed, in autonomous mode.</h3>
          </div>
          <AppReplay onShown={setShown} />
          <ul className="how__notes">
            <li><strong>This is the product talking.</strong> Every line comes from the real terminal app, 0.17.1, recorded on a copy of the fst repository; a few bookkeeping lines are left out.</li>
            <li><strong>It says what went wrong too.</strong> The second pull request went stale when the base branch moved, and the evidence must be measured again.</li>
            <li><strong>Read it at its level.</strong> A development repository with a lab: calibration, not evidence. Traffic is its own probes, not users. <a href="https://github.com/satisfymath/c13-fst/pull/4" rel="noopener">The pull request ↗</a></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
