describe('Player', () => {
  beforeEach(() => {
    cy.visit('/player/ae51c849-3f2a-4a37-986d-55ed5b02307f')
  })

  it('renders', () => {
    cy.title().should('eq', 'confuser')
  })
})
