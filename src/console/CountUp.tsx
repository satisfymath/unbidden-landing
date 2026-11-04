import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props { value: number; decimals?: number; duration?: number; prefix?: string; suffix?: string; className?: string; format?: (n: number) => string }

/** Counts up to a real value once on screen. The final value is what screen readers get; the ticking is decorative. */
export function CountUp({ value, decimals = 1, duration = 1100, prefix = '', suffix = '', className, format }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [vState, setV] = useState(0)
  const v = reduced ? value : vState
  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const run = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration)
        const e = 1 - Math.pow(1 - p, 3)
        setV(value * e)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (!('IntersectionObserver' in window)) { run(); return }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { run(); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value, duration, reduced])
  const show = (n: number) => (format ? format(n) : n.toFixed(decimals))
  const text = `${prefix}${show(value)}${suffix}`
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="tnum">{prefix}{show(v)}{suffix}</span>
    </span>
  )
}
