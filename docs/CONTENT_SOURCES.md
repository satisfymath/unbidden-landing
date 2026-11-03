# Fuentes de cada texto de terminal y de cada cifra

Repositorio: `satisfymath/unbidden-ai`, rama `main` en `5ecd617` (v0.12.2, 2026-11-03). Los textos se copian tal cual; nada se inventa. Donde el repo no fija un valor, la web muestra "—".

| Bloque en la web | Archivo de contenido | Fuente en el repo |
|---|---|---|
| Splash del Uplink: anillo braille, punto ámbar, `U N B i D D E N`, tagline, cuatro verbos | `src/content/console.ts` → `TUI`, `SPLASH_ROWS` | `unbidden/tui/brand.py:7-20` (`MARK`, `WORDMARK`, `TAGLINE`, `VERBS`, `ACCENT`, `RING`, `DOT`); la tagline se oculta bajo 66 columnas como en `banner()` |
| Marca: anillo abierto (hueco 39.5°–50.5°, trazo 0.055 R, extremos redondos) y punto (r 0.122 R a 47°, 1.263 R del centro); wordmark `UNBiDDEN` | `src/ui/Logo.tsx`, `public/media/brand/{mark.svg,wordmark-white.png,lockup-white.png}`, `brand/mark.braille.txt` | Logotipo oficial entregado por David (`brand/unbidden-logo-official.png`), medido con `scipy` (el SVG del repo `frontend/public/unbidden.svg` tiene el hueco en otro sitio y no se usa) |
| Paleta de los paneles | `src/styles/tokens.css` → `--term-*` | `unbidden/tui/app.py:34-48` |
| Cabecera de panel `○˙ UNBiDDEN  campo · campo … versión` | `src/console/Term.tsx` | `unbidden/tui/state.py:103,133`; `widgets.py:40-50` |
| Feed: verbos `> Discovering.` y líneas `HH:MM:SS  texto` | `src/console/LogStream.tsx` | formato: `unbidden/tui/widgets.py:72-101`; mapa evento→verbo: `tui/feed.py:32-73` |
| Líneas del feed (ciclo real de Conduit) | `console.ts` → `FEED` | `docs/bench/stage10-regression/v4-3b5b99d/conduit/R10-B-1/cycles.log:1-11, 232-262` (se omite el fallo de build de dependencias de las líneas 12-231) |
| Barra de estado `● agent`, `ollama ✓`, `The last N things it did.` | `console.ts` → `BAR`; `Intelligence.tsx` | `unbidden/tui/text.py:21-31`, `"open.events"` en `text.py` |
| Spinner | `console.ts` → `SPINNER` | frames `dots` de cli-spinners; el CLI usa el spinner por defecto de Rich |
| Diagrama del ciclo (observe / research / lab / publish / operate) | `console.ts` → `CYCLE_NODES` | `docs/ARCHITECTURE.md:11-19` |
| Mandato YAML | `console.ts` → `MANDATE_YAML` | `docs/RELEASE.md:279-295` |
| Permisos y valores | `console.ts` → `PERMISSIONS`, `PERMISSION_VALUES` | `docs/RELEASE.md:114-117` |
| Modos y lo que cada uno documenta | `console.ts` → `MODES`, `EVERY_MODE` | `README.md:92-104` |
| Salida de `unbidden mode` | `console.ts` → `MODE_OUTPUT` | `unbidden/cli.py:517-529` |
| Kill switch (app y CLI) | `console.ts` → `KILL` | `unbidden/tui/text.py:91-93`; `unbidden/cli.py:1863,1875` |
| `unbidden --help`: usage, descripción, opciones, 43 comandos | `console.ts` → `HELP` | `unbidden/cli.py:2131-2302` (`build_parser`, `command(...)`), `unbidden/distribution/__init__.py:175-178` |
| `unbidden doctor` | `console.ts` → `DOCTOR` | `docs/bench/product-walk-2026-11-01/walk-stdout.log:66-83` (grabado en un Apple M5 Pro con la versión 0.9.0 del walk) |
| Pantalla home sin comando | `console.ts` → `HOME` | `walk-stdout.log:85-92` |
| Slash commands y atajos | `console.ts` → `SLASH`, `PROMPT_PLACEHOLDER`, `KEYS` | `unbidden/tui/text.py:34-71, 124, 129-132` |
| Plantillas de frases del feed | `console.ts` → `TEMPLATES`, `LEVEL_NAMES` | `unbidden/tui/text.py:149-205` |
| Niveles L1–L6 | `console.ts` → `LEVELS`; `product.ts` → `EVIDENCE.levels` | `docs/RELEASE.md:133-140`; `README.md:110-117` |
| Bloque "Then:" de instalación y `--version` | `console.ts` → `THEN`, `INSTALL_LINE`, `VERSION_LINE` | `README.md:39-49, 56-65` |

## Cifras del Acto III
| Cifra | Fuente |
|---|---|
| FastAPI `GET /api/v1/items/` 11.74 → 3.65 ms (+69 %), p = 0.0286, A/A −2 %, L4 confirmado, US$0.0292 | `docs/bench/stage10-revalidation/v4-dec7ba2/README.md:9-12` |
| Primera medición 13.0 → 4.1 ms, p = 3.4e-08 ("pending revalidation") | `docs/DECISIONS.md` D-010 (L83–87); `docs/EVIDENCE.md:32` |
| Revalidación "inconclusive, level 1 after" | `docs/bench/stage10-revalidation/v4-f9fe965/README.md:6` |
| Producción 10.5 → 1.7 ms, "no change claimed", L4 no L5 | `docs/DECISIONS.md` D-014 (L140–143); `docs/EVIDENCE.md:33` |
| PR mergeado en modo autonomous | `docs/DECISIONS.md` D-013; github.com/satisfymath/full-stack-fastapi-template/pull/1 |
| Rich: dos crashes, L4 en 58 s, PR abierto | `docs/DECISIONS.md` D-018 (L215–227); github.com/satisfymath/rich/pull/1 |
| Drill: 11 s / 15 s, escenario "release 1.6 broke the database pool" | `docs/DECISIONS.md` D-015 (L151–160); `demo/fastapi-template/team_breaks_health.sh` |
| Holdout 7/10, 0/7, US$1.24 | `docs/EVIDENCE.md:44-84, 95` |
| Negativo honesto de Conduit (−1 %, p = 0.9) | `cycles.log:258-260` |

## No se muestra (texto obsoleto o ajeno)
Rutas temporales y trazas de Playwright del product walk; "asking the local model for a candidate" (bug corregido en 0.12.2); `RELEASE.md` "No public release"; la milestone "arrives with delivery D"; el `US$0.96` y `mealie 14.5 s → 7 ms L3` del sitio anterior.
