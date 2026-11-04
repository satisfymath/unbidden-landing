# UNBIDDEN — THE UNKNOWN · landing cinematográfica

Landing de [UNBIDDEN](https://github.com/satisfymath/unbidden-ai): una película de cámara en ocho fotogramas aprobados que el visitante recorre con el scroll, seguida de la explicación del producto con evidencia verificable. React 19 + TypeScript + Vite 8, CSS plano, Geist autoalojada, sin librerías de animación. El video se genera en local con MiniMax H3 (mlx-h3); el navegador solo reproduce MP4.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | `tsc -b` + `vite build` → `dist/` (rutas relativas, sirve desde cualquier subpath) |
| `npm run preview -- --port 4181` | sirve `dist/` (4173 suele estar ocupado por otro preview) |
| `npm run lint` | ESLint |
| `npm run posters` | posters WebP/AVIF desde `sequence/` → `public/media/posters/` |
| `npm run qa` | Playwright: carga sin errores, scrub adelante/atrás, reduced motion, anchos 360–1920, teclado y enlaces |

## Publicar
Cada rama publica una preview y `main` publica en unbidden.cl, con QA antes. El paso a paso está en `docs/DEPLOY.md`.

## Pipeline de video (local)
Ver `docs/PIPELINE.md` y `docs/CLIP_STATUS.md`.
```
scripts/h3/fl2va.zsh <clip> <first.png> <last.png> 124 <seed> <prompt.txt>   # un tramo FL2VA
scripts/h3/chain.zsh 3 7                                                     # tramos encadenados desde el último frame real
scripts/h3/extract_frames.zsh <clip> <master.mp4>   ·   scripts/h3/qc_compare.zsh <frame> <keyframe>
scripts/post/integrate.zsh <clip>     # upscale (mezcla ESRGAN/Lanczos) → encodes H.264+HEVC → activa el tramo en src/content/film.ts
~/AI-Video-Lab/environments/metrics/bin/python scripts/post/clean_plate.py   # frame 8 sin branding
```

## Estructura
```
sequence/            masters aprobados (no se tocan)
production/          derivados pesados, git-ignored: plates, clips (masters H3 + logs), frames, upscale
public/media/        film/{desktop,mobile}/clip-0N(.hevc).mp4 · posters/ · brand/
src/film/            timeline.ts (puro), FilmEngine.ts (scrub), Film.tsx (hero + modo estático)
src/content/         film.ts (timeline, beats, focal points) · product.ts (copy con fuentes del repo)
src/sections/        Nav · Intelligence · Evidence · Invitation · Footer
docs/                DISCOVERY · CREATIVE_ARCHITECTURE · PIPELINE · CLIP_STATUS · QA
```

## Licencias y créditos
Motor de scrub adaptado de [oso95/scroll-world](https://github.com/oso95/scroll-world) (MIT). Sistema visual guiado por [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (MIT). Secuencia generada con MiniMax H3 (Community License: territorio limitado, crédito en el footer). Geist (OFL).
