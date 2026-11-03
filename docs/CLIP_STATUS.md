# Estado de los clips — UNBIDDEN: THE UNKNOWN

Perfil: MiniMax H3 FL2VA, Turbo LoRA v4 step600 ema, 1024×576, 124 frames (5.17 s @ 24 fps), 8 pasos, `--budget 50`, 100 % local. QC = SSIM/PSNR (`scripts/h3/qc_compare.zsh`) del primer y último frame reales contra el keyframe objetivo + inspección visual de la hoja de contactos (`production/frames/clip-NN/sheet.png`). Referencia: SSIM entre dos keyframes consecutivos distintos ≈ 0.59 (kf-1 vs kf-2).

| Clip | Inicio → fin | Seed | Tiempo | Pico | SSIM primer frame | SSIM último frame | Veredicto |
|---|---|---|---|---|---|---|---|
| 01 | kf-1 → kf-2 | 1 | 16.1 min | 28.2 GB | 0.908 (vs kf-1) | 0.869 (vs kf-2) | **Aprobado.** Pedestal descendente limpio; planeta, huracán, luces y luna estables; el astronauta aparece de pie en la cresta y no se mueve. Observación menor: entre los frames 20–30 el casco entra por el borde inferior unos frames antes que la roca bajo sus pies (≈0.3 s), plausible como entrada por el borde del encuadre. |
| 02 | último frame real de 01 → kf-3 | 1 | — | — | — | — | en generación |
| 03 | último real de 02 → kf-4 | | | | | | pendiente |
| 04 | último real de 03 → kf-5 | | | | | | pendiente |
| 05 | último real de 04 → kf-6 | | | | | | pendiente |
| 06 | último real de 05 → kf-7 | | | | | | pendiente |
| 07 | último real de 06 → kf-8-clean | | | | | | pendiente (clean plate listo: `production/plates/kf-8-clean.png`) |

Artefactos por intento: `production/clips/clip-NN/sSEED/{master-audio.mp4, master.mp4, prompt.txt, cmd.sh, log.txt, run.json}`; frames reales en `production/frames/clip-NN/`.
