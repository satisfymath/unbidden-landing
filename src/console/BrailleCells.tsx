/** Dots of a braille cell, in the order of the Unicode bits: [column, row]. */
const DOTS = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]] as const
const RUN = /[⠀-⣿]+/g

/**
 * Braille drawn dot by dot, one terminal cell per character. A font will not do: Menlo paints the unset dots too, so
 * the product's ring turned into a block of dots where a terminal shows only the ones that are set.
 */
function BrailleCells({ text }: { text: string }) {
  const cells = [...text]
  return (
    <svg className="brl" viewBox={`0 0 ${cells.length * 2} 4`} preserveAspectRatio="none" style={{ width: `${cells.length}ch` }} aria-hidden="true">
      {cells.flatMap((c, i) => {
        const bits = c.codePointAt(0)! - 0x2800
        return DOTS.flatMap(([x, y], b) => (bits & (1 << b) ? [<circle key={`${i}-${b}`} cx={i * 2 + x + 0.5} cy={y + 0.5} r={0.36} />] : []))
      })}
    </svg>
  )
}

/** A line of text with its braille runs drawn, everything else left to the font. */
export function BrailleText({ text }: { text: string }) {
  const out: (string | React.JSX.Element)[] = []
  let at = 0
  for (const m of text.matchAll(RUN)) {
    if (m.index > at) out.push(text.slice(at, m.index))
    out.push(<BrailleCells key={m.index} text={m[0]} />)
    at = m.index + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}
