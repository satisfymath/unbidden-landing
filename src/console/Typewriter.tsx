import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props {
  /** the command typed after the prompt */
  command: string
  prompt?: string
  /** printed as one staggered block once the command is complete */
  children?: ReactNode
  /** ms per character, with natural variation */
  speed?: number
  /** start immediately instead of on intersection */
  autostart?: boolean
  onDone?: () => void
}

/** Types the command only; the output appears as a block, as a real terminal would print it. */
export function Typewriter({ command, prompt = '$ ', children, speed = 46, autostart, onDone }: Props) {
  const reduced = useReducedMotion()
  const [typed, setN] = useState(0)
  const n = reduced ? command.length : typed
  const [go, setGo] = useState(Boolean(autostart))
  const ref = useRef<HTMLDivElement>(null)
  const done = n >= command.length

  useEffect(() => {
    if (reduced || go) return
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setGo(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect() } }, { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, go])

  useEffect(() => {
    if (reduced || !go || done) return
    const ch = command[n]
    const pause = ch === ' ' ? speed * 1.6 : ch === '|' || ch === '-' ? speed * 2.2 : speed * (0.7 + Math.random() * 0.8)
    const t = window.setTimeout(() => setN((k) => k + 1), pause)
    return () => window.clearTimeout(t)
  }, [go, n, done, command, speed, reduced])

  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])
  useEffect(() => { if (done) onDoneRef.current?.() }, [done])

  return (
    <div ref={ref} className="tw">
      <p className={`tw__cmd ${done ? '' : 'caret'}`}><span className="tw__prompt">{prompt}</span>{command.slice(0, n)}{done ? <span className="caret" /> : null}</p>
      {done && children ? <div className="tw__out stagger">{children}</div> : null}
    </div>
  )
}
