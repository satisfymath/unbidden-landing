import { useEffect, useRef, useState } from 'react'
import { LINKS } from '../content/product'
import { WORDMARK } from '../content/film'
import { prefersReducedMotion } from '../lib/device'
import { Logo, Wordmark } from '../ui/Logo'
import './Nav.css'

const ITEMS = [
  { id: 'how', label: 'How it works' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'control', label: 'Control' },
  { id: 'cli', label: 'CLI' },
]

/**
 * A floating glass capsule. It waits for the opening to finish, steps aside while the film plays forward and comes
 * back when the reader scrolls up. A pill slides to the section in view; a hairline shows how far the page has gone.
 */
export function Nav() {
  const ref = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const pillRef = useRef<HTMLLIElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [away, setAway] = useState(false)
  const [ready, setReady] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (ready) return
    const t = window.setTimeout(() => setReady(true), window.scrollY > 40 ? 0 : 2900)
    return () => window.clearTimeout(t)
  }, [ready])

  useEffect(() => {
    let raf = 0, lastY = window.scrollY
    const update = () => {
      raf = 0
      const y = window.scrollY, doc = document.documentElement
      ref.current?.style.setProperty('--progress', (y / Math.max(1, doc.scrollHeight - window.innerHeight)).toFixed(4))
      const line = window.innerHeight * 0.35
      let cur: string | null = null
      for (const { id } of [...ITEMS, { id: 'install' }]) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) cur = id
      }
      setActive(cur)
      const first = document.getElementById(ITEMS[0].id)
      const inFilm = first ? first.getBoundingClientRect().top > 80 : false
      if (Math.abs(y - lastY) > 6) {
        setAway(inFilm && y > lastY && y > window.innerHeight * 0.1)
        lastY = y
      }
      if (!inFilm) setAway(false)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on, { passive: true })
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])

  // the pill slides to whichever link is current
  useEffect(() => {
    const pill = pillRef.current, list = listRef.current
    if (!pill || !list) return
    const place = () => {
      const a = list.querySelector<HTMLElement>('a[aria-current]')
      if (!a) { pill.style.opacity = '0'; return }
      pill.style.opacity = '1'
      pill.style.width = `${a.offsetWidth}px`
      pill.style.transform = `translateX(${(a.parentElement as HTMLElement).offsetLeft}px)`
    }
    place()
    window.addEventListener('resize', place, { passive: true })
    return () => window.removeEventListener('resize', place)
  }, [active])

  const close = () => setOpen(false)
  return (
    <nav className="nav" ref={ref} data-open={open || undefined} data-away={(away && !open) || undefined} data-ready={ready || undefined} aria-label="Primary">
      <a className="nav__brand" href="#film" aria-label="UNBIDDEN, back to top" onClick={close}>
        <Logo size={18} />
        <Wordmark text={WORDMARK} height={9} className="nav__word" />
      </a>
      <ul className="nav__links" id="nav-links" ref={listRef}>
        <li className="nav__pill" ref={pillRef} aria-hidden="true" />
        {ITEMS.map((it) => (
          <li key={it.id}><a href={`#${it.id}`} aria-current={active === it.id ? 'true' : undefined} onClick={close}>{it.label}</a></li>
        ))}
        <li><a href={LINKS.repo} rel="noopener">GitHub</a></li>
      </ul>
      <div className="nav__end">
        <a className="btn btn--primary btn--sm" href="#install" onClick={close}>Install</a>
        <button type="button" className="nav__toggle" aria-expanded={open} aria-controls="nav-links" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          <i /><i />
        </button>
      </div>
      <span className="nav__progress" aria-hidden="true" />
    </nav>
  )
}
