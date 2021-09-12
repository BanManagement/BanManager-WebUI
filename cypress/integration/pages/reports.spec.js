describe('Reports', () => {
  before(() => {
    cy.visit('/reports')
  })

  it('renders', () => {
    cy.title().should('eq', 'Reports')
  })

  // it('should navigate to a report', () => {
  //   cy.get('.table tbody tr td a').click().visit()
  // })
})
