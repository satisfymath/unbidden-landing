/**
 * The UNBIDDEN mark, measured from the official logotype (brand/unbidden-logo-official.png):
 * ring radius R, stroke 0.055 R with round caps, gap centred at 45° spanning 39.5°–50.5°, and the dot
 * (r = 0.122 R) outside the gap at 47°, 1.263 R from the centre. The wordmark is the official artwork
 * (public/media/brand/wordmark-white.png), with the text kept for assistive technology.
 */
export function Logo({ size = 24, title, className }: { size?: number; title?: string; className?: string }) {
  // the measured stroke is 0.055 R; below ~40 px it thins out on screen, so small marks use a heavier hairline
  const sw = size < 40 ? 3.6 : size < 96 ? 2.6 : 2
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      style={{ flex: 'none' }}
    >
      <path d="M 71.8 27.3 A 36 36 0 1 1 66.9 21.6" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      <circle cx="75" cy="16.7" r={size < 40 ? 5.2 : 4.4} fill="currentColor" />
    </svg>
  )
}

/** Display version: the same geometry; the stroke stays at the measured 0.055 R at any size. */
export function LogoDisplay({ size = 160, className }: { size?: number; className?: string }) {
  return <Logo size={size} className={className} />
}

/** The official wordmark artwork; `height` in px. The text node is for screen readers and copy. */
export function Wordmark({ text = 'UNBiDDEN', height = 12, className }: { text?: string; height?: number; className?: string }) {
  return (
    <span className={`wordmark ${className ?? ''}`.trim()} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img src="./media/brand/wordmark-white.png" alt="" aria-hidden="true" style={{ height, width: 'auto', display: 'block' }} decoding="async" />
      <span className="sr-only">{text}</span>
    </span>
  )
}
