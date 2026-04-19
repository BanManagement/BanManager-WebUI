// Exercises the two non-default ingestion modes of the server step (paste
// + path). Both delegate to parseBanManagerConfig server-side via
// /api/setup/server.

const dotenvPath = Cypress.env('setup_dotenv_path')

const setText = (selector, value, options = {}) => {
  cy.get(selector).clear()
  if (value != null && value !== '') cy.get(selector).type(String(value), options)
}

const setTextArea = (selector, value) => {
  cy.get(selector).clear()
  cy.get(selector).invoke('val', value).trigger('change')
}

const buildConfigYaml = ({ host, port, user, password, name }) => `databases:
  local:
    host: ${host}
    port: ${port}
    user: ${user}
    password: '${password}'
    name: ${name}
    tables:
      players: bm_players
`

const buildConsoleYaml = (uuid) => `uuid: ${uuid}\n`

const fillDatabaseStep = (webuiDb) => {
  const dbHost = Cypress.env('setup_db_host')
  const dbPort = Cypress.env('setup_db_port')
  const dbUser = Cypress.env('setup_db_user')
  const dbPassword = Cypress.env('setup_db_password')

  setText('[data-cy=setup-db-host]', dbHost)
  setText('[data-cy=setup-db-port]', String(dbPort))
  setText('[data-cy=setup-db-user]', dbUser)
  if (dbPassword) setText('[data-cy=setup-db-password]', dbPassword, { log: false })
  setText('[data-cy=setup-db-name]', webuiDb)
  cy.get('[data-cy=setup-next]').click()
  cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 15000 })
    .should('contain.text', 'Server')
}

describe('web installer - config import modes', () => {
  beforeEach(() => {
    cy.task('clearEnvFile', dotenvPath)
  })

  afterEach(() => {
    cy.task('dropSetupDbs').then(() => null)
  })

  describe('paste mode', () => {
    it('accepts pasted config.yml + console.yml and proceeds to the admin step', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb, bmDb, consoleUuid }) => {
        const configYaml = buildConfigYaml({
          host: Cypress.env('setup_db_host'),
          port: Cypress.env('setup_db_port'),
          user: Cypress.env('setup_db_user'),
          password: Cypress.env('setup_db_password') || '',
          name: bmDb
        })
        const consoleYaml = buildConsoleYaml(consoleUuid)

        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-paste]').click()
        cy.get('[data-cy=setup-step][data-cy-mode=paste]').should('exist')
        setTextArea('[data-cy=setup-server-config-yaml]', configYaml)
        setTextArea('[data-cy=setup-server-console-yaml]', consoleYaml)
        setText('[data-cy=setup-server-name]', 'Pasted Server')

        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 20000 })
          .should('contain.text', 'Admin')
      })
    })

    it('shows an error when the pasted YAML has no databases.local section', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-paste]').click()
        cy.get('[data-cy=setup-step][data-cy-mode=paste]').should('exist')
        setTextArea('[data-cy=setup-server-config-yaml]', 'notDatabases:\n  thing: 1\n')
        setTextArea('[data-cy=setup-server-console-yaml]', 'uuid: 00000000-0000-0000-0000-000000000001\n')
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-error]', { timeout: 10000 })
          .should('be.visible')
          .and('contain.text', 'databases.local')
      })
    })

    it('shows an error when console.yml does not contain a uuid', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb, bmDb }) => {
        const configYaml = buildConfigYaml({
          host: Cypress.env('setup_db_host'),
          port: Cypress.env('setup_db_port'),
          user: Cypress.env('setup_db_user'),
          password: Cypress.env('setup_db_password') || '',
          name: bmDb
        })

        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-paste]').click()
        setTextArea('[data-cy=setup-server-config-yaml]', configYaml)
        setTextArea('[data-cy=setup-server-console-yaml]', 'something: else\n')
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-error]', { timeout: 10000 })
          .should('be.visible')
          .and('contain.text', 'Console UUID')
      })
    })

    it('blocks submission when both textareas are blank', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-paste]').click()
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-error]')
          .should('be.visible')
          .and('contain.text', 'config.yml')
      })
    })
  })

  describe('path mode', () => {
    it('accepts a directory containing config.yml + console.yml', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb, bmDb, consoleUuid }) => {
        const configYaml = buildConfigYaml({
          host: Cypress.env('setup_db_host'),
          port: Cypress.env('setup_db_port'),
          user: Cypress.env('setup_db_user'),
          password: Cypress.env('setup_db_password') || '',
          name: bmDb
        })

        cy.task('writeBmConfigFixture', { filename: 'config.yml', contents: configYaml }).then((dir) => {
          cy.task('writeBmConfigFixture', {
            filename: 'console.yml',
            contents: buildConsoleYaml(consoleUuid),
            directory: dir
          })

          cy.visit('/setup')
          cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
          fillDatabaseStep(webuiDb)

          cy.get('[data-cy=setup-server-mode-path]').click()
          cy.get('[data-cy=setup-step][data-cy-mode=path]').should('exist')
          setText('[data-cy=setup-server-path]', dir)
          setText('[data-cy=setup-server-name]', 'Path Server')
          cy.get('[data-cy=setup-next]').click()

          cy.get('[data-cy=setup-progress-step][data-cy-active=true]', { timeout: 20000 })
            .should('contain.text', 'Admin')
        })
      })
    })

    it('shows an error when the supplied path does not exist', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-path]').click()
        setText('[data-cy=setup-server-path]', '/tmp/this-path-definitely-does-not-exist-bm-e2e')
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-error]', { timeout: 10000 })
          .should('be.visible')
          .and('contain.text', 'Could not load BanManager config')
      })
    })

    it('blocks submission when the path field is empty', () => {
      cy.task('prepareSetupDb', { createWebui: true }).then(({ webuiDb }) => {
        cy.visit('/setup')
        cy.get('[data-cy=setup-progress-step][data-cy-step=database]').should('exist')
        fillDatabaseStep(webuiDb)

        cy.get('[data-cy=setup-server-mode-path]').click()
        cy.get('[data-cy=setup-server-path]').clear()
        cy.get('[data-cy=setup-next]').click()

        cy.get('[data-cy=setup-error]')
          .should('be.visible')
          .and('contain.text', 'filesystem path is required')
      })
    })
  })
})
