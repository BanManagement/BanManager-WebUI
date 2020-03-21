const assert = require('assert')
const { parse } = require('uuid-parse')

module.exports = async function (request, cookie) {
  const { body, statusCode } = await request
    .post('/graphql')
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .send({
      query: `query me {
      me {
        id
        name
        email
        hasAccount
        session {
          type
        }
      }
    }`
    })

  assert.strictEqual(statusCode, 200)
  assert(body)
  assert(body.data)
  assert(body.data.me)

  return { ...body.data.me, id: parse(body.data.me.id, Buffer.alloc(16)) }
}
