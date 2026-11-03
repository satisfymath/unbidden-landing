/** Pure scroll → film timeline mapping. No DOM. */
export interface Focal { x: number; y: number }
export interface ClipSource {
  desktop: string
  mobile: string
  /** optional HEVC (hvc1) variants, used where the browser reports it can play them */
  desktopHevc?: string
  mobileHevc?: string
  frames: number
  fps: number
}
export interface FilmClip {
  id: string            // 'clip-01'
  from: number          // keyframe number at start (1..8)
  to: number            // keyframe number at end
  weight: number        // scroll length in viewport heights
  linger: number        // 0..1, slows start/end so seam frames rest (0 for produced clips, see easeIn)
  /**
   * The generated clips settle to a near stop in their last second and the next one starts at full speed.
   * easeIn remaps local time t → (1−e)·t + e·t², so the start plays at (1−e)× speed and the end at (1+e)×,
   * which evens out the camera velocity across the seam. tailTrim drops the near-static last frames.
   */
  easeIn?: number
  tailTrim?: number
  src?: ClipSource      // undefined until the clip is produced → poster crossfade fallback
  focal: [Focal, Focal] // object-position (in %) at start and end, for portrait viewports
}
export interface FilmHold { id: string; kf: number; weight: number; focal: Focal }
export type FilmItem = ({ kind: 'clip' } & FilmClip) | ({ kind: 'hold' } & FilmHold)

export interface TimelineEntry { item: FilmItem; index: number; start: number; end: number }
export interface Timeline { entries: TimelineEntry[]; totalWeight: number }

export function buildTimeline(items: FilmItem[]): Timeline {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0)
  let acc = 0
  const entries = items.map((item, index) => {
    const start = acc / totalWeight
    acc += item.weight
    return { item, index, start, end: acc / totalWeight }
  })
  return { entries, totalWeight }
}

export interface Located { entry: TimelineEntry; localT: number }
/** Entry containing progress p (0..1). The last entry owns p = 1. */
export function locate(tl: Timeline, p: number): Located {
  const n = tl.entries.length
  for (let i = 0; i < n; i++) {
    const e = tl.entries[i]
    if (p < e.end || i === n - 1) {
      const span = e.end - e.start
      return { entry: e, localT: span > 0 ? Math.min(1, Math.max(0, (p - e.start) / span)) : 0 }
    }
  }
  return { entry: tl.entries[n - 1], localT: 1 }
}
/** Progress of an entry id, mapped from a local 0..1 span, to global progress. */
export function globalAt(tl: Timeline, id: string, local: number): number {
  const e = tl.entries.find((x) => x.item.id === id)
  if (!e) return 0
  return e.start + (e.end - e.start) * local
}
