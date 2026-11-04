import { useState, type CSSProperties } from 'react'
import { INSTALL_LINE, THEN, VERSION_LINE } from '../content/console'
import { INSTALL, LINKS } from '../content/product'
import { TAGLINE } from '../content/film'
import { useReveal } from '../hooks/useReveal'
import { AsciiPlanet } from '../console/AsciiLive'
import { Term } from '../console/Term'
import { Typewriter } from '../console/Typewriter'
import './Invitation.css'

/** 05 — install: the planet in glyphs, the tagline, the real installer, and the repository. */
export function Invitation({ id }: { id: string }) {
  const ref = useReveal<HTMLElement>()
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const copy = async () => {
    try { await navigator.clipboard.writeText(INSTALL_LINE); setCopied('ok') } catch { setCopied('fail') }
    window.setTimeout(() => setCopied('idle'), 2200)
  }
  return (
    <section id={id} className="section invitation" ref={ref} aria-labelledby={`${id}-title`}>
      <div className="container invitation__in">
        <div className="invitation__planet reveal"><AsciiPlanet className="invitation__canvas" /></div>
        <h2 id={`${id}-title`} className="h2 invitation__title reveal">{TAGLINE}</h2>
        <p className="lede invitation__lede reveal" data-delay="1">{INSTALL.lede}</p>

        <div className="install__row reveal" data-delay="2">
          <button type="button" className={`btn btn--primary install__copy ${copied === 'ok' ? 'is-ok' : ''}`} onClick={copy} aria-live="polite">
            {copied === 'ok' ? '✓ Copied' : copied === 'fail' ? 'Select and copy' : 'Copy the install command'}
          </button>
          <a className="btn btn--secondary" href={LINKS.repo} rel="noopener">Source on GitHub</a>
          <a className="btn btn--secondary" href={LINKS.install} rel="noopener">Install guide</a>
        </div>

        <div className="install reveal">
          <Term label="Install" fields={['install']} clock={false} className="install__term">
            <Typewriter command={INSTALL_LINE} speed={38}>
              {THEN.map(([cmd, c], i) => (
                <p key={cmd} className="install__then" style={{ '--i': i + 1 } as CSSProperties}><span className="install__cmd">{cmd}</span><span className="install__c">{c}</span></p>
              ))}
              <p className="install__then" style={{ '--i': THEN.length + 1 } as CSSProperties}><span className="install__cmd">{VERSION_LINE[0]}</span><span className="install__c">{VERSION_LINE[1]}</span></p>
            </Typewriter>
          </Term>
          <ul className="install__notes">
            {INSTALL.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}
