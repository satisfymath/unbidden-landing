import { BRAILLE_DOT, BRAILLE_MARK } from '../content/console'

/** The official mark in braille cells; the dot's cells in the accent colour. Decorative (the text is elsewhere). */
export function BrailleMark({ className, fontSize }: { className?: string; fontSize?: string }) {
  return (
    <pre className={`braille ${className ?? ''}`.trim()} aria-hidden="true" style={fontSize ? { fontSize } : undefined}>
      {BRAILLE_MARK.map((raw, r) => {
        const row = raw.replace(/\u2800/g, ' ') // blank braille cells render as faint dots in some fonts
        const isDotRow = BRAILLE_DOT.rows.includes(r)
        const head = isDotRow ? row.slice(0, BRAILLE_DOT.fromCol) : row
        const tail = isDotRow ? row.slice(BRAILLE_DOT.fromCol) : ''
        return (
          <span key={r}>{head}{tail ? <span className="braille__dot">{tail}</span> : null}{'\n'}</span>
        )
      })}
    </pre>
  )
}
