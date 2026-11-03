// posters.mjs — derive web posters from the approved masters (never modifies sequence/*.png).
// Keyframe ids come from the film manifest order below; output: public/media/posters/kf-<id>-{1920,1080}.{webp,avif}, og.jpg.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const IDS = ['1', '2', '3', '4', '5', '6A', '6B', '6C', '6D', '6E', '6F', '7', '8']
const out = 'public/media/posters'
await mkdir(out, { recursive: true })
const widths = [1920, 1080]
const sources = {}
for (const id of IDS) sources[`kf-${id}`] = `sequence/${id}.png`
// real last frame of the final clip (the ASCII dissolve grows out of it); produced by the v2 pipeline
if (existsSync('production/v2/frames/7-8/last.png')) sources['last'] = 'production/v2/frames/7-8/last.png'

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
