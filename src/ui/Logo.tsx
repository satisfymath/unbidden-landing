/**
 * The UNBIDDEN mark as the repository defines it (frontend/public/unbidden.svg, unbidden/tui/brand.py):
 * an open ring, open at the upper right, with a separate dot outside the gap. Path copied verbatim.
 */
export function Logo({ size = 24, title, className }: { size?: number; title?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      style={{ flex: 'none' }}
    >
      <path d="M 17.6 6.6 A 8 8 0 1 0 19.6 15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="19.9" cy="8.6" r="1.9" fill="currentColor" />
    </svg>
  )
}

/** Display version of the mark for the film closing: thinner stroke at large sizes, as in frame 8. */
export function LogoDisplay({ size = 160, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={{ flex: 'none' }}>
      <path d="M 17.6 6.6 A 8 8 0 1 0 19.6 15" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="19.9" cy="8.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function Wordmark({ text = 'UNBiDDEN', className }: { text?: string; className?: string }) {
  return <span className={`wordmark ${className ?? ''}`.trim()}>{text}</span>
}
