# QA — UNBIDDEN: THE UNKNOWN

Última pasada: 2026-11-03 (consola v2). Build `npm run build` (tsc + vite) y `npm run lint` en verde; 14 pruebas Playwright en verde (10 omitidas por proyecto).

## Automatizado (`npm run qa`, Playwright 1.64)
Proyectos: `desktop-chrome` (Google Chrome real, 1440×900), `mobile` (Chromium 390×844, touch), `reduced-motion` (1440×900, `prefers-reduced-motion: reduce`).

| Prueba | Resultado |
|---|---|
| Carga sin errores de consola ni recursos fallidos; `main`, `nav`, un solo `h1`, secciones presentes | ✅ en los tres proyectos |
| Scrub de la película adelante y atrás: poster 1 al inicio, otro frame a mitad, frame 8 al final, vuelve atrás | ✅ desktop y mobile |
| Reduced motion: secuencia estática de 8 frames, sin `<video>` | ✅ |
| Sin desbordamiento horizontal en 360 / 390 / 430 / 768 / 1024 / 1440 / 1920 px | ✅ |
| Teclado: skip link enfocable y funcional; todos los `href` internos existen; todos los externos responden < 400 | ✅ |
| Consola: el feed reproduce ≥ 8 líneas reales con el verbo `Discovering.` primero; el nodo del diagrama se enciende; el conmutador de modos imprime `mode: autonomous (was supervised)`; el kill switch alterna sus mensajes reales | ✅ desktop y mobile |
| `--help` lista los 43 comandos con sus textos; `doctor` muestra `Apple M5 Pro, 64 GB` | ✅ |
| Reduced motion: 43 filas y 21 líneas del feed visibles de golpe, sin typewriter; Uplink estático | ✅ |

## Verificaciones manuales con navegador real (scripts en el scratchpad de la sesión)
- **Google Chrome (canal `chrome`)**: `canPlayType(hvc1)` = `probably` → se sirve HEVC; el clip 01 se carga como Blob, `seekable` completo (5.17 s), el frame pintado sigue al scroll en ambas direcciones; sin errores de consola.
- **WebKit 27.2 (motor de Safari, Playwright)**: mismo resultado: HEVC `probably`, scrub adelante/atrás correcto, sin errores.
- **Safari iOS / Android reales**: pendiente de dispositivo. El motor conserva lo que iOS exige (atributos `muted`/`playsinline`, priming en el primer gesto, poster hasta que el primer frame pinta, relayout solo con cambio de ancho).

## Rendimiento (Chrome, red emulada 1.6 Mbps / 150 ms RTT, 1440×900)
| Métrica | Valor |
|---|---|
| LCP (poster AVIF del frame 1, precargado) | 1.39 s |
| DOMContentLoaded | 1.32 s |
| Transferencia inicial (fuentes, CSS, JS, poster) | 334 KB |
| JS | 77 KB gzip (React + motor) |
| Posters (8 × 2 tamaños × AVIF+WebP) | 2.7 MB en disco; el navegador carga solo el formato y tamaño que usa |
| Clip 01 | desktop H.264 4.6 MB · HEVC 2.1 MB · mobile H.264 1.4 MB · HEVC 1.3 MB |

Los clips se descargan por proximidad (actual ±2 en desktop, ±1 en móvil) y se liberan fuera de esa ventana; nunca se descargan los siete al inicio.

## Pendiente
- Película completa integrada (7 clips) y verificada en Chrome y WebKit; cara a cara H3 768p vs LTX-2.5 en curso (`production/compare/REPORT.md`).
- Dispositivos reales iOS y Android.
