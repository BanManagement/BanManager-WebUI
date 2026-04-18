const crypto = require('crypto')
const Router = require('@koa/router')
const { RateLimiterMemory } = require('rate-limiter-flexible')
const { buildHtml, getCss, getJs, getIcon } = require('../setup/installer-html')
const { handlers } = require('../setup/api')
const { isSetupComplete } = require('../setup/state')
const { getVersion } = require('./health')

const SETUP_RATE_LIMIT = new RateLimiterMemory({ points: 10, duration: 60 })

const isLoopback = (ip) => {
  if (!ip) return false
  const v = ip.replace(/^::ffff:/, '')
  return v === '127.0.0.1' || v === '::1' || v === 'localhost'
}

const stripBasePath = (path, basePath) => {
  if (!basePath) return path
  if (path === basePath) return '/'
  if (path.startsWith(basePath + '/')) return path.slice(basePath.length)
  return path
}

const timingSafeStringEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const buf = Buffer.from(a, 'utf8')
  const expected = Buffer.from(b, 'utf8')
  if (buf.length !== expected.length) {
    crypto.timingSafeEqual(buf, buf)
    return false
  }
  return crypto.timingSafeEqual(buf, expected)
}

const buildRouter = ({ basePath, dbPool, allowAfterComplete = false } = {}) => {
  const router = new Router({ prefix: basePath || undefined })
  const relativePath = (ctx) => stripBasePath(ctx.path, basePath)

  router.use(async (ctx, next) => {
    if (allowAfterComplete) return next()
    const rel = relativePath(ctx)
    if (!rel.startsWith('/setup') && !rel.startsWith('/api/setup')) return next()
    if (rel === '/api/setup/state') return next()
    if (!dbPool) return next()
    try {
      const complete = await isSetupComplete(dbPool)
      if (complete) {
        ctx.status = 404
        ctx.body = { error: 'Setup is already complete' }
        return
      }
    } catch (_) {
      // db not reachable yet - allow setup routes to handle
    }
    return next()
  })

  // Same-origin check on /api/setup/* mutations.
  // Setup endpoints are intentionally unauthenticated by default (so first-run
  // installs work without credentials), but they MUST not be reachable from
  // a malicious cross-origin page that tricks the operator's browser into
  // POSTing setup payloads. Reject any state-changing request whose Origin
  // header (or, as a fallback, Referer) doesn't match the request host.
  router.use(async (ctx, next) => {
    const rel = relativePath(ctx)
    if (!rel.startsWith('/api/setup')) return next()
    if (ctx.method === 'GET' || ctx.method === 'HEAD' || ctx.method === 'OPTIONS') return next()

    const expectedHost = ctx.host
    const origin = ctx.get('Origin')
    const referer = ctx.get('Referer')

    const matches = (value) => {
      if (!value) return false
      try {
        return new URL(value).host === expectedHost
      } catch (_) {
        return false
      }
    }

    // Same-origin browser POSTs always send Origin; non-browser clients (curl,
    // CLI) typically send neither, which we still allow because they can only
    // reach loopback unless the operator deliberately exposed the port.
    if (origin) {
      if (!matches(origin)) {
        ctx.status = 403
        ctx.body = { error: 'Cross-origin setup requests are not allowed.' }
        return
      }
    } else if (referer && !matches(referer)) {
      ctx.status = 403
      ctx.body = { error: 'Cross-origin setup requests are not allowed.' }
      return
    }

    return next()
  })

  router.use(async (ctx, next) => {
    if (!relativePath(ctx).startsWith('/api/setup')) return next()
    try {
      await SETUP_RATE_LIMIT.consume(ctx.request.ip || 'unknown')
    } catch (_) {
      ctx.status = 429
      ctx.body = { error: 'Too many setup requests, please try again in a minute.' }
      return
    }
    return next()
  })

  router.use(async (ctx, next) => {
    const rel = relativePath(ctx)
    if (!rel.startsWith('/api/setup')) return next()
    if (!process.env.SETUP_TOKEN) return next()
    if (rel === '/api/setup/token' || rel === '/api/setup/preflight' || rel === '/api/setup/state') return next()
    const provided = (ctx.request.body && ctx.request.body.token) || ctx.get('X-Setup-Token')
    if (provided && timingSafeStringEqual(provided, process.env.SETUP_TOKEN)) return next()
    ctx.status = 401
    ctx.body = { error: 'Setup token required. Provide it in the first step.' }
  })

  router.get('/setup', async (ctx) => {
    ctx.status = 200
    ctx.set('Cache-Control', 'no-store')
    ctx.type = 'text/html; charset=utf-8'
    ctx.body = buildHtml({
      clientIp: ctx.request.ip,
      isSecure: ctx.request.secure,
      isLoopback: isLoopback(ctx.request.ip),
      requireToken: Boolean(process.env.SETUP_TOKEN),
      version: getVersion(),
      basePath: basePath || ''
    })
  })

  router.get('/setup/app.js', async (ctx) => {
    ctx.set('Cache-Control', 'no-store')
    ctx.type = 'application/javascript; charset=utf-8'
    ctx.body = getJs()
  })

  router.get('/setup/style.css', async (ctx) => {
    ctx.set('Cache-Control', 'public, max-age=300')
    ctx.type = 'text/css; charset=utf-8'
    ctx.body = getCss()
  })

  router.get('/setup/icon.png', async (ctx) => {
    const icon = getIcon()
    if (!icon) { ctx.status = 404; return }
    ctx.set('Cache-Control', 'public, max-age=86400')
    ctx.type = 'image/png'
    ctx.body = icon
  })

  router.get('/api/setup/preflight', handlers.preflight)
  router.post('/api/setup/token', handlers.token)
  router.post('/api/setup/database', handlers.database)
  router.post('/api/setup/server', handlers.server)
  router.post('/api/setup/admin/preflight', handlers.adminPreflight)
  router.post('/api/setup/finalize', handlers.finalize)
  router.get('/api/setup/state', handlers.state)

  return router
}

module.exports = buildRouter
