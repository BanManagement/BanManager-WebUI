const bodyParser = require('koa-bodyparser')
const conditional = require('koa-conditional-get')
const etag = require('koa-etag')
const logoutRoute = require('./logout')
const sessionRoute = require('./session')
const registerRoute = require('./register')
const playerOpenGraphRoute = require('./opengraph/player')
const notificationsRoute = require('./notifications')

module.exports = (router, dbPool) => {
  router.use(bodyParser())

  router
    .post('/api/session', sessionRoute(dbPool))
    .post('/api/logout', logoutRoute)
    .post('/api/register', registerRoute)
    .get('/api/opengraph/player/:id', conditional(), etag(), playerOpenGraphRoute)
    .get('/api/notifications/:id', notificationsRoute)
}
