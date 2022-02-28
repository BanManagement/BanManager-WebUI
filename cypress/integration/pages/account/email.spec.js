describe('Account/Email', () => {
  before(() => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))

    cy.visit('/account/email')
  })

  it('renders', () => {
    cy.title().should('eq', 'Change Email')
  })

  it('errors if incorrect current password', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type('aaa@aaa.com')
    cy.get('[data-cy=currentPassword]').type('aaaaaa')

    cy.get('[data-cy=submit-email-change]').click()

    cy.get('[data-cy=errors]').contains('Incorrect login details')
  })

  it('errors email used', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type(Cypress.env('admin_username'))
    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))

    cy.get('[data-cy=submit-email-change]').click()

    cy.get('[data-cy=errors]').contains('You already have an account')
  })

  it('successfully changes email', () => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type('test@banmanagement.com')
    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))

    cy.get('[data-cy=submit-email-change]').click()

    cy.get('[data-cy=success]').contains('Email updated')

    // Reset it
    cy.get('form').then($element => $element[0].reset())
    cy.get('[data-cy=email]').type(Cypress.env('admin_username'))
    cy.get('[data-cy=currentPassword]').type(Cypress.env('admin_password'))

    cy.get('[data-cy=submit-email-change]').click()

    cy.get('[data-cy=success]').contains('Email updated')
  })
})
