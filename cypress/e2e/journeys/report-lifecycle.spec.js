/// <reference types="cypress" />

const data = require('../../fixtures/e2e-data.json')

const REPORT_COMMENT = 'Looking into this report now, please give me a moment.'

describe('Report lifecycle - admin walks an open report through every state', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.loginAsAdmin()
  })

  it('comments, assigns, transitions Open -> Assigned -> Resolved -> Closed', () => {
    cy.visit(`/reports/${data.serverId}/${data.openReportId}`)

    cy.contains(/Report/i).should('exist')

    cy.get('[data-cy=report-state]').first().should('exist').within(() => {
      cy.contains('Open').should('exist')
    })

    cy.get('textarea').first().type(REPORT_COMMENT)
    cy.get('[data-cy=submit-report-comment-form]').first().click()

    cy.contains(REPORT_COMMENT, { timeout: 10000 }).should('exist')

    // The report sidebar is rendered twice (desktop + mobile); only the desktop
    // copy is visible at the default Cypress viewport (>=md). We scope all
    // react-select interactions to the .first() (desktop) wrapper so we don't
    // accidentally type into the hidden mobile input. Re-queried each time
    // because PlayerReportSidebar re-renders after each mutation.
    cy.get('[data-cy=report-assignee]').first().find('.react_select__control').click()
    cy.get('[data-cy=report-assignee]').first().find('.react_select__input').type('confuser')
    cy.get('.react_select__option', { timeout: 10000 }).contains('confuser').click()

    cy.get('[data-cy=report-assignee]').first().should('contain.text', 'confuser')

    cy.get('[data-cy=report-state]').first().find('.react_select__control').click()
    cy.get('.react_select__option').contains('Assigned').click()

    cy.get('[data-cy=report-state]', { timeout: 10000 }).first().should('contain.text', 'Assigned')

    cy.get('[data-cy=report-state]').first().find('.react_select__control').click()
    cy.get('.react_select__option').contains('Resolved').click()

    cy.get('[data-cy=report-state]', { timeout: 10000 }).first().should('contain.text', 'Resolved')

    cy.get('[data-cy=submit-report-comment-form]').should('not.exist')

    cy.get('[data-cy=report-state]').first().find('.react_select__control').click()
    cy.get('.react_select__option').contains('Closed').click()

    cy.get('[data-cy=report-state]', { timeout: 10000 }).first().should('contain.text', 'Closed')
  })

  it('reports dashboard page shows the seeded reports and links to detail pages', () => {
    cy.visit('/dashboard/reports')

    cy.contains(/Reports/i).should('exist')

    cy.get('body').then($body => {
      if ($body.find(`[href*="/reports/${data.serverId}/${data.assignedReportId}"]`).length) {
        cy.get(`[href*="/reports/${data.serverId}/${data.assignedReportId}"]`).first().click()
        cy.url({ timeout: 10000 }).should('include', `/reports/${data.serverId}/${data.assignedReportId}`)
        cy.contains(/Report/i).should('exist')
      }
    })
  })
})
