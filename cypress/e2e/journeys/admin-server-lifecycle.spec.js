const data = require('../../fixtures/e2e-data.json')
const { tables } = require('../../../server/data/tables')

describe('Admin server lifecycle', () => {
  const newServerName = `Cypress${Math.floor(Math.random() * 1e6)}`
  const renamedServer = `${newServerName}Renamed`

  beforeEach(() => {
    cy.loginAsAdmin()
  })

  it('creates a new server, edits it and deletes it', () => {
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

    cy.get('[data-cy=submit-server-form]').click()

    cy.url().should('match', /\/admin\/servers\/?$/)
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
