const conditional = require('koa-conditional-get')
const etag = require('koa-etag')
const logoutRoute = require('./logout')
const sessionRoute = require('./session')
const registerRoute = require('./register')
const playerOpenGraphRoute = require('./opengraph/player')
const notificationsRoute = require('./notifications')
const subscribeRoute = require('./subscribe')
const unsubscribeRoute = require('./unsubscribe')

module.exports = (router, dbPool) => {
  router
    .post('/api/session', sessionRoute(dbPool))
    .post('/api/logout', logoutRoute)
    .post('/api/register', registerRoute)
    .get('/api/opengraph/player/:id', conditional(), etag(), playerOpenGraphRoute)
    .post('/api/notifications/subscribe', subscribeRoute)
    .post('/api/notifications/unsubscribe', unsubscribeRoute)
    .get('/api/notifications/:id', notificationsRoute)
}
