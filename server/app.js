// Next.js
const next = require('next')

/// Koa
const Koa = require('koa')
const Router = require('@koa/router')
const reqLogger = require('koa-pino-logger')
const session = require('koa-session')

// GraphQL/Apollo
const { ApolloServer } = require('apollo-server-koa')
const schema = require('./graphql/schema')
const loaders = require('./graphql/loaders')
const acl = require('./middleware/acl')

const routes = require('./routes')

const { valid } = require('./data/session')

module.exports = async function ({ dbPool, logger, serversPool, disableUI = false }) {
  let handle

  if (!disableUI) {
    const dev = process.env.NODE_ENV !== 'production'
    const app = next({ dev })
    handle = app.getRequestHandler()
    await app.prepare()
  }

  const server = new Koa()
  const router = new Router()
  const apolloServer = new ApolloServer(schema({ dbPool, logger, serversPool }))

  server.keys = [process.env.SESSION_KEY]

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
  server.use(session({
    key: process.env.SESSION_NAME || 'bm-webui-sess',
    renew: true,
    maxAge: (24 * 60 * 60 * 1000) * 3, // Valid for 3 days
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

  routes(router)
  server.use(router.routes())

  await apolloServer.start()

  router.use(apolloServer.getMiddleware())

  if (handle) {
    router.all('(.*)', async ctx => {
      if (ctx.session) await ctx.session.manuallyCommit()

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
