describe('Admin webhook lifecycle', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  const variants = [
    { name: 'custom', template: 'CUSTOM', initialUrl: 'https://example.com/cypress-webhook' },
    { name: 'discord', template: 'DISCORD', initialUrl: 'https://example.com/cypress-discord' }
  ]

  variants.forEach(({ name, template, initialUrl: baseInitialUrl }) => {
    describe(`${name} webhook`, () => {
      it(`creates, tests, edits and deletes a ${name} webhook`, () => {
        // Per-attempt URLs so retries don't collide with rows the previous
        // attempt left behind in the shared test DB.
        const initialUrl = `${baseInitialUrl}-${Date.now()}`
        const updatedUrl = `${initialUrl}/edited`

        cy.intercept('POST', '/graphql', (req) => {
          if (typeof req.body?.query !== 'string') return
          if (req.body.query.includes('mutation createWebhook')) {
            req.alias = 'createWebhook'
          } else if (req.body.query.includes('mutation updateWebhook')) {
            req.alias = 'updateWebhook'
          }
        })

        cy.visit('/admin/webhooks')
        cy.contains('a', 'Add Webhook').click()

        cy.url().should('include', '/admin/webhooks/add')
        cy.contains('a', new RegExp(name, 'i')).click()

        cy.url().should('include', `/admin/webhooks/add/${name}`)
        cy.get(`[data-cy=webhook-form][data-cy-template=${template}]`).should('exist')

        cy.get('[data-cy=webhook-type] .react_select__control').click()
        cy.contains('.react_select__option', 'APPEAL_CREATED').click()

        cy.get('[data-cy=webhook-url]').clear()
        cy.get('[data-cy=webhook-url]').type(initialUrl)
        cy.get('[data-cy=submit-webhook-form]').click()

        cy.wait('@createWebhook', { timeout: 15000 }).then(({ response }) => {
          const errors = response?.body?.errors
          const id = response?.body?.data?.createWebhook?.id
          expect(errors, `createWebhook errors: ${JSON.stringify(errors)}`).to.equal(undefined)
          expect(String(id || ''), 'createWebhook returned no id').to.match(/^[\w-]+$/)
          cy.wrap(id).as('webhookId')
        })

        cy.url().should('match', /\/admin\/webhooks\/?$/)

        cy.get('@webhookId').then((id) => {
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`, { timeout: 10000 })
            .as('webhookItem')
        })

        cy.get('@webhookItem').find('[data-cy=webhook-url-display]').should('contain.text', initialUrl)

        cy.get('@webhookItem').trigger('mouseover')
        cy.get('@webhookItem')
          .find('[data-cy=webhook-test], [data-cy=webhook-test-mobile]')
          .first()
          .click({ force: true })

        cy.get('[data-cy=webhook-test-form]', { timeout: 10000 }).should('exist')
        cy.get('[data-cy=submit-webhook-test]').click({ force: true })

        cy.get('[data-cy=webhook-test-response], [data-cy=webhook-test-error]', { timeout: 15000 }).should('exist')

        cy.get('[data-cy=modal-cancel]').click({ force: true })
        cy.get('[data-cy=webhook-test-form]').should('not.exist')

        cy.get('@webhookId').then((id) => {
          cy.visit(`/admin/webhooks/${id}`)
          cy.get(`[data-cy=webhook-form][data-cy-template=${template}]`).should('exist')
          // Wait for react-hook-form to seed the field — otherwise our clear()
          // + type() races defaultValues sync and submits the unchanged URL.
          cy.get('[data-cy=webhook-url]').should('have.value', initialUrl)
          cy.get('[data-cy=webhook-url]').clear()
          cy.get('[data-cy=webhook-url]').should('have.value', '')
          cy.get('[data-cy=webhook-url]').type(updatedUrl)
          cy.get('[data-cy=webhook-url]').should('have.value', updatedUrl)
          cy.get('[data-cy=submit-webhook-form]').click()
        })

        cy.wait('@updateWebhook', { timeout: 15000 }).then(({ response }) => {
          const errors = response?.body?.errors
          const updated = response?.body?.data?.updateWebhook
          expect(errors, `updateWebhook errors: ${JSON.stringify(errors)}`).to.equal(undefined)
          expect(updated?.url, 'updateWebhook did not persist new URL').to.equal(updatedUrl)
        })

        cy.url().should('match', /\/admin\/webhooks\/?$/)
        cy.get('@webhookId').then((id) => {
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`, { timeout: 10000 })
            .find('[data-cy=webhook-url-display]')
            .should('contain.text', updatedUrl)

          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`).trigger('mouseover')
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`)
            .find('[data-cy=webhook-delete], [data-cy=webhook-delete-mobile]')
            .first()
            .click({ force: true })
          cy.get('[data-cy=modal-confirm]').click({ force: true })
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`).should('not.exist')
        })
      })
    })
  })
})
