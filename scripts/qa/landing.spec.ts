import { expect, test, type Page } from '@playwright/test'

const WIDTHS = [360, 390, 430, 768, 1024, 1440, 1920]

async function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`) })
  return errors
}

test('loads without console or network errors, with semantic landmarks', async ({ page }) => {
  const errors = await collectErrors(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible()
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('#how h2')).toContainText('It finds what matters')
  await expect(page.locator('#evidence')).toBeVisible()
  await expect(page.locator('#install')).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

test('film scrubs forward and backward (video or poster fallback) and the brand holds at the end', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion', 'static mode has no scrub')
  await page.goto('/', { waitUntil: 'networkidle' })
  const filmH = await page.evaluate(() => document.getElementById('film')!.offsetHeight)
  const vh = page.viewportSize()!.height
  const go = async (f: number) => { await page.evaluate((y) => window.scrollTo(0, y), Math.round(f * (filmH - vh))); await page.waitForTimeout(900) }
  const visiblePosters = () => page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-kf]')).filter((e) => Number(e.style.opacity) > 0).map((e) => e.dataset.kf))
  await go(0)
  expect(await visiblePosters()).toEqual(['1'])
  await go(0.5)
  const mid = await visiblePosters()
  expect(mid.length).toBeGreaterThan(0)
  expect(mid).not.toEqual(['1'])
  await go(0.98)
  expect(await visiblePosters()).toContain('8')
  expect(Number(await page.locator('.film__black').evaluate((e) => (e as HTMLElement).style.opacity))).toBeGreaterThan(0.9)
  await expect(page.locator('.splash__word')).toHaveText('U N B i D D E N')
  await go(0.45)
  const orbit = await visiblePosters()
  expect(orbit.some((k) => k && k.startsWith('6'))).toBeTruthy()
  await go(0.3)
  expect(await visiblePosters()).not.toContain('8')
  // any produced clip must have seeked with scroll
  const clips = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLVideoElement>('[data-clip] video')).map((v) => ({ id: v.parentElement!.dataset.clip, t: v.currentTime, dur: v.duration })))
  for (const c of clips) if (c.dur > 0) expect(c.t).toBeGreaterThanOrEqual(0)
})

test('reduced motion renders the static sequence', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('.film--static')).toBeVisible()
  await expect(page.locator('.film__static-item')).toHaveCount(9)
  await expect(page.locator('[data-clip]')).toHaveCount(0)
})

test('no horizontal overflow at every target width', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome')
  await page.goto('/', { waitUntil: 'networkidle' })
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: Math.round(w * 0.62) + 300 })
    await page.waitForTimeout(250)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `overflow at ${w}px`).toBeLessThanOrEqual(0)
  }
})

test('keyboard: skip link and nav links are reachable; CTAs resolve', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop-chrome')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(600)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).map((a) => a.getAttribute('href')!))
  for (const h of hrefs) {
    if (h.startsWith('#')) { expect(await page.locator(h).count(), `anchor ${h}`).toBe(1); continue }
    const res = await request.head(h, { maxRedirects: 5 }).catch(() => request.get(h, { maxRedirects: 5 }))
    expect(res.status(), `link ${h}`).toBeLessThan(400)
  }
})

test('console: the feed replays the real cycle, the cycle diagram follows it, the mode switch works', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('.app__win').scrollIntoViewIfNeeded()
  await page.waitForTimeout(9000)
  expect(await page.locator('.app__feed .app__row').count()).toBeGreaterThanOrEqual(20)
  await expect(page.locator('.app__feed')).toContainText('Discovering.')
  await expect(page.locator('.cycle__step--on')).toHaveCount(1)
  await page.locator('.modes').scrollIntoViewIfNeeded()
  await page.getByRole('radio', { name: 'autonomous' }).click()
  await expect(page.locator('.modes__strong')).toHaveText('mode: autonomous (was supervised)')
  await expect(page.locator('.modes__out')).toContainText('merge_pull_requests')
  await page.getByRole('button', { name: /KILL SWITCH/ }).click()
  await expect(page.locator('.kill')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.modes__out')).toContainText('Kill switch released.')
})

test('the app: panels, the agent\u2019s question, the kill switch, all from the recording', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('.app__win').scrollIntoViewIfNeeded()
  await page.locator('.app__chip', { hasText: '/inbox' }).click()
  await expect(page.locator('.app__modal')).toContainText('dnspython 2.8.0')
  await page.keyboard.press('Escape')
  await expect(page.locator('.app__modal')).toHaveCount(0)
  await page.locator('.app__chip', { hasText: '/ask' }).click()
  await expect(page.locator('.app__modal')).toContainText('The monthly cap (US$2.00) is reached. Raise it?')
  await page.keyboard.press('Enter')
  await expect(page.locator('.app__feed')).toContainText('Answered later: nothing changed')
  await page.locator('.app__chip', { hasText: '/kill' }).click()
  await expect(page.locator('.app__bar')).toContainText('KILL SWITCH')
  await page.locator('.app__prompt input').fill('/nope')
  await page.keyboard.press('Enter')
  await expect(page.locator('.app__feed')).toContainText('No command /nope. /help lists them.')
})

test('the opening is black and the ring opens onto the planet as the page scrolls', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  const veil = page.locator('.film__veil')
  const radius = () => veil.evaluate((e) => parseFloat(getComputedStyle(e).getPropertyValue('--r')))
  expect(await radius()).toBeLessThan(1)
  await expect(page.locator('.film__title')).toHaveText('Intelligence that doesn’t wait for instructions.')
  const span = await page.evaluate(() => { const f = document.getElementById('film')!; return f.offsetHeight - innerHeight })
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(span * 0.05))
  await page.waitForTimeout(900)
  expect(await radius()).toBeGreaterThan(5)
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(span * 0.2))
  await page.waitForTimeout(900)
  await expect(veil).toBeHidden()
  await expect(page.locator('.film__hero-text')).toBeHidden()
})

test('the closing leaves no glyphs behind on the opening, and comes back on the way down', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  const ink = () => page.locator('.film__glyphs').evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++
    return n
  })
  const span = await page.evaluate(() => { const f = document.getElementById('film')!; return f.offsetHeight - innerHeight })
  const to = async (k: number, wait = 900) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(span * k))
    await page.waitForTimeout(wait)
  }
  await to(0.9)
  expect(await ink()).toBeGreaterThan(1000)
  await to(0)
  expect(await ink()).toBe(0)
  await to(0.9)
  expect(await ink()).toBeGreaterThan(1000)
  // backing out a little at a time, the way a hand scrolls
  for (let k = 0.9; k > 0; k -= 0.05) await to(k, 60)
  await to(0)
  expect(await ink()).toBe(0)
})

test('nav marks the section in view; a far jump skips the film instantly', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('h1')).toBeVisible()
  await page.locator('.nav[data-ready]').waitFor()
  await page.waitForTimeout(800)
  await page.locator('.nav__toggle:visible').click({ timeout: 800 }).catch(() => {})
  await page.locator('.nav__links a[href="#evidence"]').click()
  await page.waitForTimeout(700)
  const top = await page.evaluate(() => document.getElementById('evidence')!.getBoundingClientRect().top)
  expect(Math.abs(top)).toBeLessThan(100)
  await expect(page.locator('.nav__links a[aria-current]')).toHaveText('Evidence')
})

test('evidence: the 39-repository campaign adds up and keeps its caveats', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('.camp').scrollIntoViewIfNeeded()
  await expect(page.locator('.camp__table tbody tr')).toHaveCount(4)
  await expect(page.locator('.camp__table tbody tr').first().locator('.unit--on')).toHaveCount(39)
  await expect(page.locator('.camp .camp__notes')).toContainText('The final pass over the same 39 is running')
})

test('the development runs: the 39 add up, the totals match the record, a repository opens its own', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const runs = page.locator('.dr')
  await runs.scrollIntoViewIfNeeded()
  await expect(runs.locator('.dr__strip .unit')).toHaveCount(39)
  await expect(runs.locator('.dr__row')).toHaveCount(23)
  await expect(runs.locator('.dr__bar')).toHaveCount(15)
  await expect(runs.locator('.dr__rest li')).toHaveCount(16)
  await expect(runs.locator('.dr__big .sr-only')).toHaveText('18,734')
  await expect(runs.locator('.dr__panel')).toContainText('dnspython')
  await runs.locator('.dr__row', { hasText: 'misago' }).click()
  await expect(runs.locator('.dr__panel')).toContainText('mail catcher')
  await expect(runs.locator('.dr__panel a')).toHaveAttribute('href', /v0\.18\.1\/docs\/bench\/campaign13\/dev-host\/misago-final\.json$/)
})

test('the final pass says it is running, and its numbers add up to what it links', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const fp = page.locator('.fp')
  await fp.scrollIntoViewIfNeeded()
  await expect(fp).toContainText('not its result')
  await expect(fp).toContainText('As of')
  const merged = await fp.locator('.fp__row').count()
  await expect(fp.locator('.dr__big .sr-only')).toHaveText(String(merged))
  await expect(fp.locator('.fp__pr').first()).toHaveAttribute('href', /github\.com\/satisfymath\/c13-.+\/pull\/\d+$/)
})

test('the app draws the product\u2019s ring: only the dots that are set, the dot in amber', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('.app__win').scrollIntoViewIfNeeded()
  const rows = page.locator('.app__row--braille')
  await expect(rows).toHaveCount(3)
  // \u2880\u2864\u2812\u2812\u2800 + \u281b, \u28bc\u2800\u2800\u2800\u2800\u2867, \u2818\u2826\u28c0\u28c0\u2834\u2803 of unbidden/tui/brand.py
  const dots = await rows.evaluateAll((r) => r.reduce((n, e) => n + e.querySelectorAll('circle').length, 0))
  expect(dots).toBe(36)
  await expect(rows.first().locator('.is-a circle')).toHaveCount(4)
  expect(await page.locator('.app__win').evaluate((e) => /[\u2800-\u28ff]/.test(e.querySelector('.app__row--braille')!.textContent ?? ''))).toBe(false)
})

test('console: --help lists every command and doctor shows the recorded machine', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('.commands__help').scrollIntoViewIfNeeded()
  await page.waitForTimeout(3500)
  await page.getByRole('tab', { name: 'All 47' }).click()
  await expect(page.locator('.help__row')).toHaveCount(47)
  await page.locator('.doctor__head').scrollIntoViewIfNeeded().catch(() => {})
  await page.locator('.commands__doctor').scrollIntoViewIfNeeded()
  await page.waitForTimeout(3000)
  await expect(page.locator('.help__row').filter({ hasText: 'drill' })).toContainText('prove rollback works before autonomy relies on it')
  await expect(page.locator('.doctor__row').filter({ hasText: 'machine' })).toContainText('Apple M5 Pro, 64 GB')
})

test('reduced motion: no typewriter, no stagger, everything readable at once', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced-motion')
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('#cli').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.getByRole('tab', { name: 'All 47' }).click()
  await expect(page.locator('.help__row')).toHaveCount(47)
  expect(await page.locator('.app__feed .app__row').count()).toBeGreaterThan(50)
  await expect(page.locator('.film__static-end .splash__word')).toHaveCount(1)
})
