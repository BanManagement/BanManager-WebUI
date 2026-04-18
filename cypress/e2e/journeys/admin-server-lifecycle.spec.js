const data = require('../../fixtures/e2e-data.json')
const { tables } = require('../../../server/data/tables')

describe('Admin server lifecycle', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  it('creates a new server, edits it and deletes it', () => {
    // Cypress retries reuse the spec context, so we mint per-attempt names
    // using Date.now() to avoid the "server with this name already exists"
    // error if a previous attempt left rows behind in the shared test database.
    const newServerName = `Cypress${Date.now()}`
    const renamedServer = `${newServerName}Renamed`

    cy.visit('/admin/servers')

    cy.get('[data-cy=server-item]').should('have.length.at.least', 1)

    cy.contains('a', 'Add Server').click()
    cy.url().should('include', '/admin/servers/add')

    cy.get('[data-cy=server-form]').should('exist')
    cy.get('[data-cy=server-name]').type(newServerName)
    cy.get('[data-cy=server-console]').type(data.consoleUuid)
    cy.get('[data-cy=server-host]').type(Cypress.env('DB_HOST') || '127.0.0.1')
    cy.get('[data-cy=server-port]').type(`${Cypress.env('DB_PORT') || 3306}`)
    cy.get('[data-cy=server-database]').type('bm_e2e_tests')
    cy.get('[data-cy=server-user]').type(Cypress.env('DB_USER') || 'root')
    if (Cypress.env('DB_PASSWORD')) {
      cy.get('[data-cy=server-password]').type(Cypress.env('DB_PASSWORD'))
    }

    cy.get('[data-cy^=server-table-]').each(($input) => {
      const key = $input.attr('data-cy').replace('server-table-', '')
      const tableName = tables[key]
      if (!tableName) throw new Error(`No table mapping for ${key}`)
      cy.wrap($input).type(tableName)
    })

    // Surface the actual createServer response so a server-side rejection
    // (missing tables, console UUID lookup, etc.) produces an actionable
    // assertion instead of a silent "URL didn't change" timeout.
    cy.intercept('POST', '/graphql', (req) => {
      if (typeof req.body?.query === 'string' && req.body.query.includes('createServer')) {
        req.alias = 'createServer'
      }
    })

    cy.get('[data-cy=submit-server-form]').click()

    cy.wait('@createServer', { timeout: 15000 }).then(({ response }) => {
      const errors = response?.body?.errors
      const id = response?.body?.data?.createServer?.id
      expect(errors, `createServer errors: ${JSON.stringify(errors)}`).to.equal(undefined)
      expect(String(id || ''), 'createServer returned no id').to.match(/^[\w-]+$/)
    })

    cy.url({ timeout: 10000 }).should('match', /\/admin\/servers\/?$/)
    cy.get(`[data-cy=server-item][data-cy-server="${newServerName}"]`).should('exist')

    cy.get(`[data-cy=server-item][data-cy-server="${newServerName}"]`)
      .find('a')
      .first()
      .click()

    cy.url().should('match', /\/admin\/servers\/[^/]+$/)
    cy.contains('a, button', /Edit Server/i).click()
    cy.url().should('include', '/edit')

    cy.get('[data-cy=server-name]').clear()
    cy.get('[data-cy=server-name]').type(renamedServer)
    cy.get('[data-cy=submit-server-form]').click()

    cy.url().should('match', /\/admin\/servers\/[^/]+$/)
    cy.visit('/admin/servers')
    cy.get(`[data-cy=server-item][data-cy-server="${renamedServer}"]`).should('exist')

    cy.get(`[data-cy=server-item][data-cy-server="${renamedServer}"]`)
      .find('[data-cy=server-delete]')
      .click()

    cy.get('[data-cy=server-delete-confirm-name]').type(renamedServer)
    cy.get('[data-cy=modal-confirm]').click()

    cy.get(`[data-cy=server-item][data-cy-server="${renamedServer}"]`).should('not.exist')
    cy.get(`[data-cy=server-item][data-cy-server="${newServerName}"]`).should('not.exist')
    cy.get('[data-cy=server-item]').should('have.length.at.least', 1)
  })
})
