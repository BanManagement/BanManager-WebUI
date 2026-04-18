describe('Admin webhook lifecycle', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  const variants = [
    { name: 'custom', template: 'CUSTOM', initialUrl: 'https://example.com/cypress-webhook' },
    { name: 'discord', template: 'DISCORD', initialUrl: 'https://example.com/cypress-discord' }
  ]

  variants.forEach(({ name, template, initialUrl }) => {
    describe(`${name} webhook`, () => {
      const updatedUrl = `${initialUrl}/edited`

      it(`creates, tests, edits and deletes a ${name} webhook`, () => {
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

        cy.url().should('match', /\/admin\/webhooks\/?$/)
        cy.get(`[data-cy=webhook-item][data-cy-template=${template}]`).should('exist')

        cy.get(`[data-cy=webhook-item][data-cy-template=${template}]`)
          .last()
          .as('webhookItem')

        cy.get('@webhookItem')
          .invoke('attr', 'data-cy-webhook-id')
          .as('webhookId')

        cy.get('@webhookItem').find('[data-cy=webhook-url-display]').should('contain.text', initialUrl)

        cy.get('@webhookItem').trigger('mouseover')
        cy.get('@webhookItem').find('[data-cy=webhook-test], [data-cy=webhook-test-mobile]').first().click({ force: true })

        cy.get('[data-cy=webhook-test-form]', { timeout: 10000 }).filter(':visible').first().should('be.visible').within(() => {
          cy.get('[data-cy=submit-webhook-test]').click()
        })

        cy.get('[data-cy=webhook-test-response], [data-cy=webhook-test-error]', { timeout: 15000 }).should('exist')

        cy.get('[data-cy=modal-cancel]').filter(':visible').first().click()

        cy.get('@webhookId').then((id) => {
          cy.visit(`/admin/webhooks/${id}`)
          cy.get(`[data-cy=webhook-form][data-cy-template=${template}]`).should('exist')
          cy.get('[data-cy=webhook-url]').clear()
          cy.get('[data-cy=webhook-url]').type(updatedUrl)
          cy.get('[data-cy=submit-webhook-form]').click()
        })

        cy.url().should('match', /\/admin\/webhooks\/?$/)
        cy.get('@webhookId').then((id) => {
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`)
            .find('[data-cy=webhook-url-display]')
            .should('contain.text', updatedUrl)

          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`).trigger('mouseover')
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`)
            .find('[data-cy=webhook-delete], [data-cy=webhook-delete-mobile]')
            .first()
            .click({ force: true })
          cy.get('[data-cy=modal-confirm]').filter(':visible').first().click()
          cy.get(`[data-cy=webhook-item][data-cy-webhook-id="${id}"]`).should('not.exist')
        })
      })
    })
  })
})
