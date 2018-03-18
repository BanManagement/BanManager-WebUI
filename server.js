const Koa = require('koa')
const next = require('next')
const routes = require('./routes')
const app = next({dev: process.env.NODE_ENV !== 'production'})
const handler = routes.getRequestHandler(app)
const server = new Koa()

app.prepare().then(() => {
  server.use(ctx => {
    ctx.respond = false
    ctx.res.statusCode = 200 // because koa defaults to 404
    handler(ctx.req, ctx.res)
  }).listen(process.env.PORT || 3000)
})
