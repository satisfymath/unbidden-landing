import { useEffect, useMemo, useRef, useState } from 'react'
import { SPINNER, type FeedGroup, type Verb } from '../content/console'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props {
  groups: FeedGroup[]
  /** ms between lines once the panel is in view */
  pace?: number
  onVerb?: (verb: Verb | null, index: number, total: number) => void
  /** start the replay when this becomes true (defaults to intersection) */
  autostart?: boolean
}

/**
 * Replays a feed the way the TUI prints it (widgets.py:72-101): a `> Verb.` heading when the verb changes,
 * then `  HH:MM:SS  text` lines. Lines appear one by one once the stream is on screen; the newest line carries
 * the spinner. Under reduced motion everything is shown at once.
 */
export function LogStream({ groups, pace = 420, onVerb, autostart }: Props) {
  const reduced = useReducedMotion()
  const flat = useMemo(() => groups.flatMap((g, gi) => g.lines.map((l, li) => ({ ...l, verb: g.verb, gi, first: li === 0 }))), [groups])
  const total = flat.length
  const [shownState, setShown] = useState(0)
  const shown = reduced ? total : shownState
  const [frame, setFrame] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [go, setGo] = useState(Boolean(autostart))

  useEffect(() => {
    if (reduced || go) return
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setGo(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, go])

  useEffect(() => {
    if (reduced || !go || shown >= total) return
    const cur = flat[shown]
    const delay = cur.accent ? pace * 2.2 : cur.first ? pace * 1.4 : pace
    const t = window.setTimeout(() => setShown((n) => n + 1), delay)
    return () => window.clearTimeout(t)
  }, [go, shown, total, flat, pace, reduced])

  useEffect(() => {
    if (reduced || shown >= total) return
    const t = window.setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 80)
    return () => window.clearInterval(t)
  }, [reduced, shown, total])

  const onVerbRef = useRef(onVerb)
  useEffect(() => { onVerbRef.current = onVerb }, [onVerb])
  useEffect(() => {
    const i = Math.min(shown, total) - 1
    onVerbRef.current?.(i >= 0 ? flat[i].verb : null, Math.max(0, i), total)
  }, [shown, total, flat])

  const visible = flat.slice(0, shown)
  let lastVerb: Verb | null = null
  const rows: React.ReactNode[] = []
  visible.forEach((l, i) => {
    if (l.verb !== lastVerb) {
      rows.push(
        <p key={`v${i}`} className="feed__verb" style={{ '--i': 0 } as React.CSSProperties}>
          <span className="feed__gt">&gt; </span><span className={l.accent || i === shown - 1 ? 'feed__verb-on' : undefined}>{l.verb}.</span>
        </p>,
      )
      lastVerb = l.verb
    }
    rows.push(
      <p key={i} className={`feed__line ${l.accent ? 'feed__line--accent' : ''}`}>
        <span className="feed__t">{l.t}</span>
        <span className="feed__text">{l.text}</span>
        {l.detail ? <span className="feed__detail">{l.detail}</span> : null}
      </p>,
    )
  })
  return (
    <div ref={ref} className="feed" aria-live="off">
      {rows}
      {shown < total && !reduced ? <p className="feed__line feed__line--pending" aria-hidden="true"><span className="feed__t feed__spin">{go ? SPINNER[frame] : '--:--:--'}</span><span className="feed__text feed__dim">{go ? 'thinking…' : ''}</span></p> : null}
    </div>
  )
}
