const next = require('next')

const Koa = require('koa')
const Router = require('@koa/router')
const reqLogger = require('koa-pino-logger')
const session = require('koa-session')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')

const { ApolloServer } = require('@apollo/server')
const { koaMiddleware } = require('@as-integrations/koa')
const schema = require('./graphql/schema')
const loaders = require('./graphql/loaders')
const acl = require('./middleware/acl')

const routes = require('./routes')
const buildHealthRouter = require('./routes/health')
const buildSetupRouter = require('./routes/setup')

const { valid } = require('./data/session')
const { isSetupComplete } = require('./setup/state')

const stripBasePath = (path, basePath) => {
  if (!basePath) return path
  if (path === basePath) return '/'
  if (path.startsWith(basePath + '/')) return path.slice(basePath.length)
  return path
}

const isAllowedSetupPath = (relativePath) =>
  relativePath === '/health' ||
  relativePath === '/setup' ||
  relativePath.startsWith('/setup/') ||
  relativePath.startsWith('/api/setup') ||
  relativePath.startsWith('/_next/') ||
  relativePath.startsWith('/static/')

module.exports = async function ({ dbPool, logger, serversPool, disableUI = false, setupMode = false, setupState = null }) {
  const basePath = process.env.BASE_PATH || undefined

  if (setupMode || !dbPool) {
    return buildSetupModeApp({ logger, basePath, setupState })
  }

  let handle

  if (!disableUI) {
    const dev = process.env.NODE_ENV !== 'production'
    const app = next({ dev })
    handle = app.getRequestHandler()
    await app.prepare()
  }

  const server = new Koa()
  const router = new Router({ prefix: basePath })
  const apolloServer = new ApolloServer(schema({ dbPool, logger, serversPool }))
  const healthRouter = buildHealthRouter({ dbPool, setupMode: false })

  server.keys = [process.env.SESSION_KEY]
  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    server.proxy = true
  }

  server.use(cors())
  server.use(bodyParser())
  server.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      ctx.log.error(err)

      ctx.status = err.status || 500
      ctx.body = { error: (err.exposed || err.expose) ? err.message : 'Internal Server Error' }
      ctx.app.emit('error', err, ctx)
    }
  })
  server.use(async (ctx, next) => {
    ctx.state.dbPool = dbPool
    ctx.state.serversPool = serversPool
    ctx.state.loaders = loaders(ctx)

    ctx.req.loaders = ctx.state.loaders

    return next()
  })
  server.use(reqLogger({ logger }))

  server.use(healthRouter.routes())

  let setupCompleted = await safeIsSetupComplete(dbPool, logger)

  server.use(async (ctx, next) => {
    if (setupCompleted) return next()

    setupCompleted = await safeIsSetupComplete(dbPool, logger)
    if (setupCompleted) return next()

    if (isAllowedSetupPath(stripBasePath(ctx.path, basePath))) return next()

    ctx.status = 302
    ctx.redirect((basePath || '') + '/setup')
  })

  server.use(session({
    key: process.env.SESSION_NAME || 'bm-webui-sess',
    renew: true,
    maxAge: (24 * 60 * 60 * 1000) * 3,
    autoCommit: false,
    httpOnly: true,
    decode (str) {
      const body = Buffer.from(str, 'base64').toString('utf8')
      const json = JSON.parse(body)

      if (json.playerId && json.playerId.type === 'Buffer') json.playerId = Buffer.from(json.playerId.data)

      return json
    },
    sameSite: 'Lax',
    valid (session, data) {
      return valid(data)
    }
  }, server))
  server.use(acl)

  routes(router, dbPool)
  server.use(router.routes())

  await apolloServer.start()

  router.post('/graphql', koaMiddleware(apolloServer, {
    context: async ({ ctx }) => {
      return ctx
    }
  }))

  const setupRouter = buildSetupRouter({ basePath, dbPool })

  server.use(setupRouter.routes())

  if (handle) {
    router.all('(.*)', async ctx => {
      if (ctx.session) await ctx.session.manuallyCommit()

      ctx.response.status = 200

      await handle(ctx.req, ctx.res)
      ctx.respond = false
    })
  } else {
    router.all('(.*)', async ctx => {
      if (ctx.session) await ctx.session.manuallyCommit()

      ctx.respond = false
    })
  }

  server.use(router.allowedMethods())
  server.use(async (ctx) => {
    if (ctx.status === 404) {
      ctx.status = 404
      ctx.body = { error: 'Not Found' }
    }
  })

  return server
}

async function safeIsSetupComplete (dbPool, logger) {
  try {
    return await isSetupComplete(dbPool)
  } catch (err) {
    if (logger) logger.warn({ err }, 'isSetupComplete check failed; assuming setup not complete')
    return false
  }
}

function buildSetupModeApp ({ logger, basePath, setupState }) {
  const server = new Koa()
  const router = new Router({ prefix: basePath })
  const healthRouter = buildHealthRouter({ dbPool: null, setupMode: true, setupState })
  const setupRouter = buildSetupRouter({ basePath, dbPool: null, allowAfterComplete: true })

  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    server.proxy = true
  }

  server.use(cors())
  server.use(bodyParser())
  server.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      if (ctx.log && ctx.log.error) ctx.log.error(err)
      else if (logger) logger.error(err)

      ctx.status = err.status || 500
      ctx.body = { error: (err.exposed || err.expose) ? err.message : 'Internal Server Error' }
      ctx.app.emit('error', err, ctx)
    }
  })
  if (logger) server.use(reqLogger({ logger }))

  server.use(healthRouter.routes())
  server.use(setupRouter.routes())

  server.use(async (ctx, next) => {
    if (isAllowedSetupPath(stripBasePath(ctx.path, basePath))) return next()

    ctx.status = 302
    ctx.redirect((basePath || '') + '/setup')
  })

  server.use(router.routes())
  server.use(router.allowedMethods())

  if (logger) {
    logger.warn({ setupState }, 'Server started in setup mode. Visit /setup to complete installation.')
    if (!process.env.SETUP_TOKEN && !isLoopbackBind()) {
      logger.warn(
        'SETUP_TOKEN is not set and the server appears to listen on a non-loopback interface. ' +
        'Anyone able to reach /setup before you do can take over the WebUI. ' +
        'Set SETUP_TOKEN=$(openssl rand -hex 24) before starting if your install host is reachable from the network.'
      )
    }
  }

  return server
}

const isLoopbackBind = () => {
  const host = process.env.HOSTNAME || process.env.HOST
  if (!host) return false
  return host === '127.0.0.1' || host === '::1' || host === 'localhost'
}
