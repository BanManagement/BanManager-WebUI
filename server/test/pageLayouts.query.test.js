const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query pageLayouts', () => {
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

  test('should error if unauthenticated', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayouts {
        pageLayouts {
          pathname
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should require servers.manage permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayouts {
        pageLayouts {
          pathname
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test.skip('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayouts {
        pageLayouts {
          pathname
          devices {
            mobile {
              components {
                id
                component
                x
                y
                w
                meta
              }
            }
            tablet {
              components {
                id
                component
                x
                y
                w
                meta
              }
            }
            desktop {
              components {
                id
                component
                x
                y
                w
                meta
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)

    const pageLayout = body.data.pageLayouts.find(({ pathname }) => pathname === 'home')

    assert.deepStrictEqual(pageLayout.devices, { desktop: { components: [{ component: 'AppealPanel', id: '40', meta: {}, w: 4, x: 0, y: 0 }, { component: 'SearchPanel', id: '41', meta: {}, w: 4, x: 4, y: 0 }, { component: 'AccountPanel', id: '42', meta: {}, w: 4, x: 8, y: 0 }, { component: 'StatisticsPanel', id: '43', meta: {}, w: 12, x: 0, y: 1 }] }, mobile: { components: [{ component: 'AppealPanel', id: '48', meta: {}, w: 12, x: 0, y: 0 }, { component: 'SearchPanel', id: '49', meta: {}, w: 12, x: 0, y: 1 }, { component: 'AccountPanel', id: '50', meta: {}, w: 12, x: 0, y: 2 }, { component: 'StatisticsPanel', id: '51', meta: {}, w: 12, x: 0, y: 3 }] }, tablet: { components: [{ component: 'AppealPanel', id: '44', meta: {}, w: 12, x: 0, y: 0 }, { component: 'SearchPanel', id: '45', meta: {}, w: 12, x: 0, y: 1 }, { component: 'AccountPanel', id: '46', meta: {}, w: 12, x: 0, y: 2 }, { component: 'StatisticsPanel', id: '47', meta: {}, w: 12, x: 0, y: 3 }] } })
  })
})
