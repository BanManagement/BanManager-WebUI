# Install dependencies only when needed
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --legacy-peer-deps

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
RUN apk add --no-cache git

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN git config --global --add safe.directory /app

RUN npm run build

# Production image, copy all the files and run next
FROM node:18-alpine AS runner
RUN apk add --no-cache git
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /app/.next/cache/images && chown nextjs:nodejs /app/.next/cache/images

COPY --from=builder --chown=nextjs:nodejs /app ./

VOLUME /app/.next/cache/images
VOLUME /app/public/images/opengraph/cache

USER nextjs

RUN git config --global --add safe.directory /app

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
