const assert = require('assert')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { insert } = require('../data/udify')

describe('Mutation updatePageLayout', () => {
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
        query: `mutation updatePageLayout {
        updatePageLayout(pathname: "player", input: {
          mobile: { components: [], unusedComponents: [] },
          tablet: { components: [], unusedComponents: [] },
          desktop: { components: [], unusedComponents: [] }
        }) {
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
        query: `mutation updatePageLayout {
        updatePageLayout(pathname: "player", input: {
          mobile: { components: [], unusedComponents: [] },
          tablet: { components: [], unusedComponents: [] },
          desktop: { components: [], unusedComponents: [] }
        }) {
          pathname
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if page layout does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePageLayout {
        updatePageLayout(pathname: "foo", input: {
          mobile: { components: [], unusedComponents: [] },
          tablet: { components: [], unusedComponents: [] },
          desktop: { components: [], unusedComponents: [] }
        }) {
          pathname
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Page Layout does not exist')
  })

  test('should update page layout', async () => {
    const components = [{ id: '1', component: 'PlayerHeader', y: 0, x: 0, w: 5 },
      { id: '4', component: 'PlayerPunishmentList', y: 2, x: 0, w: 5 },
      { id: '7', component: 'PlayerIpList', y: 1, x: 0, w: 5 },
      { id: '10', component: 'PlayerHistoryList', y: 3, x: 0, w: 5 }]
    const unusedComponents = [
      { id: '13', component: 'PlayerAlts', y: 4, x: 0, w: 5 },
      { component: 'HTML', y: 5, x: 0, w: 5 }
    ]
    const query = jsonToGraphQLQuery({
      mutation: {
        updatePageLayout:
          {
            __args:
            {
              pathname: 'player',
              input:
              {
                mobile: { components, unusedComponents },
                desktop: { components: [], unusedComponents: [] },
                tablet: { components: [], unusedComponents: [] }
              }
            },
            pathname: true,
            devices:
            {
              mobile:
              {
                components:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true
                },
                unusedComponents:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true
                }
              }
            }
          }
      }
    })
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.updatePageLayout.pathname, 'player')
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile.components, components)
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile.unusedComponents,
      [{ id: '13', component: 'PlayerAlts', y: -1, x: 0, w: 5 }])
  })

  test('should insert & delete components', async () => {
    const [{ insertId }] = await insert(setup.dbPool, 'bm_web_page_layouts', { pathname: 'player', device: 'mobile', component: 'HTML', x: 0, y: 0, w: 16 })
    const components = [{ id: '1', component: 'PlayerHeader', y: 0, x: 0, w: 5 },
      { id: '4', component: 'PlayerPunishmentList', y: 2, x: 0, w: 5 },
      { id: '7', component: 'PlayerIpList', y: 1, x: 0, w: 5 },
      { id: '10', component: 'PlayerHistoryList', y: 3, x: 0, w: 5 },
      { component: 'HTML', y: 5, x: 0, w: 5 }
    ]
    const unusedComponents = [
      { id: '13', component: 'PlayerAlts', y: 4, x: 0, w: 5 },
      { id: insertId, component: 'HTML', y: 15, x: 0, w: 5 }
    ]
    const query = jsonToGraphQLQuery({
      mutation: {
        updatePageLayout:
          {
            __args:
            {
              pathname: 'player',
              input:
              {
                mobile: { components, unusedComponents },
                desktop: { components: [], unusedComponents: [] },
                tablet: { components: [], unusedComponents: [] }
              }
            },
            pathname: true,
            devices:
            {
              mobile:
              {
                components:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true
                },
                unusedComponents:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true
                }
              }
            }
          }
      }
    })
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.updatePageLayout.pathname, 'player')
    assert.strictEqual(body.data.updatePageLayout.devices.mobile.components.length, 5)
    assert.strictEqual(body.data.updatePageLayout.devices.mobile.components.pop().component, 'HTML')
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile.unusedComponents,
      [{ id: '13', component: 'PlayerAlts', y: -1, x: 0, w: 5 }])
  })
})
