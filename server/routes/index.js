const conditional = require('koa-conditional-get')
const etag = require('koa-etag')
const multer = require('@koa/multer')
const filesizeParser = require('filesize-parser')
const logoutRoute = require('./logout')
const sessionRoute = require('./session')
const registerRoute = require('./register')
const playerOpenGraphRoute = require('./opengraph/player')
const notificationsRoute = require('./notifications')
const subscribeRoute = require('./subscribe')
const unsubscribeRoute = require('./unsubscribe')
const uploadRoute = require('./upload')
const documentsRoute = require('./documents')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: filesizeParser(process.env.UPLOAD_MAX_SIZE || '10MB')
  }
})

module.exports = (router, dbPool) => {
  router
    .post('/api/session', sessionRoute(dbPool))
    .post('/api/logout', logoutRoute)
    .post('/api/register', registerRoute)
    .get('/api/opengraph/player/:id', conditional(), etag(), playerOpenGraphRoute)
    .post('/api/notifications/subscribe', subscribeRoute)
    .post('/api/notifications/unsubscribe', unsubscribeRoute)
    .get('/api/notifications/:id', notificationsRoute)
    .post('/api/upload', upload.single('file'), uploadRoute(dbPool))
    .get('/api/documents/:id', documentsRoute(dbPool))
}
