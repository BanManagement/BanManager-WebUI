/// <reference types="cypress" />

const data = require('../../fixtures/e2e-data.json')

const APPEAL_REASON = 'I have read the rules and understand what I did wrong. ' +
  'It will not happen again. Please give me another chance.'
const ADMIN_COMMENT = 'Thanks for the appeal. Reviewing now.'

describe('Appeal lifecycle - submit, admin notify, review, resolve', () => {
  beforeEach(() => {
    cy.clearCookies()
  })

  it('regular user creates a warning appeal end-to-end and admin works it through to resolution', () => {
    cy.loginAsUser()

    cy.visit('/appeal/punishment')

    cy.get('[data-cy=punishment-picker]').should('be.visible')

    cy.get('[data-cy=punishment-picker-filter-warning]').should('exist')

    cy.get(`[data-cy=punishment-picker-item][data-cy-punishment-type=warning][data-cy-punishment-id="${data.userWarningId}"][data-cy-server-id="${data.serverId}"]`)
      .should('exist')
      .within(() => {
        cy.get('button').first().click()
        cy.contains('Appeal', { timeout: 5000 }).should('be.visible').click({ force: true })
      })

    cy.url({ timeout: 10000 }).should('include', `/appeal/punishment/${data.serverId}/warning/${data.userWarningId}`)

    // Wait for the appeal form to render before typing - the page issues a
    // playerWarning query first and the textarea only appears once it resolves.
    cy.get('[data-cy=submit-appeal]', { timeout: 10000 }).should('exist')

    // Surface the actual GraphQL response so a server-side rejection (e.g. ACL)
    // produces an actionable assertion instead of a silent "URL didn't change".
    cy.intercept('POST', '/graphql', (req) => {
      if (typeof req.body?.query === 'string' && req.body.query.includes('createAppeal')) {
        req.alias = 'createAppeal'
      }
    })

    cy.get('textarea').first().type(APPEAL_REASON)

    cy.get('[data-cy=submit-appeal]').should('not.be.disabled').click()

    cy.wait('@createAppeal', { timeout: 10000 }).then(({ response }) => {
      const errors = response?.body?.errors
      const id = response?.body?.data?.createAppeal?.id
      expect(errors, `createAppeal errors: ${JSON.stringify(errors)}`).to.equal(undefined)
      expect(String(id || ''), 'createAppeal returned no id').to.match(/^\d+$/)
    })

    cy.url({ timeout: 10000 }).should('match', /\/appeals\/\d+$/)

    cy.location('pathname').then(pathname => {
      const appealId = pathname.split('/').pop()
      cy.wrap(appealId).as('newAppealId')
    })

    cy.contains(APPEAL_REASON.slice(0, 30)).should('exist')

    cy.logout()

    cy.loginAsAdmin()

    cy.visit('/notifications')

    cy.get('[data-cy=notification-list]').should('be.visible')

    cy.get('@newAppealId').then(appealId => {
      cy.get('[data-cy=notification-link][data-cy-notification-state=unread]', { timeout: 10000 })
        .first()
        .should('exist')
        .click()

      cy.url({ timeout: 10000 }).should('include', `/appeals/${appealId}`)
    })

    cy.contains(APPEAL_REASON.slice(0, 30)).should('exist')

    cy.get('textarea').first().type(ADMIN_COMMENT)
    cy.get('[data-cy=submit-report-comment-form]').first().click()

    cy.contains(ADMIN_COMMENT).should('exist')

    cy.get('[data-cy=appeal-assignee]').first().find('.react_select__control').click()
    cy.get('[data-cy=appeal-assignee]').first().find('.react_select__input').type('confuser')
    cy.get('.react_select__option', { timeout: 10000 }).contains('confuser').click()

    cy.get('[data-cy=appeal-state]').first().find('.react_select__control').click()
    cy.get('.react_select__option').contains(/Resolved|Denied/).click()

    cy.contains(/state changed|Resolved|Denied/i, { timeout: 10000 }).should('exist')

    cy.visit('/notifications')
    cy.get('[data-cy=notification-list]').should('be.visible')

    cy.get('@newAppealId').then(appealId => {
      cy.get('[data-cy=notification-link][data-cy-notification-id]').should('exist')
      cy.get('[data-cy=notification-link]').first().should('have.attr', 'data-cy-notification-state', 'read')
    })
  })

  it('exercises the punishment picker filters and empty state on a clean account', () => {
    cy.loginAsUser()

    cy.visit('/appeal/punishment')

    cy.get('[data-cy=punishment-picker]').should('be.visible')

    cy.get('[data-cy=punishment-picker-filter-ban]').click()
    cy.get('[data-cy=punishment-picker-filter-mute]').click()
    cy.get('[data-cy=punishment-picker-filter-warning]').click()

    cy.get('[data-cy=punishment-picker-empty]').should('exist')
    cy.get('[data-cy=punishment-picker-clear-filters]').click()

    cy.get('[data-cy=punishment-picker-item]').should('have.length.greaterThan', 0)
  })

  it('admin can view and update the seeded open ban appeal', () => {
    cy.loginAsAdmin()

    cy.visit(`/appeals/${data.openAppealId}`)

    cy.contains(/Appeal/i).should('exist')

    cy.get('[data-cy=appeal-state]').first().should('exist')
    cy.get('[data-cy=appeal-assignee]').first().should('exist')

    cy.get('textarea').first().type('Investigating this ban appeal')
    cy.get('[data-cy=submit-report-comment-form]').first().click()

    cy.contains('Investigating this ban appeal').should('exist')
  })

  it('admin can view the seeded assigned mute appeal', () => {
    cy.loginAsAdmin()

    cy.visit(`/appeals/${data.assignedAppealId}`)

    cy.contains(/Appeal/i).should('exist')

    cy.get('[data-cy=appeal-state]').first().should('exist')

    cy.get('[data-cy=appeal-assignee]').first().should('exist').within(() => {
      cy.contains(/confuser/).should('exist')
    })
  })
})
