import { FOOTER, LINKS } from '../content/product'
import { WORDMARK } from '../content/film'
import { Logo, Wordmark } from '../ui/Logo'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer" aria-label="Footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo size={18} />
          <Wordmark text={WORDMARK} className="footer__word" />
          <span className="mono footer__version">{FOOTER.version}</span>
        </div>
        <ul className="footer__links">
          <li><a href={LINKS.repo} rel="noopener">GitHub</a></li>
          <li><a href={LINKS.architecture} rel="noopener">Architecture</a></li>
          <li><a href={LINKS.evidence} rel="noopener">Evidence</a></li>
          <li><a href={LINKS.install} rel="noopener">Install</a></li>
          <li><a href={LINKS.license} rel="noopener">License</a></li>
        </ul>
        <p className="footer__credit">{FOOTER.credit}</p>
      </div>
    </footer>
  )
}
