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
        // Cypress retries reuse the spec context, so we mint per-attempt URLs
        // using Date.now() to avoid clashing with rows that previous attempts
        // left behind in the shared test database.
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
          // Capture the new id directly from the mutation response so we
          // never have to disambiguate via `.last()` on the list page (which
          // is unreliable: listWebhooks has no ORDER BY, retries can leave
          // older rows behind, and the mobile/desktop variants render twice).
          cy.wrap(id).as('webhookId')
        })

        // After the mutation we land on /admin/webhooks. The list page reads
        // listWebhooks via SWR, which keeps the previous response cached past
        // the navigation back from the add page (no revalidate-on-mount,
        // defaults dedupe 2s), so the brand-new row may not appear. Force a
        // reload so the assertions run against fresh data.
        cy.url().should('match', /\/admin\/webhooks\/?$/)
        cy.reload()

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
          // Wait for the form to fully hydrate the URL field before mutating it.
          // Without this Cypress will race react-hook-form's defaultValues sync
          // and may submit the original URL value instead of the typed one.
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
        // The list page reads listWebhooks via SWR which keeps the previous
        // response cached past the navigation back from the edit page (no
        // revalidate-on-mount, defaults dedupe 2s), so the row can render with
        // the pre-edit URL. Force a reload so the assertion runs against fresh
        // data instead of racing the cache.
        cy.reload()
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
