#!/bin/sh
# Adds to dist/ what unbidden.cl must serve besides the landing: the product's installer, as it is on its main.
# Pages replaces the whole site on every deploy, so a build without install.sh would break `curl ... | sh`.
set -eu
URL="https://raw.githubusercontent.com/satisfymath/unbidden-ai/main/install.sh"
[ -f dist/index.html ] || { echo "no dist/index.html: run npm run build first" >&2; exit 1; }
[ -f dist/_headers ] || { echo "no dist/_headers" >&2; exit 1; }
curl -fsSL --retry 3 "$URL" -o dist/install.sh
[ "$(head -c 9 dist/install.sh)" = '#!/bin/sh' ] || { echo "dist/install.sh is not the installer" >&2; exit 1; }
# Cloudflare Pages takes at most 20,000 files of 25 MiB each
big=$(find dist -type f -size +25M)
[ -z "$big" ] || { echo "over 25 MiB: $big" >&2; exit 1; }
echo "dist ready: $(find dist -type f | wc -l | tr -d ' ') files, $(du -sh dist | cut -f1), install.sh included"
