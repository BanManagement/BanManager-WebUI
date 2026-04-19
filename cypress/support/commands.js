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

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
})

Cypress.Commands.add('loginAsUser', () => {
  cy.login(Cypress.env('user_username'), Cypress.env('user_password'))
})

Cypress.Commands.add('loginAsPin', (name, pin, serverId) => {
  cy.log(`Logging in via PIN as ${name} on ${serverId}`)
  cy.request({
    method: 'POST',
    url: `${Cypress.config().baseUrl}/api/session`,
    body: {
      name,
      pin,
      serverId
    }
  }).then(() => {
    cy.getCookie(Cypress.env('session_name')).should('exist')
  })
})

Cypress.Commands.add('logout', () => {
  cy.log('Logging out')
  cy.request({
    method: 'GET',
    url: `${Cypress.config().baseUrl}/api/logout`,
    failOnStatusCode: false
  }).then(() => {
    cy.clearCookie(Cypress.env('session_name'))
  })
})

// Generic GraphQL helper. Use to seed/reset data when there isn't a UI affordance.
Cypress.Commands.add('gql', (query, variables = {}) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.config().baseUrl}/graphql`,
    body: { query, variables },
    headers: { 'Content-Type': 'application/json' }
  }).then((response) => {
    expect(response.status).to.eq(200)
    if (response.body.errors) {
      const messages = response.body.errors.map((e) => e.message).join(', ')
      throw new Error(`GraphQL errors: ${messages}`)
    }
    return response.body.data
  })
})

// Drop file(s) onto an element (simulates drag and drop)
Cypress.Commands.add('dropFile', { prevSubject: 'element' }, (subject, fixture, mimeType = 'image/jpeg') => {
  return cy.fixture(fixture, 'base64').then(content => {
    const blob = Cypress.Blob.base64StringToBlob(content, mimeType)
    const file = new File([blob], fixture, { type: mimeType })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    // Dispatch drag events in sequence - use separate cy commands to avoid unsafe chaining
    cy.wrap(subject).trigger('dragenter', { dataTransfer, force: true })
    cy.wrap(subject).trigger('dragover', { dataTransfer, force: true })
    cy.wrap(subject).trigger('drop', { dataTransfer, force: true })
  })
})

// Paste file into an element (simulates clipboard paste)
Cypress.Commands.add('pasteFile', { prevSubject: 'element' }, (subject, fixture, mimeType = 'image/jpeg') => {
  return cy.fixture(fixture, 'base64').then(content => {
    const blob = Cypress.Blob.base64StringToBlob(content, mimeType)
    const file = new File([blob], fixture, { type: mimeType })

    // Dispatch paste event with clipboardData containing the file
    cy.wrap(subject).then($el => {
      const event = new Event('paste', { bubbles: true })
      Object.defineProperty(event, 'clipboardData', {
        value: {
          files: [file],
          items: [{ kind: 'file', type: mimeType, getAsFile: () => file }],
          types: ['Files']
        }
      })
      $el[0].dispatchEvent(event)
    })
  })
})
