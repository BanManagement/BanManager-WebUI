describe('Account', () => {
  before(() => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
    cy.visit('/account')
  })

  it('renders', () => {
    cy.title().should('eq', 'Settings for confuser')
  })
})
