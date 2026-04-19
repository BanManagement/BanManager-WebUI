describe('Admin role lifecycle', () => {
  const roleName = `cyrole${Math.floor(Math.random() * 1e6)}`
  const renamedRole = `${roleName}edit`

  beforeEach(() => {
    cy.loginAsAdmin()
  })

  it('creates a role, assigns it globally + per server, edits and deletes it', () => {
    cy.visit('/admin/roles')
    cy.get('[data-cy=role-item]').should('have.length.at.least', 3)

    cy.contains('a', 'Add').click()
    cy.url().should('include', '/admin/roles/add')

    cy.get('[data-cy=role-form]').should('exist')
    cy.get('[data-cy=role-name]').type(roleName)

    cy.get('[data-cy=role-resource-player\\.bans] [data-cy=role-permission-player\\.bans-view]').check({ force: true })

    cy.get('[data-cy=submit-role-form]').click()

    cy.url().should('match', /\/admin\/roles\/?$/)
    cy.get(`[data-cy=role-item][data-cy-role="${roleName}"]`).should('exist')

    cy.fixture('e2e-data.json').then(({ userPlayerId, secondServerId }) => {
      cy.get('[data-cy=assign-global-role]').within(() => {
        cy.get('.react_select__control').first().click()
        cy.get('.react_select__input').first().type('RegularUser')
      })
      cy.contains('.react_select__option', 'RegularUser').click()

      cy.get('[data-cy=assign-global-role]').within(() => {
        cy.get('.react_select__control').eq(1).click()
      })
      cy.contains('.react_select__option', roleName).click()

      cy.get('[data-cy=assign-global-role] [data-cy=submit-players-role]').click()

      cy.get('[data-cy=assign-server-role]').within(() => {
        cy.get('.react_select__control').first().click()
        cy.get('.react_select__input').first().type('GuestPlayer')
      })
      cy.contains('.react_select__option', 'GuestPlayer').click()

      cy.get('[data-cy=assign-server-role]').within(() => {
        cy.get('.react_select__control').eq(1).click()
      })
      cy.contains('.react_select__option', roleName).click()

      cy.get('[data-cy=assign-server-role] [data-cy=submit-players-role]').click()

      expect(userPlayerId).to.be.a('string')
      expect(secondServerId).to.be.a('string')
    })

    cy.get(`[data-cy=role-item][data-cy-role="${roleName}"] [data-cy=role-name-display]`)
      .click()

    cy.url().should('match', /\/admin\/roles\/[^/]+$/)
    cy.get('[data-cy=role-form]').should('exist')

    cy.get('[data-cy=role-name]').clear()
    cy.get('[data-cy=role-name]').type(renamedRole)
    cy.get('[data-cy=submit-role-form]').click()

    cy.url().should('match', /\/admin\/roles\/?$/)
    cy.get(`[data-cy=role-item][data-cy-role="${renamedRole}"]`).should('exist')

    cy.get(`[data-cy=role-item][data-cy-role="${renamedRole}"] [data-cy=role-delete]`).click({ force: true })
    cy.get('[data-cy=modal-confirm]').click()
    cy.get(`[data-cy=role-item][data-cy-role="${renamedRole}"]`).should('not.exist')
  })
})
