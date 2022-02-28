describe('Account/Password', () => {
  before(() => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))

    cy.visit('/account/password')
  })

  it('renders', () => {
    cy.title().should('eq', 'Change Password')
  })

  it('errors if incorrect current password', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=currentPassword]').type('aaaaaa')
    cy.get('[data-cy=newPassword]').type('aaaaaa')
    cy.get('[data-cy=confirmPassword]').type('aaaaaa')

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=errors]').contains('Incorrect login details')
  })

  it('errors if new password weak', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))
    cy.get('[data-cy=newPassword]').type('aaaaaa')
    cy.get('[data-cy=confirmPassword]').type('aaaaaa')

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=errors]').contains('Commonly used password, please choose another')
  })

  it('successfully changes password', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    const newPassword = 'kb^5L^$CxViyPS4G'

    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))
    cy.get('[data-cy=newPassword]').type(newPassword)
    cy.get('[data-cy=confirmPassword]').type(newPassword)

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=success]').contains('Password updated')

    // Reset it
    cy.get('form').then($element => $element[0].reset())
    cy.get('[data-cy=currentPassword]').type(newPassword)
    cy.get('[data-cy=newPassword]').type(Cypress.env('admin_password'))
    cy.get('[data-cy=confirmPassword]').type(Cypress.env('admin_password'))

    cy.get('[data-cy=submit-password-change]').click()

    cy.get('[data-cy=success]').contains('Password updated')
  })
})
