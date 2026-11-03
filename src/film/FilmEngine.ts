/**
 * FilmEngine — scroll-scrubbed, chained video playback for the UNBIDDEN hero.
 *
 * Adapted from the scrub engine in oso95/scroll-world (references/scrub-engine.js),
 * MIT License, Copyright (c) 2026 cyw. Changes: sticky container instead of fixed layers,
 * frame-snapped seeks, time-based smoothing, requestVideoFrameCallback paint detection,
 * a bounded loading window with AbortController and unloading, poster crossfade fallback
 * while a segment is not produced or not loaded, and focal-point panning for portrait.
 */
import { buildTimeline, locate, type FilmClip, type FilmItem, type Focal, type Located, type Timeline } from './timeline'
import { clamp01, lerp, linger } from '../lib/math'

export interface EngineOptions {
  wrapper: HTMLElement
  stage: HTMLElement
  items: FilmItem[]
  mobile: boolean
  portrait: boolean
  onFrame?: (progress: number, located: Located) => void
}

type Status = 'idle' | 'loading' | 'ready' | 'error'
interface ClipState {
  clip: FilmClip
  el: HTMLElement
  video: HTMLVideoElement | null
  status: Status
  abort: AbortController | null
  url: string | null
  blob: Blob | null
  frames: number
  fps: number
  lastFrame: number
  pendingFrame: number
  wantFrame: number
  painted: boolean
  primed: boolean
  retries: number
  retryAt: number
}

/** HEVC (hvc1) playback: Safari, and Chromium builds with platform hardware decoding. Decided once. */
const canPlayHevc = (() => {
  if (typeof document === 'undefined') return false
  try { return document.createElement('video').canPlayType('video/mp4; codecs="hvc1.1.6.L120.B0"') === 'probably' } catch { return false }
})()

/** fraction of a clip's local progress used for the seam crossfade on each side (≈ 0.3 s of film at 5 s clips) */
const SEAM_FADE = 0.06

const vfc = (v: HTMLVideoElement): v is HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => number } =>
  'requestVideoFrameCallback' in v

export class FilmEngine {
  private readonly o: EngineOptions
  private readonly tl: Timeline
  private readonly posters = new Map<number, HTMLElement>()
  private readonly clips = new Map<string, ClipState>()
  private readonly clipOrder: string[] = []
  private target = 0
  private smooth = 0
  private prevTarget = 0
  private direction = 1
  private dirty = true
  private raf = 0
  private lastNow = 0
  private vh = 0
  private lastW = 0
  private userReady = false
  private destroyed = false
  private visibleSet = new Set<HTMLElement>()

  constructor(o: EngineOptions) {
    this.o = o
    this.tl = buildTimeline(o.items)
    for (const el of Array.from(o.stage.querySelectorAll<HTMLElement>('[data-kf]'))) this.posters.set(Number(el.dataset.kf), el)
    for (const item of o.items) {
      if (item.kind !== 'clip' || !item.src) continue
      const el = o.stage.querySelector<HTMLElement>(`[data-clip="${item.id}"]`)
      if (!el) continue
      this.clipOrder.push(item.id)
      this.clips.set(item.id, {
        clip: item, el, video: null, status: 'idle', abort: null, url: null, blob: null,
        frames: item.src.frames, fps: item.src.fps, lastFrame: -1, pendingFrame: -1, wantFrame: 0,
        painted: false, primed: false, retries: 0, retryAt: 0,
      })
    }
  }

  get timeline() { return this.tl }

  start() {
    this.vh = window.innerHeight
    this.lastW = window.innerWidth
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize, { passive: true })
    window.addEventListener('orientationchange', this.onResize)
    window.addEventListener('pointerdown', this.onGesture, { passive: true, once: true })
    window.addEventListener('touchstart', this.onGesture, { passive: true, once: true })
    document.addEventListener('visibilitychange', this.onVisibility)
    this.wake()
  }

  destroy() {
    this.destroyed = true
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('orientationchange', this.onResize)
    window.removeEventListener('pointerdown', this.onGesture)
    window.removeEventListener('touchstart', this.onGesture)
    document.removeEventListener('visibilitychange', this.onVisibility)
    if (this.raf) cancelAnimationFrame(this.raf)
    for (const cs of this.clips.values()) this.unload(cs, true)
  }

  private onScroll = () => this.wake()
  private onResize = () => {
    if (this.o.mobile && window.innerWidth === this.lastW) return // URL bar only
    this.lastW = window.innerWidth
    this.vh = window.innerHeight
    this.wake()
  }
  private onVisibility = () => { if (document.visibilityState === 'visible') this.wake() }
  private onGesture = () => {
    this.userReady = true
    for (const cs of this.clips.values()) if (cs.video && cs.status === 'ready') this.prime(cs)
  }

  private wake() {
    this.dirty = true
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(this.tick)
  }

  private read() {
    const r = this.o.wrapper.getBoundingClientRect()
    const travel = r.height - this.vh
    this.target = travel > 0 ? clamp01(-r.top / travel) : r.top <= 0 ? 1 : 0
    if (this.target !== this.prevTarget) this.direction = this.target > this.prevTarget ? 1 : -1
    this.prevTarget = this.target
    return r.bottom > -this.vh * 0.5 && r.top < this.vh * 1.5
  }

  private tick = (now: number) => {
    this.raf = 0
    if (this.destroyed) return
    const dt = this.lastNow ? Math.min(0.05, (now - this.lastNow) / 1000) : 1 / 60
    this.lastNow = now
    let active = true
    if (this.dirty) { active = this.read(); this.dirty = false }
    const k = this.o.mobile ? 14 : 11
    const d = this.target - this.smooth
    if (Math.abs(d) < 0.0004) this.smooth = this.target
    else this.smooth += d * (1 - Math.exp(-dt * k))
    const located = locate(this.tl, this.smooth)
    this.render(located)
    this.manageLoads(located, now)
    this.o.onFrame?.(this.smooth, located)
    const busy = this.smooth !== this.target || this.hasPendingWork()
    if (busy || active) this.raf = requestAnimationFrame(this.tick)
    else this.lastNow = 0
  }

  private hasPendingWork() {
    for (const cs of this.clips.values()) if (cs.status === 'loading' || (cs.video && cs.video.seeking)) return true
    return false
  }

  // ---------- rendering ----------
  private show(el: HTMLElement | undefined, opacity = 1, next: Set<HTMLElement>) {
    if (!el) return
    const o = opacity.toFixed(3)
    if (el.style.opacity !== o) el.style.opacity = o
    if (el.style.zIndex) el.style.zIndex = ''
    next.add(el)
  }
  /** like show(), but stacked above the other layers (used for the seam crossfade) */
  private showTop(el: HTMLElement, opacity: number, next: Set<HTMLElement>) {
    const o = opacity.toFixed(3)
    if (el.style.opacity !== o) el.style.opacity = o
    if (el.style.zIndex !== '3') el.style.zIndex = '3'
    next.add(el)
  }

  private focalOf(located: Located): Focal {
    const it = located.entry.item
    if (it.kind === 'hold') return it.focal
    return { x: lerp(it.focal[0].x, it.focal[1].x, located.localT), y: lerp(it.focal[0].y, it.focal[1].y, located.localT) }
  }

  private render(located: Located) {
    const next = new Set<HTMLElement>()
    const it = located.entry.item
    const t = located.localT
    if (it.kind === 'clip') {
      const cs = this.clips.get(it.id)
      this.show(this.posters.get(it.from), 1, next)
      if (cs && cs.video && cs.status === 'ready') {
        const frame = Math.round(linger(t, it.linger) * (cs.frames - 1))
        this.requestFrame(cs, frame)
        this.show(cs.el, 1, next)
        if (!cs.painted) this.show(this.posters.get(it.to), t, next)
        // seam safety net: a short symmetric crossfade with the neighbouring clip's boundary frame,
        // laid on top, so small tone differences between generated segments never pop
        const idx = located.entry.index
        if (t < SEAM_FADE) {
          const prev = this.tl.entries[idx - 1]?.item
          const pcs = prev?.kind === 'clip' ? this.clips.get(prev.id) : undefined
          if (pcs && pcs.video && pcs.status === 'ready' && pcs.painted) {
            this.requestFrame(pcs, pcs.frames - 1)
            this.showTop(pcs.el, 1 - t / SEAM_FADE, next)
          }
        } else if (t > 1 - SEAM_FADE) {
          const nxt = this.tl.entries[idx + 1]?.item
          const ncs = nxt?.kind === 'clip' ? this.clips.get(nxt.id) : undefined
          if (ncs && ncs.video && ncs.status === 'ready' && ncs.painted) {
            this.requestFrame(ncs, 0)
            this.showTop(ncs.el, (t - (1 - SEAM_FADE)) / SEAM_FADE, next)
          }
        }
      } else {
        this.show(this.posters.get(it.to), t, next)
      }
    } else {
      // hold on a keyframe: prefer the adjacent clip's real frame so the seam never pops
      this.show(this.posters.get(it.kf), 1, next)
      const idx = located.entry.index
      const prev = this.tl.entries[idx - 1]?.item
      const nxt = this.tl.entries[idx + 1]?.item
      const prevCs = prev?.kind === 'clip' ? this.clips.get(prev.id) : undefined
      const nextCs = nxt?.kind === 'clip' ? this.clips.get(nxt.id) : undefined
      if (prevCs && prevCs.video && prevCs.status === 'ready' && (this.direction > 0 || !nextCs?.video)) {
        this.requestFrame(prevCs, prevCs.frames - 1)
        this.show(prevCs.el, 1, next)
      } else if (nextCs && nextCs.video && nextCs.status === 'ready') {
        this.requestFrame(nextCs, 0)
        this.show(nextCs.el, 1, next)
      }
    }
    for (const el of this.visibleSet) if (!next.has(el)) { el.style.opacity = '0'; if (el.style.zIndex) el.style.zIndex = '' }
    this.visibleSet = next
    if (this.o.portrait) {
      const f = this.focalOf(located)
      const pos = `${f.x.toFixed(1)}% ${f.y.toFixed(1)}%`
      if (this.o.stage.style.getPropertyValue('--focal') !== pos) this.o.stage.style.setProperty('--focal', pos)
    }
  }

  // ---------- seeking ----------
  private requestFrame(cs: ClipState, frame: number) {
    cs.wantFrame = frame
    const v = cs.video
    if (!v || cs.status !== 'ready') return
    if (frame === cs.lastFrame) return
    if (v.seeking) { cs.pendingFrame = frame; return }
    cs.lastFrame = frame
    cs.pendingFrame = -1
    try { v.currentTime = (frame + 0.5) / cs.fps } catch { /* not seekable yet */ }
  }

  private onSeeked(cs: ClipState) {
    if (!cs.painted) this.markPainted(cs)
    if (cs.pendingFrame >= 0 && cs.pendingFrame !== cs.lastFrame) {
      const f = cs.pendingFrame
      cs.pendingFrame = -1
      this.requestFrame(cs, f)
    } else if (cs.wantFrame !== cs.lastFrame) {
      this.requestFrame(cs, cs.wantFrame)
    }
  }

  private markPainted(cs: ClipState) {
    const v = cs.video
    if (!v) return
    const done = () => { cs.painted = true; cs.el.classList.add('has-frame'); this.wake() }
    if (vfc(v)) v.requestVideoFrameCallback(done)
    else done()
  }

  private prime(cs: ClipState) {
    const v = cs.video
    if (!v || cs.primed) return
    cs.primed = true
    const want = cs.wantFrame
    const p = v.play()
    if (p && typeof p.then === 'function') {
      p.then(() => { v.pause(); cs.lastFrame = -1; this.requestFrame(cs, want) }).catch(() => { cs.lastFrame = -1; this.requestFrame(cs, want) })
    } else { v.pause(); cs.lastFrame = -1; this.requestFrame(cs, want) }
  }

  // ---------- loading window ----------
  private currentClipIndex(located: Located): number {
    const it = located.entry.item
    if (it.kind === 'clip') return this.clipOrder.indexOf(it.id)
    const idx = located.entry.index
    const nxt = this.tl.entries[idx + 1]?.item
    const prev = this.tl.entries[idx - 1]?.item
    if (this.direction > 0 && nxt?.kind === 'clip') return this.clipOrder.indexOf(nxt.id)
    if (prev?.kind === 'clip') return this.clipOrder.indexOf(prev.id)
    if (nxt?.kind === 'clip') return this.clipOrder.indexOf(nxt.id)
    return 0
  }

  private manageLoads(located: Located, now: number) {
    if (this.clipOrder.length === 0) return
    const ci = this.currentClipIndex(located)
    const reach = this.o.mobile ? 1 : 2
    const wanted: string[] = []
    const push = (i: number) => { const id = this.clipOrder[i]; if (id && !wanted.includes(id)) wanted.push(id) }
    push(ci)
    for (let d = 1; d <= reach; d++) { push(ci + d * this.direction); push(ci - d * this.direction) }
    // unload everything outside the window, then load in priority order (one fetch at a time)
    for (const [id, cs] of this.clips) if (!wanted.includes(id) && cs.status !== 'idle') this.unload(cs, false)
    const loadingCount = Array.from(this.clips.values()).filter((c) => c.status === 'loading').length
    if (loadingCount >= 1) return
    for (const id of wanted) {
      const cs = this.clips.get(id)
      if (!cs) continue
      if (cs.status === 'idle' || (cs.status === 'error' && now >= cs.retryAt && cs.retries < 3)) { this.load(cs); break }
    }
  }

  private src(cs: ClipState) {
    const s = cs.clip.src!
    if (this.o.mobile) return (canPlayHevc && s.mobileHevc) || s.mobile
    return (canPlayHevc && s.desktopHevc) || s.desktop
  }

  private async load(cs: ClipState) {
    cs.status = 'loading'
    try {
      if (!cs.blob) {
        cs.abort = new AbortController()
        const res = await fetch(this.src(cs), { signal: cs.abort.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        cs.blob = await res.blob()
        cs.abort = null
      }
      if (this.destroyed || cs.status !== 'loading') return
      this.attach(cs)
    } catch (e) {
      if ((e as Error).name === 'AbortError') { cs.status = 'idle'; cs.abort = null; return }
      cs.status = 'error'
      cs.retries += 1
      cs.retryAt = performance.now() + 1500 * 2 ** cs.retries
      cs.abort = null
      this.wake()
    }
  }

  private attach(cs: ClipState) {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.setAttribute('muted', '')
    v.setAttribute('playsinline', '')
    v.setAttribute('aria-hidden', 'true')
    v.tabIndex = -1
    v.disablePictureInPicture = true
    cs.url = URL.createObjectURL(cs.blob!)
    v.src = cs.url
    v.addEventListener('loadedmetadata', () => {
      if (cs.video !== v) return
      const n = Math.round(v.duration * cs.fps)
      if (n > 0 && Math.abs(n - cs.frames) <= 2) cs.frames = n
      cs.status = 'ready'
      cs.lastFrame = -1
      this.wake()
      if (this.userReady) this.prime(cs)
    })
    v.addEventListener('seeked', () => { if (cs.video === v) this.onSeeked(cs) })
    v.addEventListener('error', () => {
      if (cs.video !== v) return
      this.unload(cs, false)
      cs.blob = null
      cs.status = 'error'
      cs.retries += 1
      cs.retryAt = performance.now() + 1500 * 2 ** cs.retries
    })
    cs.video = v
    cs.painted = false
    cs.primed = false
    cs.el.classList.remove('has-frame')
    cs.el.appendChild(v)
    v.load()
  }

  private unload(cs: ClipState, dropBlob: boolean) {
    if (cs.abort) { cs.abort.abort(); cs.abort = null }
    const v = cs.video
    if (v) {
      try { v.pause() } catch { /* ignore */ }
      v.removeAttribute('src')
      try { v.load() } catch { /* ignore */ }
      v.remove()
    }
    if (cs.url) { URL.revokeObjectURL(cs.url); cs.url = null }
    if (dropBlob) cs.blob = null
    cs.video = null
    cs.status = 'idle'
    cs.painted = false
    cs.primed = false
    cs.lastFrame = -1
    cs.pendingFrame = -1
    cs.el.classList.remove('has-frame')
  }
}
