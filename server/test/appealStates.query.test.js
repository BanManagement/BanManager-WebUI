const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')

describe('Query appealStates', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should resolve all fields', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query appealStates {
        appealStates {
          id
          name
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.appealStates, [
      {
        id: '1',
        name: 'Open'
      }, {
        id: '2',
        name: 'Assigned'
      }, {
        id: '3',
        name: 'Resolved'
      }, {
        id: '4',
        name: 'Rejected'
      }
    ])
  })
})
