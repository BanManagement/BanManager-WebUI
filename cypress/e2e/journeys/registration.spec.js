/// <reference types="cypress" />

const data = require('../../fixtures/e2e-data.json')

describe('Registration & PIN-based account flows + global player search', () => {
  beforeEach(() => {
    cy.clearCookies()
  })

  it('validates password mismatch then logs in via PIN and registers an account end-to-end', () => {
    cy.loginAsPin(data.pinOnlyPlayerName, data.pinOnlyPinValue, data.serverId)

    cy.visit('/account/register')

    cy.get('[data-cy=email]').should('be.visible').type(`mismatch+${Date.now()}@banmanagement.com`)
    cy.get('[data-cy=password]').type('matchingPa55!')
    cy.get('[data-cy=confirm-password]').type('different5566')

    cy.get('[data-cy=submit-register]').click()

    cy.contains('Passwords do not match').should('exist')
    cy.url().should('include', '/account/register')

    cy.get('[data-cy=email]').clear()
    cy.get('[data-cy=email]').type(`pinnewbie+${Date.now()}@banmanagement.com`)
    cy.get('[data-cy=password]').clear()
    cy.get('[data-cy=password]').type('newAccount-Pa55!')
    cy.get('[data-cy=confirm-password]').clear()
    cy.get('[data-cy=confirm-password]').type('newAccount-Pa55!')

    cy.get('[data-cy=submit-register]').click()

    cy.url({ timeout: 10000 }).should('include', '/dashboard')
  })

  it('forgotten password page renders the PIN login form', () => {
    cy.visit('/forgotten-password')

    cy.title().should('include', 'Forgotten Password')

    cy.get('[data-cy=submit-login-pin]').should('exist')
  })

  it('logs the existing user in via PIN through the appeal flow', () => {
    cy.visit('/appeal/pin')

    cy.get('.react_select__control', { timeout: 10000 }).should('exist')

    cy.get('input[name=name]').type(data.pinPlayerName)

    const expectedPin = data.pinValue

    cy.get('input[inputmode=numeric]').should('have.length', 6).then($inputs => {
      for (let i = 0; i < 6; i++) {
        cy.wrap($inputs[i]).type(expectedPin[i], { force: true })
      }
    })

    cy.get('[data-cy=submit-login-pin]').click()
    cy.url({ timeout: 10000 }).should('include', '/appeal/punishment')
  })

  it('global player search in the nav navigates to player profile pages', () => {
    cy.loginAsAdmin()
    cy.visit('/dashboard')

    cy.get('[data-cy=player-search]').should('be.visible').within(() => {
      cy.get('.react_select__control').click()
      cy.get('input').first().type(data.bannedPlayerName)
    })

    cy.get('.react_select__option', { timeout: 10000 }).contains(data.bannedPlayerName).click()

    cy.url({ timeout: 10000 }).should('match', /\/player\/[\w-]+/)
    cy.contains(data.bannedPlayerName).should('exist')
  })
})
