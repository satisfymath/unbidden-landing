import type { ReactNode } from 'react'
import { useClock } from './useClock'
import { TUI } from '../content/console'
import './Term.css'

interface TermProps {
  /** header fields after the mark and wordmark, joined with ' · ' as the TUI does (state.py:103, 133) */
  fields?: string[]
  version?: string
  clock?: boolean
  footer?: ReactNode
  children: ReactNode
  className?: string
  label: string
  id?: string
}

/** Terminal panel in the TUI's own chrome: header `○˙ UNBiDDEN  workspace · head · mode · …  version`, body, status bar. */
export function Term({ fields = [], version = TUI.VERSION, clock = true, footer, children, className, label, id }: TermProps) {
  const now = useClock(clock)
  return (
    <section className={`term ${className ?? ''}`.trim()} aria-label={label} id={id}>
      <header className="term__head">
        <span className="term__brand"><span className="term__mark">{TUI.MARK}</span> {TUI.WORDMARK}</span>
        {fields.length ? <span className="term__fields">{fields.join(' · ')}</span> : null}
        <span className="term__right">{clock ? <span className="term__clock tnum" aria-hidden="true">{now}</span> : null}<span className="term__version">{version}</span></span>
      </header>
      <div className="term__body">{children}</div>
      {footer ? <footer className="term__bar">{footer}</footer> : null}
      <span className="term__scan" aria-hidden="true" />
    </section>
  )
}

/** A status bar made of the TUI's own fields (text.py:21-31), joined with ' · '. */
export function Bar({ items }: { items: ReactNode[] }) {
  return (
    <>
      {items.map((it, i) => (
        <span key={i} className="term__bar-item">{i ? <span className="term__sep"> · </span> : null}{it}</span>
      ))}
    </>
  )
}
