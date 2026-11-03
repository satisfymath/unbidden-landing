# Pipeline de video local — UNBIDDEN: THE UNKNOWN

Todo corre en el Mac. El navegador solo reproduce MP4 pre-renderizados.

## 1. Plates
`production/plates/kf-N.png` = master `sequence/N.png` escalado a 1024×576 (Lanczos, `force_original_aspect_ratio=increase` + `crop`; recorte < 1 px). `kf-8-clean.png` = frame 8 sin logo/wordmark/tagline (ver §5).

## 2. Generación (FL2VA)
`scripts/h3/fl2va.zsh <clip> <first.png> <last.png> <frames> <seed> <prompt.txt>`
- `mlx-h3` con `--first-frame`, `--last-frame`, `--dit dit_fl2va_a8g32`, Turbo LoRA v4 step600 ema, `--steps 8`, `--width 1024 --height 576 --frames 124 --budget 50`.
- Salida por intento en `production/clips/clip-NN/sSEED/`: `master-audio.mp4` (salida íntegra del modelo), `master.mp4` (`-an -c:v copy`, sin recodificar), `_first.png`, `_last.png`, `prompt.txt`, `cmd.sh` (comando exacto), `log.txt`, `run.json` (tiempos, pico de memoria, frames).
- Prompt: inglés, ~350–400 palabras, estilo fijo + `[Shot 1]`, un solo movimiento de cámara, refusals explícitos (sin zoom, shake, roll, texto, objetos nuevos; el astronauta nunca se mueve).

## 3. Continuidad
- Clip 01 parte de `kf-1` y termina en `kf-2`.
- Clip N (N ≥ 2) parte del **último frame real** del clip N−1 (`production/frames/clip-(N−1)/last.png`) y termina en `kf-(N+1)`. Antes se compara ese último frame con `kf-N` (SSIM/PSNR con `scripts/h3/qc_compare.zsh`); si se aleja, se decide por inspección y se registra en `CLIP_STATUS.md`.
- `scripts/h3/extract_frames.zsh <clip> <master.mp4>` extrae frame 0 y frame final exactos (`select=eq(n,0)` / `eq(n,N-1)`), una hoja de contactos de 12 frames y los deja en `production/frames/clip-NN/`.
- Veredicto por inspección visual de la hoja de contactos: deformación del planeta/luna, ghosting, saltos, astronauta que se mueve o cambia.

## 4. Postproducción
- Upscale: `scripts/post/upscale.zsh` → A/B entre `venhance upscale --model realesr-general --scale 2 --codec prores` + `scale=1920:1080:flags=lanczos` y Lanczos puro. Se elige por inspección; sin sharpening agresivo.
- Encodes web `scripts/post/encode_web.zsh`: H.264 High, `-g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -movflags +faststart -an`, 24 fps. Desktop 1920×1080 CRF 20; mobile 1280×720 CRF 23 `-g 4`. Pesos reales en `CLIP_STATUS.md`.
- Los masters H3 nunca se sobrescriben.

## 5. Frame 8 y branding
El master 8 lleva logo, wordmark y tagline horneados. MiniMax deformaría las letras, así que el clip 07 termina en `kf-8-clean.png` (cielo limpio, mismo encuadre) y el cierre de marca se renderiza en HTML: SVG oficial del repo + "UNBiDDEN" en Geist (0.22em) + tagline, con fundido CSS. El `8.png` aprobado se conserva como poster/fallback.

## 6. Licencia de MiniMax H3
Community License (copia en `~/AI-Video-Lab/models/minimax-h3-8bit-mlx/LICENSE`). Territorio aplicable: mundial **excepto UE, Reino Unido, Corea del Sur y EE. UU.** Productos comerciales deben mostrar "MiniMax H3" en su UI; se recomienda identificador de IA. La landing incluye en el footer: "Film sequence generated locally with MiniMax H3 (FL2VA) on Apple silicon." Alternativa local con licencia comunitaria más amplia: LTX-2.5 (instalado en AI-Video-Lab).
