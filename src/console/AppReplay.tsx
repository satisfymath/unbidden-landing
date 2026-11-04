import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FEED_START, OPEN_ROWS, TUI_REC, TUI_TEXT, rowText, type Row } from '../content/tui'
import { useReducedMotion } from '../hooks/useReducedMotion'
import './AppReplay.css'

const CHIPS = ['/inbox', '/why', '/ask', '/activity', '/setup', '/kill', '/help']

type Modal =
  | { kind: 'panel'; lines: string[] }
  | { kind: 'ask'; at: number; value: string | null }
  | { kind: 'setup'; step: number; at: number }

const plain = (t: string, d = false): Row => [{ t, ...(d ? { d: 1 } : {}) }]

function RowLine({ row }: { row: Row }) {
  const text = rowText(row)
  const timed = /^\s+\d\d:\d\d {2}/.test(text)
  const detail = /^\s{8,}/.test(text)
  const braille = /[\u2800-\u28ff]/.test(text)
  const cls = `app__row ${timed ? 'app__row--timed' : ''} ${detail ? 'app__row--detail' : ''} ${braille ? 'app__row--braille' : ''}`
  return (
    <p className={cls}>
      {row.length === 0 ? '\u00a0' : row.map((s, i) => <span key={i} className={`${s.b ? 'is-b ' : ''}${s.d ? 'is-d ' : ''}${s.a ? 'is-a' : ''}`.trim() || undefined}>{s.t}</span>)}
    </p>
  )
}

/**
 * The real terminal app, replayed: the banner, where things stand, then the agent's own feed, line by line. When it has
 * played the prompt is live for what was recorded: panels, the agent's question, the setup assistant, the kill switch.
 * Everything it prints comes from the app (src/content/tui.ts); `onShown` drives the cycle above it.
 */
export function AppReplay({ onShown }: { onShown?: (i: number) => void }) {
  const reduced = useReducedMotion()
  const [shownState, setShown] = useState(0)
  const shown = reduced ? OPEN_ROWS.length : shownState
  const [extra, setExtra] = useState<Row[]>([])
  const [go, setGo] = useState(false)
  const [modal, setModal] = useState<Modal | null>(null)
  const [killed, setKilled] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (reduced || go) return
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, go])

  // the replay's pace follows what is on the line
  useEffect(() => {
    if (reduced || !go || shown >= OPEN_ROWS.length) return
    const text = rowText(OPEN_ROWS[shown])
    const delay = shown < FEED_START ? 70 : text.includes('✓') ? 420 : /^> /.test(text) ? 240 : text.trim() === '' ? 40 : 120
    const t = window.setTimeout(() => setShown((n) => n + 1), delay)
    return () => window.clearTimeout(t)
  }, [go, shown, reduced])

  const onShownRef = useRef(onShown)
  useEffect(() => { onShownRef.current = onShown }, [onShown])
  useEffect(() => { onShownRef.current?.(shown - 1) }, [shown])

  useEffect(() => {
    const f = feedRef.current
    if (f && !reduced) f.scrollTop = f.scrollHeight
  }, [shown, extra, reduced])

  useEffect(() => { if (modal) modalRef.current?.focus({ preventScroll: true }) }, [modal])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const print = useCallback((rows: Row[]) => setExtra((e) => [...e, plain(''), ...rows]), [])

  const dispatch = useCallback((line: string) => {
    const text = line.trim()
    if (!text) return
    setShown(OPEN_ROWS.length)
    if (!text.startsWith('/')) { print([plain('  This page replays a recording. In the app, anything you type is a question answered from the project’s records.', true)]); return }
    const name = text.slice(1).split(/\s+/)[0]
    if (name === 'ask') { setModal({ kind: 'ask', at: 1, value: null }); return }
    if (name === 'setup') { setModal({ kind: 'setup', step: 0, at: 0 }); return }
    if (name === 'kill') setKilled(true)
    if (name === 'resume') setKilled(false)
    const rec = TUI_REC.commands[`/${name}`]
    if (!rec) { print([plain(`  ${TUI_TEXT.unknown(name)}`)]); return }
    if (rec.panel) { setModal({ kind: 'panel', lines: rec.panel }); return }
    print(rec.rows)
  }, [print])

  /** Types a command into the prompt, then presses Enter. */
  const run = (cmd: string) => {
    if (typing) return
    const full = cmd === '/why' ? `/why ${TUI_REC.opportunity}` : cmd === '/kill' && killed ? '/resume' : cmd
    timers.current.forEach(clearTimeout)
    if (reduced) { dispatch(full); return }
    setTyping(true)
    setInput('')
    Array.from(full).forEach((_, i) => timers.current.push(window.setTimeout(() => setInput(full.slice(0, i + 1)), 22 * i)))
    timers.current.push(window.setTimeout(() => { setInput(''); setTyping(false); dispatch(full) }, 22 * full.length + 220))
  }

  const answerAsk = (rows: Row[]) => { setModal(null); print(rows); inputRef.current?.focus({ preventScroll: true }) }

  const onModalKey = (e: KeyboardEvent) => {
    if (!modal) return
    if (e.key === 'Escape') {
      e.preventDefault()
      if (modal.kind === 'ask') print([plain(`  Left for later; /ask brings it back.`)])
      setModal(null)
      return
    }
    if (modal.kind === 'panel') { if (e.key === 'Enter' || e.key === 'q') { e.preventDefault(); setModal(null) } return }
    const count = modal.kind === 'ask' ? TUI_REC.ask.options.length : TUI_REC.setup[modal.step].options.length
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && count && !(modal.kind === 'ask' && modal.value !== null)) {
      e.preventDefault()
      const d = e.key === 'ArrowDown' ? 1 : -1
      setModal({ ...modal, at: (modal.at + d + count) % count })
    }
    if (e.key === 'Enter') { e.preventDefault(); confirm(modal, modal.at) }
  }

  const confirm = (m: Modal, at: number) => {
    if (m.kind === 'ask') {
      if (m.value !== null) { answerAsk(TUI_REC.ask.raise); return }
      if (at === 0) setModal({ kind: 'ask', at: 0, value: '10' })
      else answerAsk(TUI_REC.ask.later)
    }
    if (m.kind === 'setup') {
      const next = m.step + 1
      if (next >= TUI_REC.setup.length) { setModal(null); print([plain(`  ${TUI_TEXT.setupDone}`)]); return }
      setModal({ kind: 'setup', step: next, at: 0 })
    }
  }

  const visible = OPEN_ROWS.slice(0, shown)
  return (
    <div className="app" ref={root}>
      <div className="app__chips" role="group" aria-label="Try a command in the recording">
        <span className="app__try mono">Try it</span>
        {CHIPS.map((c) => (
          <button key={c} type="button" className="app__chip mono" onClick={() => run(c)}>{c === '/kill' && killed ? '/resume' : c}</button>
        ))}
      </div>
      <div className="app__win" aria-label="The Unbidden terminal app, replayed from a recording">
        <div className="app__title" aria-hidden="true"><i /><i /><i /><span className="mono">unbidden — fst</span></div>
        <div className="app__head mono"><span className="is-b">{TUI_REC.header.split('  ')[0]}</span><span className="app__facts">{TUI_REC.header.split('  ')[1]}</span><span className="app__ver">{TUI_REC.header.split('  ')[2]}</span></div>
        <div className="app__feed mono" ref={feedRef} tabIndex={0} aria-label="Feed">
          {visible.map((r, i) => <RowLine key={i} row={r} />)}
          {extra.map((r, i) => <RowLine key={`x${i}`} row={r} />)}
          {!reduced && go && shown < OPEN_ROWS.length ? <p className="app__row"><span className="caret" /></p> : null}
        </div>
        <form className="app__prompt mono" onSubmit={(e) => { e.preventDefault(); const v = input; setInput(''); dispatch(v) }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={TUI_TEXT.placeholder} aria-label="Prompt" spellCheck={false} autoComplete="off" readOnly={typing} />
        </form>
        <div className={`app__bar mono ${killed ? 'is-killed' : ''}`}>{killed ? TUI_REC.barKilled : TUI_REC.bar}</div>

        {modal ? (
          <div className="app__scrim" onClick={() => setModal(null)}>
            <div className="app__modal mono" ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" onKeyDown={onModalKey} onClick={(e) => e.stopPropagation()}>
              {modal.kind === 'panel' ? (
                <>
                  <p className="is-b app__modal-title">{modal.lines[0]}</p>
                  <pre className="app__table">{modal.lines.slice(1).join('\n')}</pre>
                  <p className="app__hint">Esc closes the panel.</p>
                </>
              ) : modal.kind === 'ask' ? (
                <>
                  <p className="is-b">{TUI_REC.ask.text[0]}</p>
                  <p className="app__why">{TUI_REC.ask.text[1]}</p>
                  {modal.value === null ? (
                    <ul className="app__opts" role="listbox" aria-label="Options">
                      {TUI_REC.ask.options.map((o, i) => (
                        <li key={o} role="option" aria-selected={modal.at === i} className={modal.at === i ? 'is-on' : undefined} onClick={() => confirm(modal, i)}>{o}</li>
                      ))}
                    </ul>
                  ) : (
                    <button type="button" className="app__value" onClick={() => confirm(modal, 0)}>US$ 10<span className="caret" /></button>
                  )}
                  <p className="app__hint">{modal.value === null ? TUI_REC.ask.text[2] : 'Type the value and press Enter; Esc leaves it for later.'}</p>
                </>
              ) : (
                <>
                  {OPEN_ROWS.slice(0, 3).map((r, i) => <RowLine key={i} row={r} />)}
                  <p className="is-b app__question">{TUI_REC.setup[modal.step].question}</p>
                  {TUI_REC.setup[modal.step].options.length ? (
                    <ul className="app__opts" role="listbox" aria-label="Options">
                      {TUI_REC.setup[modal.step].options.map((o, i) => (
                        <li key={o} role="option" aria-selected={modal.at === i} className={modal.at === i ? 'is-on' : undefined} onClick={() => confirm(modal, i)}>{o}</li>
                      ))}
                    </ul>
                  ) : (
                    <button type="button" className="app__value" onClick={() => confirm(modal, 0)}><span className="caret" /></button>
                  )}
                  <p className="app__hint">{TUI_REC.setup[modal.step].hint}</p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
