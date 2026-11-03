# Keyframes V3 — regenerados con FLUX 3 para continuidad

## Por qué
Los clips V2 a 1344×768 ganaron definición, pero heredaron incoherencias de los masters: el planeta del fondo cambia de cara entre 5 y 6A (huracán → luces de ciudad), el casco cambia de forma entre ángulos, y el modelo de video "inventa" la transición. El problema está en las imágenes, no en el video. Generación de video detenida el 2026-11-03 07:5x; V2 archivado en `production/v2/`.

## Método (`scripts/v3/frames.py`, FLUX 3 Image Klein, mflux MLX q8, 16 pasos, 1344×768, local)
1. **Hoja de identidad** (`production/v3/frames/sheet.png`): el astronauta canónico en cuatro vistas (espalda, perfil derecho, frente, perfil izquierdo), unificado desde los masters 4, 6C, 6E y 6F.
2. **Mundo fijo** (texto idéntico en todos los prompts): el astronauta mira al planeta; mitad izquierda del planeta con luces de ciudad, mitad derecha con el huracán (vistos desde atrás); luna arriba a la derecha; luz baja desde la derecha. El planeta nunca se mueve: lo que se ve depende sólo de dónde está la cámara. De frente, el planeta sólo aparece reflejado en el visor.
3. **Rumbo de cámara explícito por frame** (0 = detrás, 90 = lado derecho, 180 = frente, 270 = lado izquierdo, 360 = detrás): 1–4 a 0°, 5 a 45°, 6A a 100°, 6B a 140°, 6C a 180°, 6D a 220°, 6E a 270°, 6F a 320°, 7–8 a 360°. Corrige, por ejemplo, que en 6A el fondo derecho debe mostrar el lado del huracán.
4. **Encadenado**: cada frame recibe (a) su master aprobado como guía de composición, (b) el frame nuevo anterior para luz, color y materiales, (c) la hoja de identidad.
5. Revisión visual por bloques (1–4, órbita 5–6F, 7–8) antes de seguir; un frame que rompe la continuidad se regenera con otra seed antes de pasar al siguiente.

Los masters de `sequence/` no se modifican.
