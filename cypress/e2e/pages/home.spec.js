describe('Home', () => {
  before(() => {
    cy.visit('/')
  })

  it('renders', () => {
    cy.title().should('eq', 'Welcome')
  })
})
