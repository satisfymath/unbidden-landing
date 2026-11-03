import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/device'

const CHARS = '!<>-_\\/[]{}—=+*^?#________'

/**
 * Decode effect (after Justin Windle's TextScramble): the element's text resolves from glyph noise, once, when it
 * enters the viewport. The real text is in the DOM from the start (we only swap characters for ~700 ms).
 */
export function useScramble<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || prefersReducedMotion() || !('IntersectionObserver' in window)) return
    const final = el.textContent ?? ''
    let raf = 0
    const run = () => {
      const queue = Array.from(final).map((ch) => {
        const start = Math.floor(Math.random() * 18), end = start + 10 + Math.floor(Math.random() * 18)
        return { ch, start, end, c: '' }
      })
      let frame = 0
      const step = () => {
        let out = '', done = 0
        for (const q of queue) {
          if (frame >= q.end || q.ch === ' ' || q.ch === '\n') { done++; out += q.ch }
          else if (frame >= q.start) { if (!q.c || Math.random() < 0.28) q.c = CHARS[Math.floor(Math.random() * CHARS.length)]; out += q.c }
          else out += ' '
        }
        el.textContent = out
        if (done < queue.length) { frame++; raf = requestAnimationFrame(step) } else el.textContent = final
      }
      raf = requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = final }
  }, [enabled])
  return ref
}
