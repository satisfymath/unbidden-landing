# Discovery — estado real del entorno (2026-11-03)

## Proyecto
- `sequence/1.png … 8.png`: masters aprobados, 1670–1672 × 941 px, RGB 8 bit, sin alfa, ~2 MB cada uno. **No se modifican.** Todo derivado vive en `production/` (git-ignored) o `public/media/`.
- Antes de esta pasada no existía frontend, git ni tooling. Se inicializó git y un proyecto React 19 + TypeScript 6 + Vite 8 con CSS plano.

## Hardware y herramientas
| Recurso | Estado verificado |
|---|---|
| MacBook Pro M5 Pro, 18 CPU / 20 GPU, 64 GB, macOS 27.0.1 | OK |
| Node 24.22 / npm 11.19 | OK |
| FFmpeg 9.0.2 con libx264, libx265, h264/hevc/prores_videotoolbox, libsvtav1; **sin libwebp** | posters con `sharp` |
| `venhance 0.1.0` (`upscale --model realesr-general|realesr-anime|realesrgan-x4plus`), modelos general y anime descargados | OK |
| Playwright 1.64, Chrome, Safari | QA |

## MiniMax H3 (local, `~/AI-Video-Lab`)
- Runtime `environments/mlx-h3-src/.venv/bin/mlx-h3` (pure MLX, pre-alpha). Flags reales en `mlx-h3 --help`. FL2VA = `--first-frame` + `--last-frame` + `--dit dit_fl2va_a8g32.safetensors`. Sin `--ref-*`.
- Límites: canvas múltiplo de 32 y ≤ 768×1344 px; frames `17n+5` (124 = 5.17 s @ 24 fps); Turbo 4–8 pasos.
- Medición previa (`results/historia/m2/log-fl.txt`): 1024×576 × 124 f × 8 pasos ≈ 14 min, pico 28 GB.
- Licencia: MiniMax H3 Community License. Territorio excluye UE, UK, Corea del Sur y EE. UU.; pide mostrar "MiniMax H3" en la UI de productos comerciales y recomienda identificador de IA. Decisión: crédito en el footer; ver `PIPELINE.md`.

## Repositorio UNBIDDEN
- `satisfymath/unbidden-ai`, main = 5ecd617, versión 0.12.2 "experimental candidate (not 1.0)".
- Releases v0.9.0 … v0.12.2 con wheel, `SHA256SUMS` e `install.sh`. `https://unbidden.cl/install.sh` responde 200.
- Logo vectorial: `frontend/public/unbidden.svg` (anillo abierto + punto). Wordmark TUI `UNBiDDEN` (`unbidden/tui/brand.py`), igual que el frame 8.
- Fact sheet completo con citas: `CONTENT_SOURCES.md`.

## Skills de referencia
- `elayadesign/ai-design-skills` → `skills/landing-page-design/SKILL.md` (MIT). Copia local ya existente en `~/baskerville-landing/.claude/skills/landing-page-design/`.
- `oso95/scroll-world` → `skills/scroll-world/` (MIT). Motor `references/scrub-engine.js` adaptado en `src/film/` (ver `CREATIVE_ARCHITECTURE.md`). **No se usan sus servicios de generación.**
