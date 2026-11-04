import { useEffect } from 'react'

const FAR = 2.5 // viewports

/**
 * In-page links smooth-scroll only over short distances. Across the film a native smooth scroll would seek through
 * every clip on the way, so a far jump crossfades instead (View Transitions where available, a plain jump otherwise).
 */
export function useAnchorJump() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]')
      const id = a?.getAttribute('href')?.slice(1)
      const el = id ? document.getElementById(id) : null
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      if (Math.abs(top - window.scrollY) < FAR * window.innerHeight) return
      e.preventDefault()
      const jump = () => {
        window.scrollTo({ top, behavior: 'instant' })
        history.pushState(null, '', `#${id}`)
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!reduced && document.startViewTransition) document.startViewTransition(jump)
      else jump()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}
