import { useState } from 'react'
import { INSTALL, LINKS } from '../content/product'
import { TAGLINE, WORDMARK } from '../content/film'
import { useReveal } from '../hooks/useReveal'
import { Logo, Wordmark } from '../ui/Logo'
import './Invitation.css'

/** Act IV — THE INVITATION: the tagline, the real installer, and the repository. */
export function Invitation({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const copy = async () => {
    try { await navigator.clipboard.writeText(INSTALL.command); setCopied('ok') } catch { setCopied('fail') }
    window.setTimeout(() => setCopied('idle'), 2200)
  }
  return (
    <section id={id} className="section invitation" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container invitation__grid">
        <div className="invitation__brand reveal" aria-hidden="true">
          <Logo size={28} />
          <Wordmark text={WORDMARK} />
        </div>
        <h2 id={`${id}-title`} className="display invitation__title reveal" data-delay="1">{TAGLINE}</h2>
        <p className="lede reveal" data-delay="2">{INSTALL.lede}</p>

        <div className="install reveal" data-delay="2">
          <p className="eyebrow">{INSTALL.eyebrow}</p>
          <div className="install__row">
            <pre className="install__cmd"><code>{INSTALL.command}</code></pre>
            <button type="button" className="btn btn--primary" onClick={copy} aria-live="polite">
              {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Select and copy' : 'Copy command'}
            </button>
          </div>
          <ul className="install__notes">
            {INSTALL.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <div className="install__alt">
            <a className="btn btn--secondary" href={LINKS.repo} rel="noopener">Source on GitHub</a>
            <a className="btn btn--secondary" href={LINKS.install} rel="noopener">Install guide</a>
            <a className="btn btn--secondary" href={LINKS.evidence} rel="noopener">Read the evidence</a>
          </div>
        </div>
      </div>
    </section>
  )
}
