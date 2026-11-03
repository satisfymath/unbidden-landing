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

## Resultado (2026-11-03, 09:2x)
13 frames + hoja en `production/v3/frames/` (hoja de contacto: `contact-v3.png`; rechazados en `rejected/`). Ajustes hechos durante la revisión:
- La jerarquía de referencias se invirtió: el master manda en encuadre y escala; el frame anterior sólo color y materiales. Sin eso FLUX copiaba el encuadre del anterior (1, 2 y 3 salían iguales).
- La hoja de identidad sólo se usa en primeros planos; en 6B/6D/6C, cuando se pasaba como referencia, FLUX la copiaba como lámina de estudio. 6C y 6E usan 6A como identidad del casco.
- 5 → 6A: corregido el lado del planeta (sólo huracán, sin ciudades) y 6E con la regla espejo (sólo ciudades, sin huracán).
- 6D es el espejo exacto de 6B re‑renderizado por FLUX para conservar la lectura correcta del emblema: así 6B → 6C → 6D es simétrico por construcción.
- 7 y 8 con escala explícita del astronauta (pequeño y casi invisible).
Emblema: trazado con la geometría oficial del logo (`scripts/v3/emblem.py`): anillo con hueco a 39.5°–50.5°, trazo 0.055 R, punto de 0.122 R a 47° y 1.263 R; ajustado a la perspectiva de cada panel (elipse ajustada sobre la tinta del emblema anterior), borrado previo por inpainting y tinta multiplicada sobre la pintura del panel. Aplicado en 3, 4, 6B, 6D, 6E y 6F; en 2 y 7 el emblema mide menos de 4 px y no se distingue. Originales en `rejected/<frame>-pre-emblem.png`; recortes de control en `emblem-checks.png`.

## Revisión de consistencia del casco (2026-11-03)
Comparación lado a lado de 4, 5, 6A, 6B, 6C, 6D y 6E (`production/v3/frames/helmets.png`). Coinciden en todos: casco blanco con las mismas costuras y polvo, mecanismo lateral redondo con anillos concéntricos y tornillo central, visor negro convexo con marco blanco, clips rectangulares en la corona, banda negra del cuello con hebilla, rejilla de ventilación posterior (visible en 4, 5 y 6E).
Inconsistencia encontrada y corregida: 6B tenía una rejilla nervada que sobresalía detrás del mecanismo lateral y que 5, 6A y 6C no tienen. Se eliminó en 6B ajustando una curva al contorno del casco y rellenando sólo el exterior con el cielo de la misma fila; 6D se rehízo como espejo exacto de 6B (simetría por construcción) y su emblema se volvió a calcar. Originales en `rejected/*-pre-helmetfix.png`.

## Arco 4 → 6A rehecho hacia atrás desde 6A (2026-11-03)
El clip 5→6A mostró un salto del casco en el frame 22: el 5 de FLUX tenía otra forma de casco (rejilla, clips y proporciones distintas al 6A) y H3 la "cambió" a mitad del giro. Solución: el arco se construye **hacia atrás desde 6A** en pasos de ~20–25° con `scripts/v3/arc.py`; cada frame es una edición del vecino (mismo objeto, misma distancia y lente) más el 4 como referencia de la parte trasera. Resultado: `5B` (rumbo ~60°, nuevo intermedio) y `5` (rumbo ~35°), ambos con el casco idéntico al 6A y el emblema heredado del 4 con la forma oficial. Orden actual: `1 2 3 4 5 5B 6A 6B 6C 6D 6E 6F 7 8` (14 frames, 13 tramos).

## Luna
Mundo fijo: la luna está sobre el lado derecho del planeta (el del huracán). Por lo tanto: detrás (1–4, 6F, 7, 8) arriba a la derecha; lado derecho (5, 5B, 6A) arriba a la derecha; de frente (6B, 6C, 6D) fuera de cuadro, sólo reflejada en el visor; lado izquierdo (6E) sobre el planeta a la izquierda (queda en profundidad detrás de él). Corregido: luna suelta borrada en 6B y 6D; luna de 6E trasladada sobre el planeta. Originales en `rejected/*-pre-moonfix.png`.

## Revisión de continuidad completa (2026-11-03, tarde)
**Planeta y luna (modo cinematográfico, aprobado por David):** el planeta y la luna están a distancia infinita; al orbitar sólo se deslizan por el cuadro según hacia dónde mira la cámara. La luna va siempre sobre el lado del huracán.
| Frames | Cámara | Fondo |
|---|---|---|
| 1–4, 6F, 7, 8 | detrás | planeta completo, ciudades izquierda, huracán derecha, luna arriba derecha |
| 5, 5B, 6A | derecha | borde del lado de las ciudades a la derecha, sin huracán, luna fuera de cuadro |
| 6B, 6C, 6D | frente | sin planeta ni luna en el fondo; sólo el reflejo del visor (huracán a la derecha del reflejo) |
| 6E | izquierda | borde del lado del huracán a la izquierda, luna arriba a la izquierda |
Herramienta: `scripts/v3/sky.py` (fondo nuevo por FLUX, astronauta original intacto vía máscara de Apple Vision).
**Traje y casco** (canon = frame 4 / 5B): bloque de ventilación trasero con rejilla, discos laterales blancos sin luces, mochila con ventanitas en las dos esquinas superiores, emblema oficial al centro, panel inferior con ranura ancha, sin ventana central, sin parches en el hombro, sin manguera lateral. Corregido en: 2 (luz roja, ventana central, rejilla, esquinas, emblema), 3 (casco y mochila re‑derivados desde 4; ventana central), 4 (parche y manguera), 6F (rejilla del casco, ventana central). Herramientas: `scripts/v3/pull.py`, `scripts/v3/suit.py`.
**Reflejo:** 6D era espejo de 6B y su reflejo quedaba invertido; repintado sólo dentro del cristal con la orientación de 6C.
Originales de cada corrección en `rejected/`.

## Segunda pasada con `FRAME_CHECKLIST.md` (2026-11-03, noche)
- **Luna**: una sola luna canónica (la del frame 2: cuarto menguante iluminado desde la derecha, mismo tono), radio único de 33 px, puesta en 1, 3, 4, 6E, 6F, 7 y 8 con `scripts/v3/moon.py` (hueco rellenado con cielo real con estrellas). 5B: fragmento de luna vieja eliminado.
- **Planeta**: color igualado al del frame 3 en 4, 5, 5B, 6A y 6E con `scripts/v3/planet_grade.py` (sólo píxeles del planeta).
- **Cielo**: 4 y 5B sin nebulosa/moteado (`scripts/v3/sky_clean.py`, protección del planeta por ajuste robusto del limbo).
- **Suelo**: dominante cálida neutralizada en 4, 5, 5B, 6A, 6E (`scripts/v3/ground_grade.py`).
- **Casco**: 4 con el visor dentro del contorno (sólo asoma el borde); 3 con casco blanco, bloque de ventilación y discos pequeños como el 4.
- **Traje**: 6F sin parche en el brazo; 6A sin relieve tipo laberinto en el hombro.
- **Emblema 6D**: redibujado en la elipse espejo de la del 6B (centro 1117,562; semiejes 14.7×38.8; −20.9°) con el logo sin espejar.
- Medido al final: luna presente sólo donde corresponde; planeta b* −14.5…−16.3 en frames abiertos; suelo neutro.

## Orejeras del casco en 2, 3 y 6F (2026-11-03)
FLUX no conseguía quitar las piezas laterales que sobresalían del casco visto desde atrás (las redibujaba). Solución: el astronauta del 6F se limpió con una edición acotada (semilla 2), y luego se trasplantó a 3 y 2: fondo limpio generado por FLUX sólo detrás del astronauta viejo, el astronauta de 6F alineado por los pies (escalado ×0.405 en el 2) y con la luz igualada al original. En el 3 además se recuperó el huracán a la derecha del planeta (`sky.py` con 6F como referencia de posición). Los tres cuerpos completos (2, 3, 6F) son ahora el mismo astronauta píxel a píxel.
