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

  test('should resolve fields', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query pageLayout {
        pageLayout(pathname: "player") {
          pathname
          devices {
            mobile {
              components {
                id
                component
                x
                y
                w
                colour
                textAlign
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
                colour
                textAlign
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
                colour
                textAlign
                meta
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.pageLayout.pathname, 'player')
    assert.deepStrictEqual(body.data.pageLayout.devices, {
      mobile: {
        components:
        [{
          id: '1',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '4',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '7',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '10',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '13',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }]
      },
      tablet: {
        components:
        [{
          id: '2',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '5',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '8',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '11',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '14',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }]
      },
      desktop: {
        components:
        [{
          id: '3',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '6',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '9',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '12',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '15',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }]
      }
    })
  })
})
