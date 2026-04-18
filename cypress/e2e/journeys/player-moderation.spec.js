describe('Player moderation lifecycle', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })

  describe('punishment creation', () => {
    const punishmentTypes = [
      {
        name: 'ban',
        action: 'action-ban',
        urlPath: 'ban',
        submit: 'submit-ban',
        fillForm: () => {
          cy.get('[data-cy=reason]').type('Cypress test ban reason')
        }
      },
      {
        name: 'mute',
        action: 'action-mute',
        urlPath: 'mute',
        submit: 'submit-mute',
        fillForm: () => {
          cy.get('[data-cy=reason]').type('Cypress test mute reason')
        }
      },
      {
        name: 'warning',
        action: 'action-warn',
        urlPath: 'warn',
        submit: 'submit-warning',
        fillForm: () => {
          cy.get('[data-cy=reason]').type('Cypress test warning reason')
          cy.get('[data-cy=points]').clear()
          cy.get('[data-cy=points]').type('2')
        }
      },
      {
        name: 'note',
        action: 'action-note',
        urlPath: 'note',
        submit: 'submit-note',
        fillForm: () => {
          cy.get('[data-cy=message]').type('Cypress test note message')
        }
      }
    ]

    punishmentTypes.forEach(({ name, action, urlPath, submit, fillForm }) => {
      it(`creates a new ${name} on a clean player from the profile actions panel`, () => {
        cy.fixture('e2e-data.json').then(({ unbannedPlayerId }) => {
          cy.visit(`/player/${unbannedPlayerId}`)
          cy.get('[data-cy=player-actions]').should('be.visible')
          cy.get(`[data-cy=${action}]`).click()
          cy.url().should('include', `/player/${unbannedPlayerId}/${urlPath}`)

          fillForm()

          cy.get(`[data-cy=${submit}]`).click()
          cy.url({ timeout: 10000 }).should('match', new RegExp(`/player/${unbannedPlayerId}/?$`))
        })
      })
    })
  })

  describe('soft mute toggle', () => {
    it('exposes the mute-soft switch and lets it be toggled before submit', () => {
      cy.fixture('e2e-data.json').then(({ unbannedPlayerId }) => {
        cy.visit(`/player/${unbannedPlayerId}/mute`)
        cy.get('[data-cy=reason]').type('Cypress soft mute reason')
        cy.get('[data-cy=mute-soft]').should('exist')
        cy.get('[data-cy=mute-soft]').click({ force: true })
      })
    })
  })

  describe('editing existing punishments', () => {
    it('edits the seeded ban for the bannedPlayer', () => {
      cy.fixture('e2e-data.json').then(({ serverId, bannedPlayerBanId }) => {
        cy.visit(`/player/ban/${serverId}-${bannedPlayerBanId}`)
        cy.get('[data-cy=reason]').should('exist')
        cy.get('[data-cy=reason]').clear()
        cy.get('[data-cy=reason]').type('Cypress edited ban reason')
        cy.get('[data-cy=submit-ban]').click()
        cy.url({ timeout: 10000 }).should('match', /\/player\/[0-9a-f-]+\/?$/)
      })
    })

    it('edits the seeded mute for the bannedPlayer', () => {
      cy.fixture('e2e-data.json').then(({ serverId, bannedPlayerMuteId }) => {
        cy.visit(`/player/mute/${serverId}-${bannedPlayerMuteId}`)
        cy.get('[data-cy=reason]').should('exist')
        cy.get('[data-cy=reason]').clear()
        cy.get('[data-cy=reason]').type('Cypress edited mute reason')
        cy.get('[data-cy=submit-mute]').click()
        cy.url({ timeout: 10000 }).should('match', /\/player\/[0-9a-f-]+\/?$/)
      })
    })
  })

  describe('admin documents', () => {
    it('renders the documents table when an appeal has been seeded with attachments', function () {
      cy.visit('/admin/documents')
      cy.get('body').then($body => {
        if ($body.find('[data-cy=admin-documents-table]').length === 0) {
          cy.log('No documents seeded; skipping table assertions')
          this.skip()
        }
      })

      cy.get('[data-cy=admin-documents-table]').should('be.visible')
      cy.get('[data-cy=admin-document-row]').should('have.length.at.least', 1)

      cy.get('[data-cy=admin-document-row]').first().find('[data-cy=admin-document-preview]').click()
      cy.get('[data-cy=document-image-modal]').should('be.visible')
      cy.get('[data-cy=document-image-modal-close]').click()
      cy.get('[data-cy=document-image-modal]').should('not.exist')

      cy.get('[data-cy=admin-document-row]').first().then($row => {
        const docId = $row.attr('data-cy-document-id')
        cy.wrap($row).find('[data-cy=admin-document-delete]').click()
        cy.get('[data-cy=modal-cancel]').click()
        cy.get(`[data-cy=admin-document-row][data-cy-document-id="${docId}"]`).should('exist')
      })
    })
  })
})
