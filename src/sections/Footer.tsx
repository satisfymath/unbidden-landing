import { FOOTER, LINKS } from '../content/product'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer" aria-label="Footer">
      <div className="container footer__grid">
        <span className="mono footer__version">{FOOTER.version}</span>
        <ul className="footer__links">
          <li><a href={LINKS.repo} rel="noopener">GitHub</a></li>
          <li><a href={LINKS.architecture} rel="noopener">Architecture</a></li>
          <li><a href={LINKS.evidence} rel="noopener">Evidence</a></li>
          <li><a href={LINKS.install} rel="noopener">Install</a></li>
          <li><a href={LINKS.license} rel="noopener">License</a></li>
        </ul>
        <p className="footer__credit">{FOOTER.credit}</p>
      </div>
      <div className="footer__word" aria-hidden="true"><img src="./media/brand/wordmark-white.png" width={761} height={80} alt="" decoding="async" /></div>
    </footer>
  )
}
