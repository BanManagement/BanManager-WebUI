const bodyParser = require('koa-bodyparser')
const logoutRoute = require('./logout')
const sessionRoute = require('./session')
const registerRoute = require('./register')

module.exports = (router) => {
  router.use(bodyParser())

  router
    .post('/api/session', sessionRoute)
    .post('/api/logout', logoutRoute)
    .post('/api/register', registerRoute)
}
