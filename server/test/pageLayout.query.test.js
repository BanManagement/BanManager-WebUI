const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')

describe('Query pageLayout', () => {
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

  test('should error if layout does not exist', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayout {
        pageLayout(pathname: "nope") {
          pathname
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Page Layout not found')
  })

  test.skip('should resolve fields', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayout {
        pageLayout(pathname: "home") {
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
    assert.strictEqual(body.data.pageLayout.pathname, 'home')
    assert.deepStrictEqual(body.data.pageLayout.devices, { desktop: { components: [{ component: 'AppealPanel', id: '40', meta: {}, w: 4, x: 0, y: 0 }, { component: 'SearchPanel', id: '41', meta: {}, w: 4, x: 4, y: 0 }, { component: 'AccountPanel', id: '42', meta: {}, w: 4, x: 8, y: 0 }, { component: 'StatisticsPanel', id: '43', meta: {}, w: 12, x: 0, y: 1 }] }, mobile: { components: [{ component: 'AppealPanel', id: '48', meta: {}, w: 12, x: 0, y: 0 }, { component: 'SearchPanel', id: '49', meta: {}, w: 12, x: 0, y: 1 }, { component: 'AccountPanel', id: '50', meta: {}, w: 12, x: 0, y: 2 }, { component: 'StatisticsPanel', id: '51', meta: {}, w: 12, x: 0, y: 3 }] }, tablet: { components: [{ component: 'AppealPanel', id: '44', meta: {}, w: 12, x: 0, y: 0 }, { component: 'SearchPanel', id: '45', meta: {}, w: 12, x: 0, y: 1 }, { component: 'AccountPanel', id: '46', meta: {}, w: 12, x: 0, y: 2 }, { component: 'StatisticsPanel', id: '47', meta: {}, w: 12, x: 0, y: 3 }] } })
  })
})
