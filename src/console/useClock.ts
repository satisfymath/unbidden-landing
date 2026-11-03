import { useSyncExternalStore } from 'react'

/** One shared 1 Hz clock for every panel header. */
let clockSubs = 0
let clockTimer = 0
const clockListeners = new Set<() => void>()
function subscribeClock(cb: () => void) {
  clockListeners.add(cb)
  if (clockSubs++ === 0) clockTimer = window.setInterval(() => clockListeners.forEach((l) => l()), 1000)
  return () => { clockListeners.delete(cb); if (--clockSubs === 0) window.clearInterval(clockTimer) }
}
const hhmmss = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':') }
export function useClock(live = true): string {
  return useSyncExternalStore(live ? subscribeClock : () => () => {}, live ? hhmmss : () => '--:--:--', () => '--:--:--')
}

