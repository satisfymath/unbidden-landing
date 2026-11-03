# Estado de los clips — UNBIDDEN: THE UNKNOWN

Perfil: MiniMax H3 FL2VA, Turbo LoRA v4 step600 ema, 1024×576, 124 frames (5.17 s @ 24 fps), 8 pasos, `--budget 50`, 100 % local. QC = SSIM/PSNR (`scripts/h3/qc_compare.zsh`) del primer y último frame reales contra el keyframe objetivo + inspección visual de la hoja de contactos (`production/frames/clip-NN/sheet.png`). Referencia: SSIM entre dos keyframes consecutivos distintos ≈ 0.59 (kf-1 vs kf-2).

| Clip | Inicio → fin | Seed | Tiempo | Pico | SSIM primer frame | SSIM último frame | Veredicto |
|---|---|---|---|---|---|---|---|
| 01 | kf-1 → kf-2 | 1 | 16.1 min | 28.2 GB | 0.908 (vs kf-1) | 0.869 (vs kf-2) | **Aprobado.** Pedestal descendente limpio; planeta, huracán, luces y luna estables; el astronauta aparece de pie en la cresta y no se mueve. Observación menor: entre los frames 20–30 el casco entra por el borde inferior unos frames antes que la roca bajo sus pies (≈0.3 s), plausible como entrada por el borde del encuadre. |
| 02 | último frame real de 01 → kf-3 | 1 | 16.0 min | 28.2 GB | = último de 01 | 0.874 (vs kf-3) | **Aprobado.** Push-in constante desde atrás; el astronauta crece de figura diminuta a plano medio sin moverse; planeta, luces y luna fijos; mochila con emblema legible al final. |
| 03 | último real de 02 → kf-4 | 1 | 15 min | 28.2 GB | = último de 02 | **0.941** (vs kf-4) | **Aprobado con nota.** Push-in desde atrás hasta casco y mochila; emblema anillo+punto legible; planeta y luna fijos. Nota: entre los frames ~33–90 aparece un pequeño detalle rojo en la mochila que no existe en los masters y desaparece al final → candidato a regenerar con seed 2 al cierre. |
| 04 | último real de 03 → kf-5 | 1 | 15 min | 28.2 GB | = último de 03 | **0.933** (vs kf-5) | **Aprobado.** Arco corto de la nuca al perfil del casco; visor con el reflejo del planeta; cabeza y cuerpo inmóviles; luna fija. |
| 05 | último real de 04 → kf-6 | 1 | 15 min | 28.2 GB | = último de 04 | **0.891** (vs kf-6) | **Aprobado.** Retroceso con desplazamiento lateral; el astronauta sigue de pie en todo el tramo (nunca se sienta ni se agacha); planeta y luna fijos. Nota menor: un parche de bandera aparece en el brazo en los frames ~11–33 y desaparece. |
| 06 | último real de 05 → kf-7 | 1 | | | | | en generación |
| 07 | último real de 06 → kf-8-clean | | | | | | pendiente (clean plate listo: `production/plates/kf-8-clean.png`) |

Artefactos por intento: `production/clips/clip-NN/sSEED/{master-audio.mp4, master.mp4, prompt.txt, cmd.sh, log.txt, run.json}`; frames reales en `production/frames/clip-NN/`.

## Postproducción decidida en el clip 01
- Upscale: A/B entre Real-ESRGAN general ×2 (venhance) + Lanczos 1080p y Lanczos puro. ESRGAN solo se ve pintado y sobre-afilado; Lanczos solo, blando. **Elegido: mezcla 50/50** (`scripts/post/upscale.zsh` → `*-blend.mov`).
- Encodes web (`scripts/post/encode_web.zsh`, denoise `hqdn3d=1.5:1.5:4:4`, sin B-frames, faststart, sin audio):

| Variante | Parámetros | Clip 01 |
|---|---|---|
| desktop H.264 | 1920×1080, CRF 25, GOP 12 | 4.6 MB |
| desktop HEVC (hvc1) | 1920×1080, q 50, GOP 12 | 2.1 MB |
| mobile H.264 | 960×540, CRF 27, GOP 8 | 1.4 MB |
| mobile HEVC (hvc1) | 1280×720, q 50, GOP 8 | 1.3 MB |

Descartados: CRF 20 GOP 8 (9.2 MB desktop), CRF 23 GOP 12 (6.0 MB). El navegador elige HEVC solo si `canPlayType('video/mp4; codecs="hvc1.1.6.L120.B0"')` devuelve `probably` (Safari y Chrome con decodificación por hardware); H.264 en el resto.
- Verificado en Google Chrome real (Playwright, canal chrome): el clip 01 carga como Blob, `seekable` completo, el frame pintado sigue al scroll en ambas direcciones, sin errores de consola.
