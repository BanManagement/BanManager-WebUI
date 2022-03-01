const assert = require('assert')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

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

  test.skip('should update page layout', async () => {
    const components = [{ component: 'AppealPanel', h: 1, id: '48', w: 12, x: 0, y: 0 }, { component: 'SearchPanel', h: 1, id: '49', w: 12, x: 0, y: 1 }, { component: 'AccountPanel', h: 1, id: '50', w: 12, x: 0, y: 2 }, { component: 'StatisticsPanel', h: 1, id: '51', w: 12, x: 0, y: 3 }]
    const unusedComponents = [
      { component: 'HTML', y: 5, x: 0, w: 5, h: 1 }
    ]
    const query = jsonToGraphQLQuery({
      mutation: {
        updatePageLayout:
          {
            __args:
            {
              pathname: 'home',
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
                  w: true,
                  h: true
                },
                unusedComponents:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true,
                  h: true
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
    assert(body.data)

    assert.strictEqual(body.data.updatePageLayout.pathname, 'home')
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile.components, components)
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile.unusedComponents, [])
  })

  test('should insert & delete components', async () => {
    const [inserted] = await setup.dbPool('bm_web_page_layouts').insert({ pathname: 'home', device: 'mobile', component: 'HTML', x: 0, y: 0, w: 16, h: 1 }, ['id'])
    const components = [{ id: '1', component: 'PlayerHeader', y: 0, x: 0, w: 5, h: 1 },
      { id: '4', component: 'PlayerPunishmentList', y: 2, x: 0, w: 5, h: 1 },
      { id: '7', component: 'PlayerIpList', y: 1, x: 0, w: 5, h: 1 },
      { id: '10', component: 'PlayerHistoryList', y: 3, x: 0, w: 5, h: 1 },
      { component: 'HTML', y: 5, x: 0, w: 5, h: 1 }
    ]
    const unusedComponents = [
      { id: '37', component: 'PlayerAlts', y: 4, x: 0, w: 5, h: 1 },
      { id: inserted, component: 'HTML', y: 15, x: 0, w: 5, h: 1 }
    ]
    const query = jsonToGraphQLQuery({
      mutation: {
        updatePageLayout:
          {
            __args:
            {
              pathname: 'home',
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
                  w: true,
                  h: true
                },
                unusedComponents:
                {
                  id: true,
                  component: true,
                  x: true,
                  y: true,
                  w: true,
                  h: true
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
    assert(body.data)

    assert.strictEqual(body.data.updatePageLayout.pathname, 'home')
    assert.strictEqual(body.data.updatePageLayout.devices.mobile.components.length, 1)
    assert.strictEqual(body.data.updatePageLayout.devices.mobile.components.pop().component, 'HTML')
  })
})
