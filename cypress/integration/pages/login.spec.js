describe('Login', () => {
  before(() => {
    cy.visit('/login')
  })

  it('renders', () => {
    cy.title().should('eq', 'Login')
  })

  it('shows error for invalid passwords', () => {
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type('doesnotexis@banmanagement.com')
    cy.get('[data-cy=password]').type('aaa')

    cy.get('[data-cy=submit-login-password]').click()

    cy.get('[data-cy=errors]').contains('Invalid password, minimum length 6 characters')
  })

  it('shows error when account does not exist', () => {
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type('doesnotexist@banmanagement.com')
    cy.get('[data-cy=password]').type('aaaaaa')

    cy.get('[data-cy=submit-login-password]').click()

    cy.get('[data-cy=errors]').contains('Incorrect login details')
  })

  it('logs in via email', () => {
    cy.get('form').then($element => $element[0].reset())

    cy.get('[data-cy=email]').type(Cypress.env('admin_username'))
    cy.get('[data-cy=password]').type(Cypress.env('admin_password'))

    cy.get('[data-cy=submit-login-password]').click()

    cy.url().should('include', '/')

    cy.getCookie(Cypress.env('session_name')).should('exist')
  })
})
