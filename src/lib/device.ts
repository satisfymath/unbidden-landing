export const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
export const coarseQuery = '(hover: none) and (pointer: coarse)'
export const portraitQuery = '(orientation: portrait)'
export const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia(coarseQuery).matches
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(reducedMotionQuery).matches
export const isIOS = () => typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
