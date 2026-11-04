import { useScramble } from './useScramble'

/** A section label that decodes from glyph noise the first time it is seen. */
export function Eyebrow({ n, children, className }: { n?: string; children: string; className?: string }) {
  const ref = useScramble<HTMLSpanElement>()
  return (
    <p className={`eyebrow ${className ?? ''}`.trim()}>
      {n ? <span className="eyebrow__n">{n}</span> : null}
      <span ref={ref}>{children}</span>
    </p>
  )
}
