import { useSyncExternalStore } from 'react'
import { LINKS } from '../content/product'
import { WORDMARK } from '../content/film'
import { Logo, Wordmark } from '../ui/Logo'
import './Nav.css'

function subscribe(cb: () => void) {
  window.addEventListener('scroll', cb, { passive: true })
  window.addEventListener('resize', cb, { passive: true })
  return () => { window.removeEventListener('scroll', cb); window.removeEventListener('resize', cb) }
}

/** Minimal fixed navigation: faint over the film, solid once the editorial part (the sentinel) reaches the top. */
export function Nav({ sentinelId }: { sentinelId: string }) {
  const solid = useSyncExternalStore(
    subscribe,
    () => { const el = document.getElementById(sentinelId); return el ? el.getBoundingClientRect().top <= 80 : true },
    () => false,
  )
  return (
    <nav className="nav" data-solid={solid || undefined} aria-label="Primary">
      <a className="nav__brand" href="#film" aria-label="UNBIDDEN, back to top">
        <Logo size={20} />
        <Wordmark text={WORDMARK} className="nav__word" />
      </a>
      <ul className="nav__links">
        <li><a href="#intelligence">Intelligence</a></li>
        <li><a href="#evidence">Evidence</a></li>
        <li><a href={LINKS.repo} rel="noopener">GitHub</a></li>
        <li><a className="btn btn--primary btn--sm" href="#install">Install</a></li>
      </ul>
    </nav>
  )
}
