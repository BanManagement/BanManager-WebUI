describe('Login', () => {
  before(() => {
    cy.visit('/login')
  })

  it('renders', () => {
    cy.title().should('eq', 'Login')
  })

  it('logs in via email', () => {
    cy.get('[data-cy=email]').type('admin@banmanagement.com')
    cy.get('[data-cy=password]').type('P%@#fjdVJ3Y%pdGR')

    cy.get('[data-cy=submit-login-password]').click()

    cy.url().should('include', '/')

    cy.getCookie('bm-webui-sess').should('exist')
  })
})
