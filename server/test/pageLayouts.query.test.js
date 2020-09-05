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

  test('should resolve all fields', async () => {
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

    const pageLayout = body.data.pageLayouts.find(({ pathname }) => pathname === 'player')

    assert.deepStrictEqual(pageLayout.devices, {
      desktop: {
        components: [{ colour: 'blue', component: 'PlayerHeader', id: '21', meta: null, textAlign: 'center', w: 16, x: 0, y: 0 }, { colour: null, component: 'ActivePlayerBans', id: '24', meta: null, textAlign: null, w: 16, x: 0, y: 1 }, {
          colour: null,
          component:
            'ActivePlayerMutes',
          id: '27',
          meta: null,
          textAlign: null,
          w: 16,
          x: 0,
          y: 2
        }, { colour: null, component: 'PlayerPunishmentRecords', id: '30', meta: null, textAlign: null, w: 16, x: 0, y: 3 }, { colour: null, component: 'PlayerIpList', id: '33', meta: null, textAlign: null, w: 16, x: 0, y: 4 }, { colour: null, component: 'PlayerHistoryList', id: '36', meta: null, textAlign: null, w: 16, x: 0, y: 5 }, { colour: null, component: 'PlayerAlts', id: '39', meta: null, textAlign: null, w: 16, x: 0, y: 6 }]
      },
      mobile: { components: [{ colour: 'blue', component: 'PlayerHeader', id: '19', meta: null, textAlign: 'center', w: 16, x: 0, y: 0 }, { colour: null, component: 'ActivePlayerBans', id: '22', meta: null, textAlign: null, w: 16, x: 0, y: 1 }, { colour: null, component: 'ActivePlayerMutes', id: '25', meta: null, textAlign: null, w: 16, x: 0, y: 2 }, { colour: null, component: 'PlayerPunishmentRecords', id: '28', meta: null, textAlign: null, w: 16, x: 0, y: 3 }, { colour: null, component: 'PlayerIpList', id: '31', meta: null, textAlign: null, w: 16, x: 0, y: 4 }, { colour: null, component: 'PlayerHistoryList', id: '34', meta: null, textAlign: null, w: 16, x: 0, y: 5 }, { colour: null, component: 'PlayerAlts', id: '37', meta: null, textAlign: null, w: 16, x: 0, y: 6 }] },
      tablet: {
        components: [{ colour: 'blue', component: 'PlayerHeader', id: '20', meta: null, textAlign: 'center', w: 16, x: 0, y: 0 }, { colour: null, component: 'ActivePlayerBans', id: '23', meta: null, textAlign: null, w: 16, x: 0, y: 1 }, { colour: null, component: 'ActivePlayerMutes', id: '26', meta: null, textAlign: null, w: 16, x: 0, y: 2 }, { colour: null, component: 'PlayerPunishmentRecords', id: '29', meta: null, textAlign: null, w: 16, x: 0, y: 3 }, {
          colour: null,
          component:
            'PlayerIpList',
          id: '32',
          meta: null,
          textAlign: null,
          w: 16,
          x: 0,
          y: 4
        }, { colour: null, component: 'PlayerHistoryList', id: '35', meta: null, textAlign: null, w: 16, x: 0, y: 5 }, { colour: null, component: 'PlayerAlts', id: '38', meta: null, textAlign: null, w: 16, x: 0, y: 6 }]
      }
    }
    )
  })
})
