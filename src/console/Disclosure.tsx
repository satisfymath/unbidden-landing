import type { ReactNode } from 'react'
import './Disclosure.css'

/** A row that opens: a native <details>, so it works without script and find-in-page reaches what is inside. */
export function Disclosure({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="more">
      <summary className="more__row">
        <span className="more__title">{title}</span>
        {hint ? <span className="more__hint">{hint}</span> : null}
        <i className="more__plus" aria-hidden="true" />
      </summary>
      <div className="more__body reveal">{children}</div>
    </details>
  )
}
