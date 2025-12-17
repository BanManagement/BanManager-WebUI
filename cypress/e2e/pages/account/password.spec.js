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
    const newPassword = 'kb^5L^$CxViyPS4G'
    // Use another strong password for reset (admin_password 'testing' fails hibp check)
    const resetPassword = 'xQ#9mK@2pL$7nR&5'

    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))
    cy.get('[data-cy=newPassword]').type(newPassword)
    cy.get('[data-cy=confirmPassword]').type(newPassword)

    cy.get('[data-cy=submit-password-change]').click()

    cy.title().should('eq', 'Account')

    // Reset to a different strong password (we can't use 'testing' as it fails hibp check)
    cy.visit('/account/password')
    cy.get('[data-cy=currentPassword]').type(newPassword)
    cy.get('[data-cy=newPassword]').type(resetPassword)
    cy.get('[data-cy=confirmPassword]').type(resetPassword)

    cy.get('[data-cy=submit-password-change]').click()

    cy.title().should('eq', 'Account')
  })
})
