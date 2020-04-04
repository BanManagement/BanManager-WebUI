# ---- Base Node ----
FROM node:12-alpine AS base
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python make g++
# set working directory
WORKDIR /usr/src/app
# copy project file
COPY package*.json ./

#
# ---- Dependencies ----
FROM base AS dependencies
# install node packages
RUN npm set progress=false && npm config set depth 0
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm ci --no-audit --only=production

#
# ---- Release ----
FROM base AS release
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# copy app sources
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# expose port and define CMD
EXPOSE 3000

# Run container as non-root (unprivileged) user
USER node

CMD [ "node", "server.js" ]
