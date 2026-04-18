/// <reference types="cypress" />

describe('Custom error pages', () => {
  it('renders the 404 page for an unknown route', () => {
    cy.visit('/this-route-definitely-does-not-exist-1234567890', { failOnStatusCode: false })

    cy.title().should('include', 'Not Found')

    cy.contains('Oops! Page Not Found').should('exist')
    cy.contains('Head to the Homepage').should('exist')

    cy.get('a[href="/"]').first().click()
    cy.url().should('match', /\/(login|dashboard)?$/)
  })

  it('renders the 500 page when visited directly', () => {
    cy.visit('/500')

    cy.title().should('include', 'Error')

    cy.contains('Something went wrong').should('exist')
    cy.contains('Head to the Homepage').should('exist')

    cy.get('a[href="/"]').first().click()
    cy.url().should('match', /\/(login|dashboard)?$/)
  })
})
