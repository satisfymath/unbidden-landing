# Publicar la landing

`unbidden.cl` es Cloudflare Pages (proyecto `unbidden`). Este repo publica la landing y le suma el `install.sh` de `satisfymath/unbidden-ai`. Todo lo hace `.github/workflows/site.yml`.

## Actualizar algo
```sh
git switch main && git pull
git switch -c fix/lo-que-sea
# editar; para mirar en local: npm run dev
git add <archivos> && git commit -m "..."
git push -u origin HEAD
```
1. El push corre lint, build y QA, y publica una **preview**. La URL queda en el resumen del run (`gh run view --web`) y también como `https://<rama>.unbidden.pages.dev` (con `/` y otros símbolos convertidos a `-`). El dominio no se toca.
2. Si te gusta, abre el PR y haz merge a `main` (o `git switch main && git merge --ff-only <rama> && git push`).
3. El push a `main` repite los checks y publica en **unbidden.cl**, y al final comprueba la portada, `install.sh` y un clip en el dominio real. Si un check falla, no se publica.

## Volver atrás
En Cloudflare: Pages → `unbidden` → Deployments → el deploy anterior → **Rollback**. Es inmediato. Después corrige `main`, o el siguiente push vuelve a publicar lo que tenga.

## El instalador
Cloudflare reemplaza el sitio completo en cada deploy, por eso cada build incluye `install.sh`. Cada 6 horas el workflow compara el del sitio con el de `main` del producto y republica solo si cambió. Sin versión, el script instala el último release, así que un release nuevo no necesita ese paso. Para un arreglo urgente del instalador: Actions → Site → Run workflow sobre `main`, o `gh workflow run site.yml --ref main`.

Si el sitio se publica desde otro lado, `install.sh` puede desaparecer: no usar `wrangler pages deploy` a mano sin `scripts/deploy/assemble.sh`.

## Antes de tocar cifras
Evidencia y comandos salen de `satisfymath/unbidden-ai`: ver `docs/CONTENT_SOURCES.md`. Los niveles L1–L6 son los del repo y no se suben. Las versiones `0.x` del sitio se cambian en `src/content/product.ts` y `src/content/console.ts`.

## Secretos del repo
`CLOUDFLARE_API_TOKEN` (permiso Cloudflare Pages: Edit) y `CLOUDFLARE_ACCOUNT_ID`, en Settings → Secrets and variables → Actions. Sin ellos las ramas solo corren los checks y `main` falla sin publicar.

## Límites
Pages acepta archivos de hasta 25 MiB y 20.000 archivos; `assemble.sh` falla antes si un archivo se pasa.
