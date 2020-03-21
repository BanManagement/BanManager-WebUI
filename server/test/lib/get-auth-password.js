const assert = require('assert')

module.exports = async function (request, email, password) {
  const { header, statusCode } = await request
    .post('/api/session')
    .set('Accept', 'application/json')
    .send({ email, password: password || 'testing' })

  assert.strictEqual(statusCode, 204)

  const cookie = header['set-cookie'].join(';')

  return cookie
}
