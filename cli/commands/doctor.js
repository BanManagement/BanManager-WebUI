const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { Command, Flags } = require('@oclif/core')
const chalk = require('chalk')
const setupPool = require('../../server/connections/pool')
const cryptoLib = require('../../server/data/crypto')
const { tables: defaultTables } = require('../../server/data/tables')
const {
  validateEnv,
  formatValidationError,
  validateDbConnection,
  checkMigrationStatus,
  isSetupComplete,
  verifyTables,
  verifyConsolePlayer,
  hasKeys,
  hasDbVars,
  isValidHexKey
} = require('../../server/setup')

const STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  WARN: 'warn',
  SKIP: 'skip'
}

const symbol = (status) => {
  switch (status) {
    case STATUS.PASS: return chalk.green('PASS')
    case STATUS.FAIL: return chalk.red('FAIL')
    case STATUS.WARN: return chalk.yellow('WARN')
    case STATUS.SKIP: return chalk.gray('SKIP')
    default: return status
  }
}

const fetchHealth = (url, { timeoutMs = 3000 } = {}) => new Promise((resolve, reject) => {
  const lib = url.startsWith('https://') ? https : http
  const req = lib.get(url, (res) => {
    let body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => {
      try {
        resolve({ status: res.statusCode, body: JSON.parse(body) })
      } catch (_) {
        resolve({ status: res.statusCode, body })
      }
    })
  })

  req.on('error', reject)
  req.setTimeout(timeoutMs, () => {
    req.destroy(new Error(`Health check timed out after ${timeoutMs}ms`))
  })
})

class DoctorCommand extends Command {
  async run () {
    const { flags } = await this.parse(DoctorCommand)
    const checks = []
    const env = process.env
    let dbPool

    const record = (name, status, message, hint) => {
      checks.push({ name, status, message, hint })
      const head = `[${symbol(status)}] ${name}`
      this.log(head)
      if (message) this.log(`       ${message}`)
      if (hint) this.log(chalk.gray(`       hint: ${hint}`))
    }

    const envFiles = []
    const candidates = [
      env.DOTENV_CONFIG_PATH,
      path.join(process.cwd(), '.env'),
      '/app/config/.env',
      '/app/.env'
    ].filter(Boolean)

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) envFiles.push(candidate)
      } catch (_) {
        // Inaccessible candidates are not actionable here.
      }
    }

    if (envFiles.length === 0) {
      record('env file', STATUS.WARN, 'No .env file found in expected locations', 'Place .env in the project root, /app/config/.env (Docker), or set DOTENV_CONFIG_PATH')
    } else {
      record('env file', STATUS.PASS, `Loaded from: ${envFiles.join(', ')}`)
    }

    const setupMode = !hasKeys(env) || !hasDbVars(env)
    const validation = await validateEnv({ env, setupMode })

    if (validation.warnings.length || validation.issues.length) {
      const status = validation.issues.length ? STATUS.FAIL : STATUS.WARN
      record('environment variables', status, formatValidationError(validation))
    } else {
      record('environment variables', STATUS.PASS, 'All required variables are present and well-formed')
    }

    if (!hasDbVars(env)) {
      record('database connection', STATUS.SKIP, 'DB_HOST/DB_USER/DB_NAME not configured')
      record('migrations', STATUS.SKIP)
      record('admin user', STATUS.SKIP)
      record('banmanager server', STATUS.SKIP)
      record('console player', STATUS.SKIP)
      record('plugin tables', STATUS.SKIP)
    } else {
      const dbConfig = {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD || '',
        database: env.DB_NAME
      }

      const dbResult = await validateDbConnection(dbConfig)
      if (!dbResult.ok) {
        record('database connection', STATUS.FAIL, dbResult.error.message,
          'Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and ensure MySQL/MariaDB is reachable.')
        record('migrations', STATUS.SKIP)
        record('admin user', STATUS.SKIP)
        record('banmanager server', STATUS.SKIP)
        record('console player', STATUS.SKIP)
        record('plugin tables', STATUS.SKIP)
      } else {
        record('database connection', STATUS.PASS,
          `Connected to ${dbConfig.user}@${dbConfig.host}:${dbConfig.port || 3306}/${dbConfig.database}`)

        try {
          const migration = await checkMigrationStatus(dbConfig)
          if (migration.upToDate) {
            record('migrations', STATUS.PASS, `${migration.applied}/${migration.total} migrations applied`)
          } else {
            record('migrations', STATUS.FAIL,
              `${migration.applied}/${migration.total} migrations applied, ${migration.pending} pending`,
              'Run `npx bmwebui update` to apply pending migrations')
          }
        } catch (e) {
          record('migrations', STATUS.WARN, `Could not determine migration status: ${e.message}`)
        }

        dbPool = setupPool(dbConfig, undefined, { min: 1, max: 2 })

        try {
          const complete = await isSetupComplete(dbPool)
          if (complete) {
            record('admin user', STATUS.PASS, 'At least one admin user exists')
          } else {
            record('admin user', STATUS.FAIL, 'No admin user exists yet',
              'Run `npx bmwebui setup` (or visit /setup) to create the first admin')
          }
        } catch (e) {
          record('admin user', STATUS.WARN, `Could not check admin user: ${e.message}`)
        }

        let serverRow = null
        try {
          serverRow = await dbPool('bm_web_servers').first()
        } catch (e) {
          record('banmanager server', STATUS.WARN, `Could not query bm_web_servers: ${e.message}`)
        }

        if (!serverRow) {
          record('banmanager server', STATUS.WARN, 'No BanManager server configured yet')
          record('console player', STATUS.SKIP)
          record('plugin tables', STATUS.SKIP)
        } else {
          let serverPassword = ''
          let decryptError = null

          if (serverRow.password) {
            if (!isValidHexKey(env.ENCRYPTION_KEY)) {
              decryptError = 'ENCRYPTION_KEY is missing or malformed; cannot decrypt the stored BanManager password'
            } else {
              try {
                serverPassword = await cryptoLib.decrypt(env.ENCRYPTION_KEY, serverRow.password)
              } catch (e) {
                decryptError = `Failed to decrypt the stored BanManager password: ${e.message}`
              }
            }
          }

          let serverConn
          try {
            if (decryptError) throw new Error(decryptError)

            serverConn = setupPool({
              host: serverRow.host,
              port: serverRow.port,
              user: serverRow.user,
              password: serverPassword,
              database: serverRow.database
            }, undefined, { min: 1, max: 2 })

            await serverConn.raw('SELECT 1+1 AS result')
            record('banmanager server', STATUS.PASS,
              `Connected to ${serverRow.user}@${serverRow.host}:${serverRow.port}/${serverRow.database}`)
          } catch (e) {
            record('banmanager server', STATUS.FAIL, e.message,
              'Verify the BanManager database is reachable from this host (firewall, credentials)')
            record('console player', STATUS.SKIP)
            record('plugin tables', STATUS.SKIP)
            if (serverConn) await serverConn.destroy().catch(() => {})
            serverConn = null
          }

          if (serverConn) {
            let tables = defaultTables
            try {
              tables = serverRow.tables ? { ...defaultTables, ...JSON.parse(serverRow.tables) } : defaultTables
            } catch (_) {
              // fall back to defaults
            }

            try {
              const tableCheck = await verifyTables(serverConn, tables)
              if (tableCheck.ok) {
                record('plugin tables', STATUS.PASS, `${Object.keys(tables).length} tables verified`)
              } else {
                const missingList = tableCheck.missing.map((m) => `${m.key} (${m.table})`).join(', ')
                record('plugin tables', STATUS.FAIL, `Missing tables: ${missingList}`,
                  'Update bm_web_servers.tables JSON or rerun `npx bmwebui setup` to remap table names')
              }
            } catch (e) {
              record('plugin tables', STATUS.WARN, `Could not verify tables: ${e.message}`)
            }

            try {
              const consoleResult = await verifyConsolePlayer(serverConn, tables.players, serverRow.console)
              if (consoleResult.ok) {
                record('console player', STATUS.PASS, `Console UUID resolves to ${consoleResult.player.name}`)
              } else if (consoleResult.reason === 'missing-uuid' || consoleResult.reason === 'invalid-uuid') {
                record('console player', STATUS.FAIL, `Stored console UUID is ${consoleResult.reason}`,
                  'Update the bm_web_servers.console column with the UUID from BanManager/console.yml')
              } else {
                record('console player', STATUS.FAIL, 'Console UUID is not present in bm_players',
                  'Make sure the BanManager plugin has run at least once with the configured console UUID')
              }
            } catch (e) {
              record('console player', STATUS.WARN, `Could not verify console player: ${e.message}`)
            }

            await serverConn.destroy().catch(() => {})
          }
        }
      }
    }

    if (flags.url) {
      try {
        const result = await fetchHealth(flags.url)
        if (result.status === 200 && result.body && result.body.status === 'ok') {
          record('http /health', STATUS.PASS, `${flags.url} responded OK`)
        } else if (result.status === 200) {
          record('http /health', STATUS.WARN, `${flags.url} responded with ${JSON.stringify(result.body)}`)
        } else {
          record('http /health', STATUS.FAIL, `${flags.url} returned status ${result.status}`)
        }
      } catch (e) {
        record('http /health', STATUS.FAIL, `Could not reach ${flags.url}: ${e.message}`,
          'If the WebUI is running on a different host or port, pass --url=http://host:port/health')
      }
    } else {
      record('http /health', STATUS.SKIP,
        'Skipped (pass --url=http://host:port/health to test a running server)')
    }

    if (dbPool) await dbPool.destroy().catch(() => {})

    const passed = checks.filter((c) => c.status === STATUS.PASS)
    const failed = checks.filter((c) => c.status === STATUS.FAIL)
    const warned = checks.filter((c) => c.status === STATUS.WARN)
    const skipped = checks.filter((c) => c.status === STATUS.SKIP)

    this.log('')
    this.log(chalk.bold(`Doctor finished: ${passed.length} pass, ${warned.length} warn, ${failed.length} fail, ${skipped.length} skip`))

    if (failed.length || (flags.strict && warned.length)) {
      this.exit(1)
    }
  }
}

DoctorCommand.description = 'Check that the WebUI installation is healthy'
DoctorCommand.flags = {
  url: Flags.string({
    description: 'URL to a running /health endpoint (e.g. http://127.0.0.1:3000/health) to include the HTTP probe'
  }),
  strict: Flags.boolean({
    description: 'Treat warnings as failures (exit non-zero if any warn). Useful in CI/CD.',
    default: false
  })
}

module.exports = DoctorCommand
