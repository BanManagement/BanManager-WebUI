Cypress.Commands.add(
  'login',
  (email, password) => {
    cy.log(`Logging in as ${email}`)
    cy.request({
      method: 'POST',
      url: `${Cypress.config().baseUrl}/api/session`,
      body: {
        email,
        password
      }
    }).then(() => {
      cy.getCookie(Cypress.env('session_name')).should('exist')
    })
  })
