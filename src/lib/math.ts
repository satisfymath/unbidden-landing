export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const clamp01 = (v: number) => clamp(v, 0, 1)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** smoothstep 0..1 */
export const smooth = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x) }
/** Monotone remap that slows the start and end of a segment (keeps seam frames still). L in 0..1. */
export const linger = (x: number, L: number) => { const l = clamp01(L); const c = x - 0.5; return (1 - l) * x + l * (4 * c * c * c + 0.5) }
/** opacity window: ramps in over `edge`, holds, ramps out over `edge`, inside [a, b] */
export const window01 = (t: number, a: number, b: number, edge: number) => {
  if (t <= a || t >= b) return 0
  const inT = (t - a) / edge, outT = (b - t) / edge
  return smooth(Math.min(1, inT, outT))
}
