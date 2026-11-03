import { useEffect, useRef, type RefObject } from 'react'

/** Adds .is-in once to every .reveal inside the ref'd element when it enters the viewport. */
export function useReveal<T extends HTMLElement>(threshold = 0.15): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'))
    if (items.length === 0) return
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-in'); io.unobserve(e.target) }
    }, { threshold, rootMargin: '0px 0px -8% 0px' })
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [threshold])
  return ref
}
