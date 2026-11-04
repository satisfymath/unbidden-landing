import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/device'
import { clamp01 } from '../lib/math'

/** A paragraph whose words light up one by one as it travels through the viewport. The text is whole in the DOM. */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const words = Array.from(el.querySelectorAll<HTMLElement>('span'))
    let raf = 0
    const update = () => {
      raf = 0
      const b = el.getBoundingClientRect(), vh = window.innerHeight
      if (b.bottom < -vh || b.top > vh * 2) return
      const p = clamp01((vh * 0.82 - b.top) / (b.height + vh * 0.32))
      words.forEach((w, i) => {
        const o = 0.16 + 0.84 * clamp01((p * (words.length + 6) - i) / 6)
        w.style.opacity = o.toFixed(3)
      })
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on, { passive: true })
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])
  return (
    <p ref={ref} className={className}>
      {text.split(' ').map((w, i) => <span key={i}>{w} </span>)}
    </p>
  )
}
