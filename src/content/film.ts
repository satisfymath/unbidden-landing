import type { FilmItem, Focal } from '../film/timeline'

/**
 * UNBIDDEN — THE UNKNOWN · Cinematic Sequence V2.
 * One camera journey over 13 approved keyframes (sequence/*.png) in narrative order; 12 transitions.
 * The astronaut never moves: only the camera. Act I discovery (1→4), Act II the helmet orbit (4→6F),
 * Act III the great pullback (6F→8), then the last frame turns into glyphs on black (HTML, over it).
 * A clip appears here with `src` only once it has passed continuity QC (docs/CLIP_STATUS.md); until then its
 * stretch plays as a scroll-driven crossfade between the two posters.
 */
const FPS = 24

export interface Keyframe { id: string; title: string; alt: string; focal: Focal }
/** Narrative order. `focal` is the object-position used on portrait viewports. */
export const KEYFRAMES: Keyframe[] = [
  { id: '1', title: 'The universe', alt: 'A vast Earth-like planet seen from orbit, a small moon in the upper right, deep space.', focal: { x: 70, y: 40 } },
  { id: '2', title: 'The discovery', alt: 'A rocky ridge comes into view; a tiny astronaut stands on its crest facing the planet.', focal: { x: 66, y: 60 } },
  { id: '4', title: 'The identity', alt: 'The camera has closed in from the ridge: the helmet and backpack fill the frame; the UNBIDDEN emblem, an open ring with a dot, is printed on the pack.', focal: { x: 45, y: 55 } },
  { id: '6A', title: 'Three quarters', alt: 'Three-quarter view of the helmet; the visor grows and reflects the planet, which fills the right of the frame.', focal: { x: 45, y: 42 } },
  { id: '6C', title: 'The gaze', alt: 'The heroic frontal close-up: the visor fills the frame and reflects the planet, its storm and the moon.', focal: { x: 50, y: 45 } },
  { id: '6E', title: 'The far profile', alt: 'The opposite profile: the back of the helmet and its vent, the planet’s limb low on the left, the reflection small.', focal: { x: 55, y: 45 } },
  { id: '6F', title: 'Contemplation', alt: 'The camera continues behind and eases back; the astronaut stands still on the ridge, full body, looking at the planet.', focal: { x: 72, y: 55 } },
  { id: '7', title: 'The great pullback', alt: 'A wide pullback: the astronaut is a speck on the ridge again under the immense planet.', focal: { x: 62, y: 55 } },
  { id: '8', title: 'The unknown', alt: 'The full round planet with its small moon separated in the upper right, dark ground, deep space, the astronaut almost imperceptible.', focal: { x: 55, y: 45 } },
]
export const keyframe = (id: string) => KEYFRAMES.find((k) => k.id === id)!
export const posterOf = (id: string, w: 1920 | 1080) => ({ avif: `./media/posters/kf-${id}-${w}.avif`, webp: `./media/posters/kf-${id}-${w}.webp` })

type Src = { frames: number }
const clip = (from: string, to: string, src?: Src) =>
  src
    ? {
        desktop: `./media/film/desktop/clip-${from}-${to}.mp4`,
        mobile: `./media/film/mobile/clip-${from}-${to}.mp4`,
        desktopHevc: `./media/film/desktop/clip-${from}-${to}.hevc.mp4`,
        mobileHevc: `./media/film/mobile/clip-${from}-${to}.hevc.mp4`,
        frames: src.frames,
        fps: FPS,
      }
    : undefined

type Act = 'discovery' | 'orbit' | 'pullback'
interface Seg { from: string; to: string; title: string; act: Act; weight: number; status?: 'approved' | 'review'; frames?: number; tailTrim?: number }
const SEGMENTS: Seg[] = [
  // v4 lean storyboard (production/v4/storyboard.json). Clips come from the final
  // campaign (production/v5/clips, 1344x768, 20 steps); tailTrim = near-static frames measured at the end of each final clip (H3 decelerates into the last keyframe).
  { from: '1', to: '2', title: 'Pedestal down: the ridge and the astronaut are revealed', act: 'discovery', weight: 2.4, frames: 90, tailTrim: 22, status: 'review' },
  { from: '2', to: '4', title: 'One long dolly from the ridge to the helmet and the emblem', act: 'discovery', weight: 1.6, frames: 90, tailTrim: 28, status: 'review' },
  { from: '4', to: '6A', title: 'The arc around the right shoulder; the planet leaves the background', act: 'orbit', weight: 1.5, frames: 90, tailTrim: 13, status: 'review' },
  { from: '6A', to: '6C', title: 'Orbit to the frontal close-up; the reflection fills the visor', act: 'orbit', weight: 1.5, frames: 90, tailTrim: 21, status: 'review' },
  { from: '6C', to: '6E', title: 'Crossing to the far profile; the reflection compresses', act: 'orbit', weight: 1.5, frames: 90, tailTrim: 18, status: 'review' },
  { from: '6E', to: '6F', title: 'Around the back and easing out to full body', act: 'orbit', weight: 1.3, frames: 90, tailTrim: 18, status: 'review' },
  { from: '6F', to: '7', title: 'The great pullback with a rise', act: 'pullback', weight: 1.3, frames: 90, tailTrim: 6, status: 'review' },
  { from: '7', to: '8', title: 'Cosmic pullback to the full disc', act: 'pullback', weight: 1.4, frames: 90, tailTrim: 18, status: 'review' },
]

const seg = (s: Seg): FilmItem => ({
  kind: 'clip',
  id: `clip-${s.from}-${s.to}`,
  from: s.from,
  to: s.to,
  title: s.title,
  act: s.act,
  status: s.frames ? (s.status ?? 'review') : 'pending',
  seconds: s.frames ? s.frames / FPS : 0,
  weight: s.weight,
  linger: 0,
  easeIn: 0.5,
  tailTrim: s.tailTrim ?? (s.to === '8' ? 0 : 4),
  src: clip(s.from, s.to, s.frames ? { frames: s.frames } : undefined),
  focal: [keyframe(s.from).focal, keyframe(s.to).focal],
})

export const FILM: FilmItem[] = [
  { kind: 'hold', id: 'hold-1', kf: '1', weight: 0.5, focal: keyframe('1').focal },
  ...SEGMENTS.slice(0, 4).map(seg),
  { kind: 'hold', id: 'hold-6C', kf: '6C', weight: 0.4, focal: keyframe('6C').focal },
  ...SEGMENTS.slice(4).map(seg),
  { kind: 'hold', id: 'hold-8', kf: '8', weight: 3.2, focal: keyframe('8').focal },
]

export interface FilmBeat { id: string; anchor: string; span: [number, number]; text: string; kind: 'line' | 'eyebrow' }
/** Minimal text over the film. Anchored to an item id and a local span of it. */
export const BEATS: FilmBeat[] = [
  { id: 'b-look', anchor: 'clip-2-4', span: [0.18, 0.92], text: 'It doesn’t wait to be told where to look.', kind: 'line' },
  { id: 'b-observe', anchor: 'clip-6A-6C', span: [0.2, 0.95], text: 'It observes.', kind: 'line' },
  { id: 'b-prove', anchor: 'clip-6F-7', span: [0.2, 0.9], text: 'Then it proves.', kind: 'line' },
]

export const SCROLL_HINT = 'Scroll'
export const TAGLINE = 'Intelligence that doesn’t wait for instructions.'
export const WORDMARK = 'UNBiDDEN'
