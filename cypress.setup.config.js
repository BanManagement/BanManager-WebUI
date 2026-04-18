const { defineConfig } = require('cypress')
const http = require('http')
require('dotenv').config()

const port = process.env.SETUP_PORT || 3001

const requestSetupState = () => new Promise((resolve) => {
  const req = http.request({
    host: '127.0.0.1',
    port: Number(port),
    path: '/api/setup/state',
    method: 'GET',
    timeout: 4000
  }, (res) => {
    const chunks = []
    res.on('data', (chunk) => chunks.push(chunk))
    res.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      let body = null
      if (raw) {
        try {
          body = JSON.parse(raw)
        } catch (parseErr) {
          body = { _parseError: parseErr.message, _raw: raw }
        }
      }
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body })
    })
  })
  req.on('timeout', () => { req.destroy(new Error('timeout')) })
  req.on('error', (err) => { resolve({ ok: false, status: 0, body: null, error: err.code || err.message }) })
  req.end()
})

module.exports = defineConfig({
  retries: {
    runMode: 1,
    openMode: 0
  },
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: `http://localhost:${port}`,
    specPattern: 'cypress/e2e-setup/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    setupNodeEvents (on, config) {
      const fs = require('fs')
      const { prepareSetupDb, dropSetupDbs, CONSOLE_UUID } = require('./cypress/scripts/prepare-setup-db')

      on('task', {
        // Write a config.yml or console.yml fixture to disk so the path-mode
        // installer test can ingest a real file. If `directory` is supplied
        // the file is written there (existing dir reused); otherwise a fresh
        // tmp directory is created. Returns the absolute path of the
        // directory the file was written into so callers can chain multiple
        // files into the same dir.
        writeBmConfigFixture ({ filename, contents, directory }) {
          const path = require('path')
          const os = require('os')
          const tmp = directory || fs.mkdtempSync(path.join(os.tmpdir(), 'bm-setup-fixture-'))
          if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })
          const target = path.join(tmp, filename)
          fs.writeFileSync(target, contents, 'utf8')
          return tmp
        },
        // Wipes any existing throwaway DBs, recreates the BanManager DB with
        // bm_* tables and a console player row, and (optionally) the WebUI DB.
        // Always returns { webuiDb, bmDb, consoleUuid }.
        prepareSetupDb (opts = {}) {
          return prepareSetupDb(opts)
        },
        dropSetupDbs (opts = {}) {
          return dropSetupDbs(opts)
        },
        readEnvFile (filePath) {
          if (!fs.existsSync(filePath)) return null
          return fs.readFileSync(filePath, 'utf8')
        },
        clearEnvFile (filePath) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          return null
        },
        getSetupConsoleUuid () {
          return CONSOLE_UUID
        },
        sleep (ms) {
          return new Promise((resolve) => setTimeout(() => resolve(null), ms))
        },
        // Polling helper that swallows ECONNREFUSED / connection errors during
        // the supervisor's setup-mode -> normal-mode child restart so the spec
        // can wait through the gap instead of failing on cy.request().
        fetchSetupState () {
          return requestSetupState()
        }
      })

      config.env.setup_db_host = config.env.setup_db_host || process.env.DB_HOST || '127.0.0.1'
      config.env.setup_db_port = config.env.setup_db_port || process.env.DB_PORT || '3306'
      config.env.setup_db_user = config.env.setup_db_user || process.env.DB_USER || 'root'
      config.env.setup_db_password = config.env.setup_db_password || process.env.DB_PASSWORD || ''
      config.env.setup_dotenv_path = config.env.setup_dotenv_path || process.env.SETUP_DOTENV_PATH || '/tmp/bm-setup-test.env'
      config.env.setup_db_name = config.env.setup_db_name || process.env.SETUP_DB_NAME || 'bm_e2e_setup'
      config.env.setup_token = config.env.setup_token || process.env.SETUP_TOKEN || ''

      return config
    }
  }
})
