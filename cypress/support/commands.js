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
