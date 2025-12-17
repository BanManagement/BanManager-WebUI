describe('Account/Password', () => {
  beforeEach(() => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.visit('/account/password')
  })

  it('renders', () => {
    cy.title().should('eq', 'Change Password | Account')
  })

  it('errors if incorrect current password', () => {
    cy.get('[data-cy=currentPassword]').type('aaaaaa')
    cy.get('[data-cy=newPassword]').type('aaaaaa')
    cy.get('[data-cy=confirmPassword]').type('aaaaaa')

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=errors]').contains('Incorrect login details')
  })

  it('errors if new password weak', () => {
    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))
    cy.get('[data-cy=newPassword]').type('aaaaaa')
    cy.get('[data-cy=confirmPassword]').type('aaaaaa')

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=errors]').contains('This password isn\'t safe to use')
  })

  it('successfully changes password', () => {
    const originalPassword = Cypress.env('admin_password')
    const newPassword = 'kb^5L^$CxViyPS4G'

    cy.get('[data-cy=currentPassword]').type(originalPassword)
    cy.get('[data-cy=newPassword]').type(newPassword)
    cy.get('[data-cy=confirmPassword]').type(newPassword)

    cy.get('[data-cy=submit-password-change]').click()

    cy.title().should('eq', 'Account')

    // Reset back to original password so other tests still work
    cy.visit('/account/password')
    cy.get('[data-cy=currentPassword]').type(newPassword)
    cy.get('[data-cy=newPassword]').type(originalPassword)
    cy.get('[data-cy=confirmPassword]').type(originalPassword)

    cy.get('[data-cy=submit-password-change]').click()

    cy.title().should('eq', 'Account')
  })
})
