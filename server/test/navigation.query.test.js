const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query navigation', () => {
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
        query: `query navigation {
        navigation {
          left {
            id
            name
            href
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.navigation.left,
      [{ id: '1', name: 'Home', href: '/' },
        { id: '2', name: 'Appeal', href: null },
        { id: '3', name: 'Reports', href: '/reports' },
        { id: '4', name: 'Statistics', href: '/statistics' }
      ])
  })

  test(
    'should show admin link if user has servers.manage permission',
    async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
      const { body, statusCode } = await request
        .post('/graphql')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .send({
          query: `query navigation {
          navigation {
            left {
              id
              name
              href
            }
          }
        }`
        })

      assert.strictEqual(statusCode, 200)

      assert(body)

      assert.deepStrictEqual(body.data.navigation.left,
        [{ id: '1', name: 'Home', href: '/' },
          { id: '2', name: 'Appeal', href: null },
          { id: '3', name: 'Reports', href: '/reports' },
          { id: '4', name: 'Statistics', href: '/statistics' },
          { id: '5', name: 'Admin', href: '/admin' }
        ])
    }
  )
})
