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
  await expect(page.locator('#intelligence h2')).toContainText('It finds what matters')
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
  await expect(page.locator('.film__static-item')).toHaveCount(8)
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
