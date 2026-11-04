import type { Verb } from './console'
import recording from './tui-recording.json'

/**
 * What the real terminal app printed: recorded by scripts/tui/record.py from unbidden.tui 0.17.1, headless, on a copy of
 * campaign 13's fst workspace. Each row keeps the app's own segments and their style. docs/CONTENT_SOURCES.md has the rest.
 */
export interface Seg { t: string; b?: number; d?: number; a?: number }
export type Row = Seg[]

export const rowText = (r: Row) => r.map((s) => s.t).join('')

const NOISE = /The world changed|Capability need|Connection |forge\.build|building a capability/

/** The opening screen and the agent's last sixty events; repeated bookkeeping lines are left out: an excerpt. */
const raw = recording.open as Row[]
const kept: Row[] = []
for (let i = 0; i < raw.length; i++) {
  if (NOISE.test(rowText(raw[i]))) {
    // a detail line belongs to the line it follows
    if (raw[i + 1] && /^\s{8,}/.test(rowText(raw[i + 1]))) i++
    continue
  }
  kept.push(raw[i])
}
// a verb heading left with nothing under it goes too, with the blank line before it
const isHeading = (r: Row) => /^> /.test(rowText(r))
export const OPEN_ROWS: Row[] = kept.filter((r, i) => {
  const firstFeedHeading = kept.findIndex((x) => /things it did/.test(rowText(x)))
  if (i <= firstFeedHeading) return true
  if (isHeading(r)) return !!kept[i + 1] && rowText(kept[i + 1]).trim() !== '' && !isHeading(kept[i + 1])
  if (rowText(r).trim() === '') return !!kept[i + 1] && isHeading(kept[i + 1]) && !!kept[i + 2] && rowText(kept[i + 2]).trim() !== '' && !isHeading(kept[i + 2])
  return true
})

/** Where the replayed feed begins (after the banner and "Where things stand."). */
export const FEED_START = OPEN_ROWS.findIndex((r) => /things it did/.test(rowText(r)))

/** The verb each row falls under, for the cycle above the window. Null before the feed starts. */
export const ROW_VERBS: (Verb | null)[] = (() => {
  let cur: Verb | null = null
  return OPEN_ROWS.map((r, i) => {
    if (i < FEED_START) return null
    const m = /^> (\w+)\./.exec(rowText(r))
    if (m) cur = m[1] as Verb
    return cur
  })
})()

const clean = (line: string) => line.replace(/ · ollama [✓✗]/, '').replace(/ · spend cap not verified/, '').replace(/ · \d+ s ago$/, '')

export const TUI_REC = {
  version: recording.version,
  header: recording.header,
  bar: clean(recording.bar),
  barKilled: clean(recording.bar_killed),
  opportunity: recording.first_opportunity,
  commands: recording.commands as unknown as Record<string, { typed: string; rows: Row[]; panel?: string[] }>,
  ask: recording.ask as unknown as { text: string[]; options: string[]; later: Row[]; raise: Row[] },
  setup: recording.setup as { question: string; options: string[]; placeholder: string; hint: string }[],
}

/** unbidden/tui/text.py at 0.17.1. */
export const TUI_TEXT = {
  placeholder: 'Ask about the project, or / for a command',
  unknown: (name: string) => `No command /${name}. /help lists them.`,
  setupDone: 'Set up. The mandate is at .unbidden/mandate.yaml; /start runs the agent in the background.',
}
