#!/bin/sh
# Prune the runtime node_modules tree to only contain platform-specific
# binaries we actually need at runtime, and to drop react-icons families
# the application never imports. Run from /app inside the prod-deps stage
# of Dockerfile, after `npm ci --omit=dev`.
#
# Why a script:
#   - Alpine's busybox sh does not support brace expansion, so a single
#     `rm -rf node_modules/foo/{a,b,c}` Dockerfile RUN silently no-ops.
#   - Splitting the prune list out of the Dockerfile makes it easier to
#     review, test in isolation, and update when icon usage changes.
#
# How to refresh react-icons families when imports change:
#   rg -o "react-icons/[a-z0-9]+" --no-filename | sort -u
# Anything not in USED_REACT_ICON_FAMILIES below should be added to
# UNUSED_REACT_ICON_FAMILIES (and removed from USED if no longer imported).

set -eu

cd /app

# Drop platform-specific Next.js SWC binaries we never run on Alpine.
# npm installs every optional platform binary unless `--cpu`/`--os`/`--libc`
# filters match. Our runner image is `node:24-alpine` and the published
# image is multi-arch (linux/amd64 + linux/arm64), so we KEEP both
# `swc-linux-x64-musl` (CI/x86_64 servers) and `swc-linux-arm64-musl`
# (Apple Silicon dev + arm64 servers). Everything else goes.
rm -rf \
  node_modules/@next/swc-darwin-arm64 \
  node_modules/@next/swc-darwin-x64 \
  node_modules/@next/swc-win32-arm64-msvc \
  node_modules/@next/swc-win32-ia32-msvc \
  node_modules/@next/swc-win32-x64-msvc \
  node_modules/@next/swc-linux-x64-gnu \
  node_modules/@next/swc-linux-arm64-gnu

# Drop sharp/libvips binaries for platforms we never run on. KEEP both
# linuxmusl-x64 + linuxmusl-arm64 (and their libvips siblings) so the
# image works on both linux/amd64 (CI/x86_64 prod) and linux/arm64
# (Apple Silicon dev + arm64 prod). The linux-* (glibc) variants are
# unused since our base is Alpine.
rm -rf \
  node_modules/@img/sharp-darwin-arm64 \
  node_modules/@img/sharp-darwin-x64 \
  node_modules/@img/sharp-libvips-darwin-arm64 \
  node_modules/@img/sharp-libvips-darwin-x64 \
  node_modules/@img/sharp-libvips-linux-x64 \
  node_modules/@img/sharp-libvips-linux-arm64 \
  node_modules/@img/sharp-linux-x64 \
  node_modules/@img/sharp-linux-arm64 \
  node_modules/@img/sharp-win32-arm64 \
  node_modules/@img/sharp-win32-ia32 \
  node_modules/@img/sharp-win32-x64

# Drop unused react-icons families. Keep `lib` (shared runtime) and the
# families actually imported by the app. See header comment for refresh
# instructions.
#
# USED_REACT_ICON_FAMILIES (do not delete): ai bi bs fa fi go md ri tb ti
rm -rf \
  node_modules/react-icons/cg \
  node_modules/react-icons/ci \
  node_modules/react-icons/di \
  node_modules/react-icons/fa6 \
  node_modules/react-icons/fc \
  node_modules/react-icons/gi \
  node_modules/react-icons/gr \
  node_modules/react-icons/hi \
  node_modules/react-icons/hi2 \
  node_modules/react-icons/im \
  node_modules/react-icons/io \
  node_modules/react-icons/io5 \
  node_modules/react-icons/lia \
  node_modules/react-icons/lu \
  node_modules/react-icons/pi \
  node_modules/react-icons/rx \
  node_modules/react-icons/si \
  node_modules/react-icons/sl \
  node_modules/react-icons/tfi \
  node_modules/react-icons/vsc \
  node_modules/react-icons/wi

# Drop date-fns CDN bundles. We never load them from Node; they exist
# for browser consumers using <script src="...cdn.js">.
rm -f \
  node_modules/date-fns/locale/cdn.js \
  node_modules/date-fns/locale/cdn.js.map \
  node_modules/date-fns/locale/cdn.min.js \
  node_modules/date-fns/locale/cdn.min.js.map \
  node_modules/date-fns/cdn.js \
  node_modules/date-fns/cdn.js.map \
  node_modules/date-fns/cdn.min.js \
  node_modules/date-fns/cdn.min.js.map
# Same for the duplicate date-fns nested under @nateradebaugh/react-datetime
# (it pins an older major).
rm -f \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/locale/cdn.js \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/locale/cdn.js.map \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/locale/cdn.min.js \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/locale/cdn.min.js.map \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/cdn.js \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/cdn.js.map \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/cdn.min.js \
  node_modules/@nateradebaugh/react-datetime/node_modules/date-fns/cdn.min.js.map

# image-q ships a 13 MB "demo" folder of sample images we never serve.
rm -rf node_modules/image-q/demo

# Strip developer-only artifacts from every published package. These are
# never required at runtime but ship by convention. We deliberately keep
# LICENSE files (often LICENSE.md), package.json, and *.js sources.
#
# Safe deletions:
#   - test / tests / __tests__ / __mocks__   - test fixtures
#   - docs / doc                              - generated documentation
#   - examples / example                      - usage demos
#   - benchmark / benchmarks                  - perf scripts
#   - coverage                                - coverage output
#   - *.map                                   - source maps (debug-only)
#   - *.d.ts                                  - TypeScript declarations
find node_modules \
  \( -type d \
     \( -name test -o -name tests -o -name __tests__ -o -name __mocks__ \
        -o -name docs -o -name doc \
        -o -name examples -o -name example \
        -o -name benchmark -o -name benchmarks \
        -o -name coverage \) \
     -prune -exec rm -rf {} + \) \
  -o \
  \( -type f \
     \( -name '*.map' -o -name '*.d.ts' \) \
     -delete \) \
  2>/dev/null || true
