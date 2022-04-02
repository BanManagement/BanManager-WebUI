const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')

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
      [{ id: '1', name: 'Login', href: '/login' }])
  })

  test('should show admin link if user has servers.manage permission', async () => {
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
      [{ id: '1', name: 'Dashboard', href: '/dashboard' },
        { id: '2', name: 'Admin', href: '/admin' }
      ])
  })

  test('should show admin link if admin has multiple roles', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)

    const viewRole = await setTempRole(setup.dbPool, account, 'servers', 'view')

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

    await viewRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.deepStrictEqual(body.data.navigation.left,
      [{ id: '1', name: 'Dashboard', href: '/dashboard' },
        { id: '2', name: 'Admin', href: '/admin' }
      ])
  })

  test('should show admin link if user has multiple roles', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)

    const manageRole = await setTempRole(setup.dbPool, account, 'servers', 'manage')

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

    await manageRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.deepStrictEqual(body.data.navigation.left,
      [{ id: '1', name: 'Dashboard', href: '/dashboard' },
        { id: '2', name: 'Admin', href: '/admin' }
      ])
  })
})
