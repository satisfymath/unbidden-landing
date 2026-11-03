# Arquitectura creativa — UNBIDDEN: THE UNKNOWN

## Idea
Una sola película de cámara (ocho fotogramas aprobados, siete transiciones) que el visitante recorre con el scroll, seguida de una parte editorial oscura y precisa sobre el producto real. El astronauta nunca se mueve; la cámara descubre, se acerca, contempla y se aleja. Al final aparece la marca.

## Estructura de la página
| Acto | Sección (`id`) | Contenido |
|---|---|---|
| I — The Unknown | `#film` | Hero sticky de ~1000 vh con scrub de video, posters y beats de texto mínimos; cierre de marca en HTML. |
| II — The Intelligence | `#intelligence` | Qué hace (palabras del README), ciclo OBSERVE · INVESTIGATE · EXPERIMENT · PROVE · PROPOSE (+ OPERATE bajo mandato), control humano con modos y permisos, CLI real, modelos Meta. |
| III — The Evidence | `#evidence` | Niveles L1–L6 y cuatro hallazgos con su nivel y enlaces: FastAPI (L4), Rich (L4, PR abierto), drill de rollback, holdout honesto (0/7). |
| IV — The Invitation | `#install` | Tagline, comando real `curl -fsSL https://unbidden.cl/install.sh | sh`, requisitos, enlaces a GitHub, guía y evidencia. |
| Footer | — | Versión, enlaces, crédito de generación local con MiniMax H3. |

Navegación fija mínima: wordmark, Intelligence, Evidence, GitHub, Install. Tenue sobre la película, sólida al llegar al Acto II.

## Timeline del Acto I (`src/content/film.ts`)
| Ítem | Peso (vh) | Beat |
|---|---|---|
| hold F1 | 0.45 | eyebrow "UNBIDDEN — THE UNKNOWN" + indicador de scroll |
| clip 01 (1→2) | 1.3 | — |
| clip 02 (2→3) | 1.2 | "It doesn't wait to be told where to look." |
| clip 03 (3→4) | 1.2 | — |
| hold F4 | 0.35 | emblema visible, sin texto |
| clip 04 (4→5) | 1.1 | "It observes." |
| clip 05 (5→6) | 1.1 | — |
| clip 06 (6→7) | 1.3 | "Then it proves." |
| clip 07 (7→8 clean) | 1.3 | — |
| hold F8 | 0.8 | logo SVG + "UNBiDDEN" + tagline (solo cuando el clip 07 termina en el clean plate) |

Cada clip: 124 frames a 24 fps (5.17 s). Película completa: 36 s a velocidad nominal; el scroll del visitante decide la duración real. Los movimientos de cámara por clip están en `docs/PIPELINE.md` y en los `prompt.txt` de cada clip.

## Motor de scrub (`src/film/`)
- `timeline.ts`: puro, mapea progreso 0–1 → ítem + t local; testeable.
- `FilmEngine.ts`: adaptación del scrub engine de scroll-world (MIT). Contenedor sticky; un `<video>` por clip creado desde un Blob; ventana de carga ±1 (móvil) / ±2 (desktop) con AbortController y descarga fuera de ventana; seeks snapeados al centro del frame, un seek en vuelo, `requestVideoFrameCallback`; lerp temporal; priming iOS en el primer gesto; relayout solo si cambia el ancho.
- Fallback: mientras un clip no existe o no está cargado, el tramo se muestra como crossfade entre el poster de origen y el de destino, controlado por el scroll. En `prefers-reduced-motion` se renderiza `FilmStatic`: los ocho frames apilados con título y descripción.
- Portrait: `object-position` interpolado entre focal points por keyframe para conservar luna y astronauta.

## Sistema visual
- Paleta derivada de los frames (`src/styles/tokens.css`): `#030508`, `#07101c`, `#0b1a2e`, `#e8f0f8`, `#b7c3cf`, acento ámbar `#e0a060` (luces de ciudad; coincide con el acento ámbar del TUI).
- Tipografía: Geist (variable, autoalojada) para todo; Geist Mono para CLI, cifras, etiquetas. Escala Tailwind; estilo `display` 48–128 px para tagline y cierre. Wordmark "UNBiDDEN" (brand.py) con 0.22em.
- Movimiento: `cubic-bezier(0.22,1,0.36,1)`, 500 ms; reveals de 32 px / 700 ms una sola vez (IntersectionObserver); solo `transform`/`opacity`.
- Excepciones al skill landing-page-design, deliberadas: nav sólida (sin blur), scrim plano sobre el video, display mayor de 60 px, etiquetas del ciclo en mayúsculas mono, sin FAQ/testimonios (no hay clientes), primera pantalla casi sin UI (brief).

## Responsive
Anchos objetivo 360 / 390 / 430 / 768 / 1024 / 1440 / 1920. Desktop: film 1920×1080; móvil: 1280×720 y focal points. Secciones en una columna bajo 760 px; el ciclo pasa a 3 y luego 2 columnas.

## Accesibilidad
`<h1>` oculto con el título y la tagline; lista `sr-only` con la descripción de los ocho frames; video `aria-hidden`; skip link; `nav/main/section` semánticos; foco visible; botón "Skip the film"; modo estático para reduced-motion; contraste ≥ 4.5:1 en texto sobre fondos planos; targets ≥ 44 px.
