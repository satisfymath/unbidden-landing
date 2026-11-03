import type { FilmItem } from '../film/timeline'

/**
 * UNBIDDEN — THE UNKNOWN. One camera journey, eight approved keyframes, seven transitions.
 * Clips are filled in as each FL2VA segment passes continuity QC (docs/CLIP_STATUS.md).
 * Focal points are object-position percentages used only on portrait viewports.
 */
const FPS = 24
const clip = (n: number, src?: { frames: number }) =>
  src ? { desktop: `./media/film/desktop/clip-0${n}.mp4`, mobile: `./media/film/mobile/clip-0${n}.mp4`, frames: src.frames, fps: FPS } : undefined

export const FILM: FilmItem[] = [
  { kind: 'hold', id: 'hold-1', kf: 1, weight: 0.45, focal: { x: 70, y: 40 } },
  { kind: 'clip', id: 'clip-01', from: 1, to: 2, weight: 1.3, linger: 0.25, src: clip(1), focal: [{ x: 70, y: 40 }, { x: 66, y: 60 }] },
  { kind: 'clip', id: 'clip-02', from: 2, to: 3, weight: 1.2, linger: 0.25, src: clip(2), focal: [{ x: 66, y: 60 }, { x: 66, y: 55 }] },
  { kind: 'clip', id: 'clip-03', from: 3, to: 4, weight: 1.2, linger: 0.25, src: clip(3), focal: [{ x: 66, y: 55 }, { x: 45, y: 55 }] },
  { kind: 'hold', id: 'hold-4', kf: 4, weight: 0.35, focal: { x: 45, y: 55 } },
  { kind: 'clip', id: 'clip-04', from: 4, to: 5, weight: 1.1, linger: 0.25, src: clip(4), focal: [{ x: 45, y: 55 }, { x: 45, y: 45 }] },
  { kind: 'clip', id: 'clip-05', from: 5, to: 6, weight: 1.1, linger: 0.25, src: clip(5), focal: [{ x: 45, y: 45 }, { x: 72, y: 55 }] },
  { kind: 'clip', id: 'clip-06', from: 6, to: 7, weight: 1.3, linger: 0.25, src: clip(6), focal: [{ x: 72, y: 55 }, { x: 62, y: 55 }] },
  { kind: 'clip', id: 'clip-07', from: 7, to: 8, weight: 1.3, linger: 0.3, src: clip(7), focal: [{ x: 62, y: 55 }, { x: 55, y: 50 }] },
  { kind: 'hold', id: 'hold-8', kf: 8, weight: 0.8, focal: { x: 55, y: 50 } },
]

export interface FilmBeat { id: string; anchor: string; span: [number, number]; text: string; kind: 'line' | 'eyebrow' }
/** Minimal text over the film. Anchored to an item id and a local span of it. */
export const BEATS: FilmBeat[] = [
  { id: 'b-open', anchor: 'hold-1', span: [0, 1], text: 'UNBIDDEN — THE UNKNOWN', kind: 'eyebrow' },
  { id: 'b-look', anchor: 'clip-02', span: [0.18, 0.92], text: 'It doesn’t wait to be told where to look.', kind: 'line' },
  { id: 'b-observe', anchor: 'clip-04', span: [0.2, 0.9], text: 'It observes.', kind: 'line' },
  { id: 'b-prove', anchor: 'clip-06', span: [0.2, 0.9], text: 'Then it proves.', kind: 'line' },
]

export const KEYFRAMES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  n,
  title: ['The universe', 'The discovery', 'The approach', 'The identity', 'The gaze', 'Contemplation', 'The great pullback', 'Unbidden: the unknown'][n - 1],
  alt: [
    'A vast Earth-like planet seen from orbit, a small moon in the upper right, deep space.',
    'A rocky ridge comes into view; a tiny astronaut stands on its crest facing the planet.',
    'The camera closes in on the astronaut from behind: white EVA suit, square backpack, the planet filling the sky.',
    'The helmet and backpack fill the frame; the UNBIDDEN emblem, an open ring with a dot, is printed on the pack.',
    'A close profile of the helmet; the visor reflects the planet and its storm.',
    'The camera eases back and to the side; the astronaut stands still on the ridge, looking up.',
    'A wide pullback: the astronaut is a speck on the ridge again under the immense planet.',
    'The opening cosmic view returns with the UNBIDDEN mark and the line: Intelligence that doesn’t wait for instructions.',
  ][n - 1],
  poster: (w: 1920 | 1080) => ({ avif: `./media/posters/kf-${n}-${w}.avif`, webp: `./media/posters/kf-${n}-${w}.webp` }),
}))

export const SCROLL_HINT = 'Scroll'
export const TAGLINE = 'Intelligence that doesn’t wait for instructions.'
export const WORDMARK = 'UNBiDDEN'
