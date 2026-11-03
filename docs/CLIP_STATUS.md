# Estado de los clips — Cinematic Sequence V2 (13 fotogramas)

Perfil V2: MiniMax H3 FL2VA, **1344×768** (fallback automático 1280×704 si el guardián de memoria corta la generación), Turbo LoRA v4 8 pasos (prueba de 20 pasos sin Turbo en el piloto), `--budget 50`, 24 fps, frames `17n+5` por tramo, 100 % local. Protocolo: `scripts/v2/gen.zsh <from> <to> <frames>` elige el inicio (último frame real del tramo anterior si SSIM ≥ 0.85 contra su master; si no, re‑ancla al master y lo registra), genera, extrae frames reales, hoja de contactos y recorte del visor, y escribe el QC en `production/v2/QC.log`. Prompts en `production/v2/prompts/<from>-<to>.txt` (velocidad constante, astronauta bloqueado, órbita horaria vista desde arriba, geometría del reflejo).

| Tramo | Acto | Frames | Seed | Res. | Tiempo | SSIM primer | SSIM último | Veredicto |
|---|---|---|---|---|---|---|---|---|
| 5→6A | órbita (piloto) | 73 | 1 | 1344×768 | 15 min · 28.7 GB | 0.825 | 0.812 | **Aprobado e integrado.** Órbita continua hacia el frontal, el visor crece y el reflejo cambia con la cámara, el planeta se desplaza a la derecha, luna sale por arriba; sin movimiento del astronauta. Definición claramente superior a V1. Variante de 20 pasos sin Turbo en curso para comparar. |
| 6A→6B | órbita | 73 | | | | | | pendiente |
| 6B→6C | órbita | 90 | | | | | | pendiente |
| 6C→6D | órbita | 90 | | | | | | pendiente |
| 6D→6E | órbita | 73 | | | | | | pendiente |
| 6E→6F | órbita | 107 | | | | | | pendiente |
| 4→5 | órbita | 73 | | | | | | pendiente |
| 6F→7 | pullback | 107 | | | | | | pendiente |
| 7→8 | pullback | 124 | | | | | | pendiente |
| 1→2 | descubrimiento | 107 | | | | | | pendiente |
| 2→3 | descubrimiento | 90 | | | | | | pendiente |
| 3→4 | descubrimiento | 73 | | | | | | pendiente |

Duración nominal: 1080 frames = 45 s. Mientras un tramo no está integrado, la web lo muestra como crossfade entre posters.

## V1 (8 fotogramas, 1024×576) — archivada
Los siete clips V1 aprobados siguen en `production/clips/clip-01…07` y sus encodes en `public/media/film/` (`clip-0N.mp4`); ya no están referenciados por el manifest. Diagnóstico de sus costuras: los frames coincidían (SSIM 0.89–0.96) pero la velocidad no (los prompts pedían frenar al final); V2 lo corrige en el prompt y el motor aplica ease‑in al inicio de cada tramo.

## Cara a cara de calidad (tramo 1→2, keyframes V1)
| Candidato | Res. | Tiempo | Pico | SSIM primer / último | Observación |
|---|---|---|---|---|---|
| H3 Turbo 8 (referencia V1) | 1024×576 | 16 min | 28.2 GB | 0.908 / 0.869 | continuidad correcta |
| LTX‑2.5 two‑stage | 1280×704 | 16.8 min | 26.6 GB | 0.808 / 0.714 | píxel comparable, **continuidad rota**: cámara quieta y terreno que entra de golpe |
| LTX‑2.5 HQ (two‑stages‑hq) | 1920×1088 | ≈ 45 min | — | 0.884 / 0.649 | mucha nitidez, pero la cámara casi no se mueve, el terreno aparece sólo en los últimos frames y **aparece una segunda luna fantasma**; descartado |
| H3 Turbo 8 | 1344×768 | cortado en el paso 7/8 | 30.1 GB | — | guardián de memoria por paginación (OrbStack 6.4 GB + Chrome); se repite con memoria libre en V2 |

Decisión: H3 FL2VA a 768p nativo para V2.
