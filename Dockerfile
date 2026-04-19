# syntax=docker/dockerfile:1
# Production-only deps stage. Uses npm ci --omit=dev so the lockfile's
# `dev: true` packages are skipped, producing a smaller, runtime-only
# node_modules tree we copy into the runner stage.
FROM node:24-alpine AS prod-deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/docker/prune-runtime-deps.sh /usr/local/bin/prune-runtime-deps.sh
RUN npm ci --omit=dev --no-audit --legacy-peer-deps \
 && sh /usr/local/bin/prune-runtime-deps.sh

# Builder stage: full deps + next build to produce .next.
FROM node:24-alpine AS builder
# git is required at build time for git-revision-webpack-plugin to compute the commit hash.
RUN apk add --no-cache libc6-compat git python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --legacy-peer-deps

COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN git config --global --add safe.directory /app \
 && npm run build \
 && rm -rf .next/cache

FROM node:24-alpine AS runner
# tini ensures signals (SIGTERM from `docker compose down`) reach Node properly as PID 1.
RUN apk add --no-cache libc6-compat tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# All runtime artefacts are copied owned by root with read-only perms
# (0555 = r-xr-xr-x). The `nextjs` user only needs to read/load these
# and traverse directories - they should not be able to mutate the
# image FS, and they should not own the resources (a non-root owner can
# always chmod themselves write back). Writable runtime state (cache,
# uploads, config) is re-prepared in the RUN layer below.
COPY --from=prod-deps --chown=root:root --chmod=0555 /app/node_modules ./node_modules
COPY --from=builder --chown=root:root --chmod=0555 /app/.next ./.next
COPY --from=builder --chown=root:root --chmod=0555 /app/public ./public
COPY --from=builder --chown=root:root --chmod=0555 /app/server ./server
COPY --from=builder --chown=root:root --chmod=0555 /app/cli ./cli
COPY --from=builder --chown=root:root --chmod=0555 /app/bin ./bin
COPY --from=builder --chown=root:root --chmod=0555 /app/server.js ./server.js
COPY --from=builder --chown=root:root --chmod=0555 /app/docker-entrypoint.js ./docker-entrypoint.js
COPY --from=builder --chown=root:root --chmod=0555 /app/next.config.js ./next.config.js
COPY --from=builder --chown=root:root --chmod=0555 /app/package.json ./package.json

# Writable runtime state. Created AFTER the COPYs above so this layer
# wins over any same-named directories the COPY may have brought in
# (e.g. `public/images/opengraph/cache` is tracked in the repo).
# Docker mounts VOLUME contents on top of these dirs at container
# start; the perms here only matter for the brief window before any
# named/anonymous volume is mounted, and as the seed permissions of
# anonymous volumes Docker creates from these paths.
RUN mkdir -p /app/.next/cache/images \
             /app/uploads/documents \
             /app/config \
             /app/public/images/opengraph/cache \
 && chown -R nextjs:nodejs /app/.next/cache \
                           /app/uploads \
                           /app/config \
                           /app/public/images/opengraph/cache \
 && chmod -R u+w /app/.next/cache \
                 /app/uploads \
                 /app/config \
                 /app/public/images/opengraph/cache

VOLUME /app/.next/cache/images
VOLUME /app/public/images/opengraph/cache
VOLUME /app/uploads/documents
VOLUME /app/config

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "docker-entrypoint.js"]
