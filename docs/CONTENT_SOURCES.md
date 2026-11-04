# Fuentes de cada texto de terminal y de cada cifra

Repositorio: `satisfymath/unbidden-ai`. Las referencias con línea son de `main` en `5ecd617` (v0.12.2, 2026-11-03) salvo que indiquen `b8082e9` (v0.17.1, 2026-11-04) o `v0.18.1`. Los textos se copian tal cual; nada se inventa. Donde el repo no fija un valor, la web muestra "—".

| Bloque en la web | Archivo de contenido | Fuente en el repo |
|---|---|---|
| Marca: anillo abierto (hueco 39.5°–50.5°, trazo 0.055 R, extremos redondos) y punto (r 0.122 R a 47°, 1.263 R del centro); wordmark `UNBiDDEN` | `src/ui/Logo.tsx`, `public/media/brand/{mark.svg,wordmark-white.png,lockup-white.png}`, `brand/mark.braille.txt` | Logotipo oficial entregado por David (`brand/unbidden-logo-official.png`), medido con `scipy` (el SVG del repo `frontend/public/unbidden.svg` tiene el hueco en otro sitio y no se usa) |
| Paleta de los paneles | `src/styles/tokens.css` → `--term-*` | derivada de `unbidden/tui/app.py:34-48`, ajustada al negro puro de la página |
| Los 39 nombres en movimiento | `product.ts` → `CORPUS` | `b8082e9`: `bench/campaign13/corpus.yaml` |
| Cabecera de panel `○˙ UNBiDDEN  campo · campo … versión` | `src/console/Term.tsx` | `unbidden/tui/state.py:103,133`; `widgets.py:40-50` |
| Réplica de la app (feed, /inbox, /why, /activity, /help, /kill, /resume, /ask, /setup, cabecera y barra) | `src/content/tui-recording.json`, `tui.ts`, `AppReplay.tsx` | grabado con `scripts/tui/record.py` desde `unbidden.tui` 0.17.1 (`b8082e9`), sin agente ni modelos, sobre una copia de `~/unbidden-lab/c13/fst/.unbidden` (campaña 13, desarrollo) y un repo vacío para el setup; de la barra se quitan los campos propios del entorno de grabación (ollama, spend cap, antigüedad). La pregunta del tope mensual es `director.asks.for_spend(2.0, 2.0)` abierta en la copia. Se omiten líneas de contabilidad repetidas (`NOISE` en `tui.ts`) |
| Spinner | `console.ts` → `SPINNER` | frames `dots` de cli-spinners; el CLI usa el spinner por defecto de Rich |
| Diagrama del ciclo (observe / research / lab / publish / operate) | `console.ts` → `CYCLE_NODES` | `docs/ARCHITECTURE.md:11-19` |
| Mandato YAML | `console.ts` → `MANDATE_YAML` | `docs/RELEASE.md:279-295` |
| Permisos y valores | `console.ts` → `PERMISSIONS`, `PERMISSION_VALUES` | `docs/RELEASE.md:114-117` |
| Modos y lo que cada uno documenta | `console.ts` → `MODES`, `EVERY_MODE` | `README.md:92-104` |
| Salida de `unbidden mode` | `console.ts` → `MODE_OUTPUT` | `unbidden/cli.py:517-529` |
| Kill switch (app y CLI) | `console.ts` → `KILL` | `unbidden/tui/text.py:91-93`; `unbidden/cli.py:1863,1875` |
| `unbidden --help`: 45 comandos | `console.ts` → `HELP` | `b8082e9`: `unbidden/cli.py:2288-2449`, `unbidden/distribution/__init__.py:175-178` (45 comandos; la agrupación por pestañas es del sitio, `COMMAND_GROUPS`) |
| `unbidden doctor` | `console.ts` → `DOCTOR` | `docs/bench/product-walk-2026-11-01/walk-stdout.log:66-83` (grabado en un Apple M5 Pro con la versión 0.9.0 del walk) |
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
| Holdout 7/10, 0/7 | `docs/EVIDENCE.md` ("Across unseen repositories") |
| Negativo honesto de Conduit (−1 %, p = 0.9) | `cycles.log:258-260` |

## No se muestra (texto obsoleto o ajeno)
Rutas temporales y trazas de Playwright del product walk; "asking the local model for a candidate" (bug corregido en 0.12.2); `RELEASE.md` "No public release"; la milestone "arrives with delivery D"; el `US$0.96` y `mealie 14.5 s → 7 ms L3` del sitio anterior.
| mealie 11.8 → 2.2 ms L5 en SQLite; Postgres 5.3 → 5.0 ms L5 inválido; 56 endpoints sin cambio | `b8082e9`: `docs/EVIDENCE.md`, `docs/DECISIONS.md` D-035, D-036, D-041 |

## Campaña 12 (39 repositorios) y lo posterior
| Cifra | Fuente |
|---|---|
| 39/39 setup, start, segundo start rechazado, stop, dashboard; 0 intervenciones | `feat/64-campaign`: `docs/bench/campaign12/REPORT.md` §2, §9, §13; `b8082e9`: `docs/DECISIONS.md` D-065 |
| Checks verdes 8/12, 3/19 (7/19 con Debian), 1/8 (4 fuera de alcance) | `REPORT.md` §3, §12b, §13; `docs/ROAD-TO-1.0.md` §3 |
| PR publicado 3/4 (fst, rich, spoolman), 1/8 (misago) | `REPORT.md` §5, §12b; repos con modelos reales: §1 |
| Cadena completa 2/4 (fst dos veces, spoolman con tope US$10), 14.69 → 2.77 ms | `REPORT.md` §7, §8, §12b; github.com/satisfymath/c12-spoolman/pull/1 |
| 17 de 24 runs sin publicar; US$2.10 | `REPORT.md` introducción, §5 |
| 5 de 8 PR verdes en CI; 3 rojos por `black`; luego 1 rojo por `mypy` | `REPORT.md` §6, §12b |
| Versiones 0.13, 0.14, 0.16, 0.17 | `b8082e9`: `docs/RELEASE.md`; `docs/bench/campaign13/FINDINGS.md` |
| Cinco clases y criterios de 1.0; bloqueos retry/ask/declare | `b8082e9`: `docs/ROAD-TO-1.0.md` §2-4 |

## Corridas de desarrollo de la campaña 13 (v0.18.1, `700a5da`)
| Cifra | Fuente |
|---|---|
| 23 de 39, 15 suites, 18.734 tests, 3 apps levantadas, 2 drills, 1 L5, US$0.34; resultado de cada repo | `docs/bench/campaign13/DEV-EVIDENCE.md`, `dev-evidence.json` (copiado tal cual a `src/content/dev-evidence.json`); conteos cruzados con cada `A.json`, `B1.json`, `ci_real-*.jsonl`, `repair_*.log` |
| 11 dev, 3 independientes, 1 frontier entre las 15; los 16 fuera | Cruce con `bench/campaign13/corpus.yaml` (cálculo del sitio) |
| fst L5 por verified deploy, sin efecto medido; PR #4 | `rehearsal-0.18/fst/B1.json`, `docs/RELEASE.md` 0.18.0; github.com/satisfymath/c13-fst/pull/4 (merged) |
| Salvedad del drill de misago: juzgó la salud en mailpit | `dev-host/misago-final.json` (`health_url` puerto 61027 = `mailpit:8025`); `DEV-EVIDENCE.md` "Records"; `docs/RELEASE.md` 0.18.1 |
| "Latency L5 en campaña 12" (fst, spoolman) | `DEV-EVIDENCE.md`; `docs/ROAD-TO-1.0.md` línea de L5, "2 applications, 1 class" |
| Comandos `host` y `export` | `unbidden/cli.py` en v0.18.1 |

La réplica de la app sigue siendo la grabación de 0.17.1, y así lo dice la web.

`REPORT.md` existe solo en el clon local (`~/unbidden-ai-campaign`): esos commits de `feat/64-campaign` no están en GitHub. La web enlaza D-065, que resume parte de estas cifras, y el corpus público.
