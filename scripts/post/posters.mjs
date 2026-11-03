// posters.mjs — derive web posters from the approved masters (never modifies sequence/*.png).
// Output: public/media/posters/kf-N-{1920,1080}.{webp,avif}, og.jpg (1200x630 from frame 8), favicon.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const out = 'public/media/posters'
await mkdir(out, { recursive: true })
const widths = [1920, 1080]
const sources = {}
for (let n = 1; n <= 8; n++) sources[`kf-${n}`] = `sequence/${n}.png`
// seam frames (real first frames of clips) are added by encode_web.zsh under production/frames; include if present
for (let n = 1; n <= 7; n++) {
  const p = `production/frames/clip-0${n}/first.png`
  if (existsSync(p)) sources[`seam-0${n}`] = p
}
if (existsSync('production/plates/kf-8-clean.png')) sources['kf-8-clean'] = 'production/plates/kf-8-clean.png'
// the real last frame of the film (end of clip 07): source of the ASCII dissolve, so the glyphs grow out of the same frame
if (existsSync('production/frames/clip-07/last.png')) sources['last-07'] = 'production/frames/clip-07/last.png'

let total = 0
for (const [name, src] of Object.entries(sources)) {
  for (const w of widths) {
    const base = sharp(src).resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' })
    const webp = await base.clone().webp({ quality: 82, effort: 5 }).toFile(`${out}/${name}-${w}.webp`)
    const avif = await base.clone().avif({ quality: 55, effort: 6 }).toFile(`${out}/${name}-${w}.avif`)
    total += webp.size + avif.size
    console.log(`${name}-${w}: webp ${(webp.size / 1024).toFixed(0)} KB · avif ${(avif.size / 1024).toFixed(0)} KB`)
  }
}
await sharp('sequence/8.png').resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 84 }).toFile(`${out}/og.jpg`)
console.log(`total posters ${(total / 1024 / 1024).toFixed(2)} MB`)
