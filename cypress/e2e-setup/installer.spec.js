// Walks through the first-run web installer end-to-end against a freshly
// recreated MySQL pair. The supervisor in cypress/scripts/setup-server.js
// runs server.js with no .env so it boots in setup mode; after we POST
// /api/setup/finalize the supervisor exits the setup-mode child and respawns
// it in normal mode (DISABLE_UI=true).
//
// Most coverage of input validation — and of the post-finalize lockdown
// behaviour (`/setup` returns 404 once an admin row + a server row exist) —
// lives in jest tests under server/test/. Here we focus on the bits that
// actually require a browser, plus the full happy-path through finalize so we
// have an integration-level safety net.
//
// The happy-path test deliberately does NOT verify the post-restart state for
// two reasons:
//   1. The supervisor restart leaves a normal-mode child running, which
//      would interfere with any Cypress retry of this test (the retry would
//      see the lingering child and freshly-wiped DB).
//   2. The lockdown behaviour is covered deterministically by
//      server/test/setup-lockdown-after-complete.test.js, so we don't lose
//      coverage by skipping it here.

const dotenvPath = Cypress.env('setup_dotenv_path')
const webuiDb = Cypress.env('setup_db_name')
const adminEmail = 'installer-admin@banmanagement.com'
const adminPassword = 'installerPassw0rd!'
// validator's default isUUID() (used by the admin preflight endpoint) only
// accepts RFC-compliant UUIDs, so the third group must start with the version
// digit (4 here) and the fourth with the variant nibble (8/9/a/b).
const adminUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

const setText = (selector, value, options = {}) => {
  cy.get(selector).clear()
  if (value != null && value !== '') cy.get(selector).type(String(value), options)
}

const fillDatabaseStep = (overrides = {}) => {
  const dbHost = Cypress.env('setup_db_host')
  const dbPort = Cypress.env('setup_db_port')
  const dbUser = Cypress.env('setup_db_user')
  const dbPassword = Cypress.env('setup_db_password')

  setText('[data-cy=setup-db-host]', dbHost)
  setText('[data-cy=setup-db-port]', String(dbPort))
  setText('[data-cy=setup-db-user]', dbUser)
  if (dbPassword) setText('[data-cy=setup-db-password]', dbPassword, { log: false })
  setText('[data-cy=setup-db-name]', overrides.webuiDb || webuiDb)

  if (overrides.createIfMissing) {
    cy.get('[data-cy=setup-db-create-details]').then(($el) => {
      if (!$el.attr('open')) cy.wrap($el).find('summary').click()
    })
    cy.get('[data-cy=setup-db-create]').should('be.visible').check()
  }
}

const fillServerStep = ({ bmDb, consoleUuid, customTable }) => {
  const dbHost = Cypress.env('setup_db_host')
  const dbPort = Cypress.env('setup_db_port')
  const dbUser = Cypress.env('setup_db_user')
  const dbPassword = Cypress.env('setup_db_password')

  cy.get('[data-cy=setup-server-mode-manual]').click()
  setText('[data-cy=setup-server-name]', 'E2E Server')
  setText('[data-cy=setup-server-host]', dbHost)
  setText('[data-cy=setup-server-port]', String(dbPort))
  setText('[data-cy=setup-server-user]', dbUser)
  if (dbPassword) setText('[data-cy=setup-server-password]', dbPassword, { log: false })
  setText('[data-cy=setup-server-database]', bmDb)
  setText('[data-cy=setup-server-console]', consoleUuid)

  if (customTable) {
    cy.get('[data-cy=setup-server-tables-details]').then(($el) => {
      if (!$el.attr('open')) cy.wrap($el).find('summary').click()
    })
    setText(`[data-cy=setup-server-table-${customTable.key}]`, customTable.value)
  }
}

const fillAdminStep = (overrides = {}) => {
  setText('[data-cy=setup-admin-email]', overrides.email || adminEmail)
  setText('[data-cy=setup-admin-password]', overrides.password || adminPassword, { log: false })
  setText('[data-cy=setup-admin-confirm]', overrides.confirmPassword || overrides.password || adminPassword, { log: false })
  setText('[data-cy=setup-admin-uuid]', overrides.uuid || adminUuid)
}

describe('web installer', () => {
  beforeEach(() => {
    cy.task('clearEnvFile', dotenvPath)
  })

  afterEach(() => {
    cy.task('dropSetupDbs').then(() => null)
  })

  describe('validation', () => {
    beforeEach(() => {
      cy.task('prepareSetupDb', { createWebui: true })
      cy.visit('/setup')
      cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
    })

    it('renders all visible steps when no token is required', () => {
      cy.get('[data-cy=setup-progress-step]').should('have.length', 4)
      cy.get('[data-cy=setup-progress-step][data-cy-active=true]').should('contain.text', 'Database')
    })

    it('shows an error when the database step has invalid credentials', () => {
      setText('[data-cy=setup-db-host]', '127.0.0.1')
      setText('[data-cy=setup-db-user]', 'definitely-not-a-real-user')
      setText('[data-cy=setup-db-password]', 'wrong', { log: false })
      setText('[data-cy=setup-db-name]', 'does-not-exist-db')
      cy.get('[data-cy=setup-next]').click()
      cy.get('[data-cy=setup-error]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy=setup-progress-step][data-cy-active=true]').should('contain.text', 'Database')
    })

    it('blocks server step submission when the console UUID format is invalid', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ bmDb }) => {
        fillDatabaseStep()
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 10000 })
          .should('contain.text', 'Server')

        fillServerStep({ bmDb, consoleUuid: 'not-a-uuid' })
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-error]').should('contain.text', 'Console UUID')
      })
    })

    it('rejects mismatched admin passwords client-side without calling the server', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ bmDb, consoleUuid }) => {
        fillDatabaseStep()
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 10000 })
          .should('contain.text', 'Server')
        fillServerStep({ bmDb, consoleUuid })
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Admin')
        fillAdminStep({ password: 'matching1', confirmPassword: 'matching2' })
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-error]').should('contain.text', 'Passwords do not match')
      })
    })

    it('rejects an admin player UUID that is not a valid UUID', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ bmDb, consoleUuid }) => {
        fillDatabaseStep()
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 10000 })
          .should('contain.text', 'Server')
        fillServerStep({ bmDb, consoleUuid })
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Admin')
        fillAdminStep({ uuid: 'not-a-uuid' })
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-error]').should('contain.text', 'UUID')
      })
    })
  })

  describe('create-database-if-missing flow', () => {
    it('lets the installer create the WebUI database via "Create database if missing"', () => {
      cy.task('prepareSetupDb', { createWebui: false }).then(({ bmDb, consoleUuid }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')

        fillDatabaseStep({ createIfMissing: true })
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Server')

        fillServerStep({ bmDb, consoleUuid })
        cy.get('[data-cy=setup-next]').click()
        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Admin')
      })
    })
  })

  // Retries are explicitly disabled for the happy-path: finalize causes the
  // supervisor to exit the setup-mode child and respawn it in normal mode, so
  // a retry would (a) wait through that restart and (b) hit a normal-mode
  // child that's still pointing at the just-wiped database from afterEach.
  // The post-finalize /setup lockdown is covered by
  // server/test/setup-lockdown-after-complete.test.js instead.
  describe('happy path', { retries: 0 }, () => {
    it('completes the installer end-to-end and persists the .env file', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ bmDb, consoleUuid }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')

        fillDatabaseStep()
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Server')
        fillServerStep({
          bmDb,
          consoleUuid,
          customTable: { key: 'players', value: 'bm_players' }
        })
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Admin')
        fillAdminStep()
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
          .should('contain.text', 'Review')
        cy.get('[data-cy=setup-review-summary]').should('contain.text', adminEmail)
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-success]', { timeout: 30000 }).should('be.visible')
        cy.get('[data-cy=setup-continue-login]').should('be.visible')

        cy.task('readEnvFile', dotenvPath).should((contents) => {
          expect(contents).to.be.a('string')
          expect(contents).to.match(/ENCRYPTION_KEY=/)
          expect(contents).to.match(/SESSION_KEY=/)
          expect(contents).to.match(new RegExp(`DB_NAME=${webuiDb}`))
        })
      })
    })
  })
})
