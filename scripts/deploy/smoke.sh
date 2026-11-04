#!/bin/sh
# What must hold on a published site: scripts/deploy/smoke.sh <base-url> (dist/ is the build just published).
set -eu
BASE="${1%/}"
fail() { echo "SMOKE FAILED: $1" >&2; exit 1; }
curl -fsS --retry 5 --retry-all-errors --retry-delay 4 "$BASE/" -o /tmp/smoke-home.html || fail "home"
grep -q '<title>UNBIDDEN' /tmp/smoke-home.html || fail "the home is not the landing"
curl -fsS --retry 3 "$BASE/install.sh" -o /tmp/smoke-install.sh || fail "install.sh"
cmp -s /tmp/smoke-install.sh dist/install.sh || fail "install.sh differs from the build"
curl -fsSI "$BASE/install.sh" | grep -qi '^content-type: text/plain' || fail "install.sh is not text/plain"
clip=$(cd dist && find media/film/desktop -name 'clip-1-2.mp4' | head -1)
[ -n "$clip" ] || fail "no first clip in the build"
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Range: bytes=0-1023' "$BASE/$clip")
[ "$code" = 206 ] || [ "$code" = 200 ] || fail "$clip answered $code"
echo "smoke ok: $BASE (clip answered $code)"
