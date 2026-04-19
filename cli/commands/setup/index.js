const fs = require('fs').promises
const path = require('path')
const inquirer = require('inquirer')
const editDotenv = require('edit-dotenv')
const { Command, Flags } = require('@oclif/core')
const { isEmail, isLength, isUUID } = require('validator')
const { merge } = require('lodash')
const { parse, unparse } = require('uuid-parse')
const { generateServerId } = require('../../../server/data/generator')
const { hash } = require('../../../server/data/hash')
const setupPool = require('../../../server/connections/pool')
const crypto = require('../../../server/data/crypto')
const chalk = require('chalk')
const defaultTables = require('../../../server/data/tables').tables
const setupLib = require('../../../server/setup')

class SetupCommand extends Command {
  async run () {
    const { flags } = await this.parse(SetupCommand)

    if (flags.writeFile) {
      this.log(chalk.dim(`Setup is resumable — already-set values in ${flags.writeFile} will be reused, re-run anytime.`))
    } else {
      this.log(chalk.dim('Setup is resumable — already-set environment variables will be reused, re-run anytime.'))
    }

    let contents = ''
    const save = async (changes = {}) => {
      if (flags.writeFile) {
        try {
          contents = await fs.readFile(flags.writeFile, { encoding: 'utf8' })
        } catch (e) {
        }
      }

      contents = editDotenv(contents, changes)

      if (flags.writeFile) {
        try {
          await fs.writeFile(flags.writeFile, contents, 'utf8')
        } catch (e) {
          console.error(e)
          this.log('Unable to save progress')
        }
      }

      return contents
    }
    let SERVER_FOOTER_NAME = process.env.SERVER_FOOTER_NAME
    let CONTACT_EMAIL = process.env.CONTACT_EMAIL
    let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    let SESSION_KEY = process.env.SESSION_KEY
    let NOTIFICATION_VAPID_PUBLIC_KEY = process.env.NOTIFICATION_VAPID_PUBLIC_KEY
    let NOTIFICATION_VAPID_PRIVATE_KEY = process.env.NOTIFICATION_VAPID_PRIVATE_KEY
    let DB_HOST = process.env.DB_HOST
    let DB_PORT = process.env.DB_PORT
    let DB_USER = process.env.DB_USER
    let DB_PASSWORD = process.env.DB_PASSWORD
    let DB_NAME = process.env.DB_NAME

    if (SERVER_FOOTER_NAME) {
      this.log('SERVER_FOOTER_NAME detected, skipping')
    } else {
      const { value } = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: 'Server name (displayed in footer of website)',
        validate: function (input) {
          if (isLength(input, { min: 0, max: 32 })) return true

          return 'Invalid server footer name, only a maximum of 32 characters allowed'
        }
      }])

      SERVER_FOOTER_NAME = value
      await save({ SERVER_FOOTER_NAME, NODE_ENV: 'production' })
    }

    if (CONTACT_EMAIL) {
      this.log('CONTACT_EMAIL detected, skipping')
    } else {
      const { value } = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: 'Email address for push notification registration (Coming Soon)',
        validate: function (input) {
          if (isEmail(input)) return true

          return 'Email address is not valid. Please try again...'
        }
      }])

      CONTACT_EMAIL = value
      await save({ CONTACT_EMAIL })
    }

    if (ENCRYPTION_KEY) {
      this.log('ENCRYPTION_KEY detected, skipping')
    } else {
      ENCRYPTION_KEY = await setupLib.generateEncryptionKey()
      await save({ ENCRYPTION_KEY })
    }

    if (SESSION_KEY) {
      this.log('SESSION_KEY detected, skipping')
    } else {
      SESSION_KEY = await setupLib.generateSessionKey()
      await save({ SESSION_KEY })
    }

    if (NOTIFICATION_VAPID_PUBLIC_KEY && NOTIFICATION_VAPID_PRIVATE_KEY) {
      this.log('NOTIFICATION keys detected, skipping')
    } else {
      const { publicKey, privateKey } = setupLib.generateVapidKeyPair()
      NOTIFICATION_VAPID_PUBLIC_KEY = publicKey
      NOTIFICATION_VAPID_PRIVATE_KEY = privateKey

      await save({ NOTIFICATION_VAPID_PUBLIC_KEY, NOTIFICATION_VAPID_PRIVATE_KEY })
    }

    const connectToDb = async (config) => {
      const result = await setupLib.validateDbConnection(config, { destroy: false })

      if (!result.ok) {
        console.error(result.error)
        return null
      }

      return result.conn
    }
    const askDb = async (setEnv, defaults = {}) => {
      const messagePrefix = !setEnv ? 'Server ' : ''
      const dbQuestions = [
        { type: 'input', name: 'host', message: `${messagePrefix}Database Host`, default: defaults.host || DB_HOST || '127.0.0.1' },
        { type: 'input', name: 'port', message: `${messagePrefix}Database Port`, default: defaults.port || DB_PORT || 3306 },
        { type: 'input', name: 'user', message: `${messagePrefix}Database User`, default: defaults.user || DB_USER },
        { type: 'password', name: 'password', message: `${messagePrefix}Database Password`, default: defaults.password || DB_PASSWORD },
        { type: 'input', name: 'database', message: `${messagePrefix}Database Name`, default: defaults.database || DB_NAME }
      ]
      const dbAnswers = await inquirer.prompt(dbQuestions)
      this.log('Attempting to connect to database')

      if (setEnv) {
        DB_HOST = dbAnswers.host + ''
        DB_PORT = dbAnswers.port + ''
        DB_USER = dbAnswers.user + ''
        DB_PASSWORD = dbAnswers.password + ''
        DB_NAME = dbAnswers.database + ''
      }

      const conn = await connectToDb(dbAnswers)

      if (!conn) {
        this.log('Failed to connect to database, please re-enter details')
        return askDb(setEnv, defaults)
      }

      this.log(`Connected to ${dbAnswers.user}@${dbAnswers.host}:${dbAnswers.port}/${dbAnswers.database} successfully`)

      return conn
    }
    let bmConfig = null

    const tryParseBmConfig = async (configPath) => {
      try {
        return await setupLib.parseBanManagerConfig(configPath)
      } catch (e) {
        if (e.code === 'PARSE_BANMANAGER_CONFIG_NOT_FOUND') {
          this.log(chalk.yellow(`No config found at ${configPath}`))
        } else if (e.code === 'PARSE_BANMANAGER_CONFIG_INVALID_YAML') {
          this.log(chalk.yellow(`Could not parse YAML at ${configPath}: ${e.message}`))
        } else {
          this.log(chalk.yellow(`Could not read ${configPath}: ${e.message}`))
        }
        return null
      }
    }

    let conn

    if (DB_HOST && DB_NAME) {
      this.log('Database connection details detected, verifying')

      conn = await connectToDb({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME })

      if (!conn) {
        this.log('Failed to verify database connection details, please verify')
        conn = await askDb(true)
      }
    } else {
      conn = await askDb(true)
    }

    await save({ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME })

    this.log('Setting up database...')

    await setupLib.runMigrations({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    })

    this.log(chalk.green('Done'))

    const results = await conn('bm_web_servers').limit(1)
    let serverConn
    let server

    if (results.length) {
      server = results[0]
      this.log(`BanManager Server ${server.name} detected, skipping server setup, attempting to connect`)

      try {
        server.password = await crypto.decrypt(ENCRYPTION_KEY, server.password)

        serverConn = setupPool({
          host: server.host,
          port: server.port,
          database: server.database,
          user: server.user,
          password: server.password
        }, undefined, { min: 1, max: 5 })

        await serverConn.raw('SELECT 1+1 AS result')
      } catch (e) {
        this.log(`Connection to ${server.name} failed`)
      }
    }

    if (!serverConn) {
      this.log('Add a BanManager Server by specifying the databases.local connection details from your BanManager/config.yml file')

      const { autoDetect } = await inquirer.prompt([{
        type: 'confirm',
        name: 'autoDetect',
        message: 'Auto-detect from your BanManager plugin folder (config.yml + console.yml)?',
        default: true
      }])

      let serverDefaults = {}

      if (autoDetect) {
        const { configPath } = await inquirer.prompt([{
          type: 'input',
          name: 'configPath',
          message: 'Path to BanManager plugin folder (or config.yml)',
          default: process.env.BM_CONFIG_PATH || './plugins/BanManager'
        }])

        const parsed = await tryParseBmConfig(path.resolve(configPath))

        if (parsed) {
          bmConfig = parsed
          if (parsed.databaseConfig) {
            this.log(chalk.green(`Detected BanManager database: ${parsed.databaseConfig.user || ''}@${parsed.databaseConfig.host}:${parsed.databaseConfig.port || 3306}/${parsed.databaseConfig.database}`))
            serverDefaults = parsed.databaseConfig
          }
          if (parsed.consoleUuid) {
            this.log(chalk.green(`Detected console UUID: ${parsed.consoleUuid}`))
          }
        }
      }
      const sameAsWebui = !autoDetect && DB_HOST && await (async () => {
        const { same } = await inquirer.prompt([{
          type: 'confirm',
          name: 'same',
          message: `Use the same database as the WebUI? (${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME})`,
          default: false
        }])
        return same
      })()

      if (sameAsWebui) {
        serverDefaults = { host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME }
      }

      serverConn = await askDb(false, serverDefaults)

      const { serverName } = await inquirer.prompt([{ name: 'serverName', message: 'Server Name', default: server ? server.name : 'Server 1' }])
      const { host, port, user, password, database } = serverConn.client.config.connection

      server = { ...server, host, port, user, password, database, name: serverName }
    }

    const checkTable = async (conn, table) => conn.schema.hasTable(table)
    const promptTable = async (conn, [key, value]) => {
      const { tableName } = await inquirer.prompt([{ name: 'tableName', message: `${key} table name`, default: value }])
      const exists = await checkTable(conn, tableName)

      if (!exists) {
        this.log(`Failed to find ${tableName} table in database, please try again`)

        return promptTable(conn, [key, value])
      }

      return tableName
    }

    if (server.tables) {
      let tables

      try {
        tables = JSON.parse(server.tables)

        tables = merge({}, defaultTables, tables)
      } catch (e) {
        tables = defaultTables
      }

      this.log(`Verifying ${server.name} tables`)

      for (const [key, value] of Object.entries(tables)) {
        if (await checkTable(serverConn, value)) continue

        tables[key] = await promptTable(serverConn, [key, value])
      }

      server.tables = tables
    } else if (bmConfig && bmConfig.tables) {
      this.log(`Using table names detected from config.yml for ${server.name}`)

      server.tables = { ...bmConfig.tables }

      for (const [key, value] of Object.entries(server.tables)) {
        if (await checkTable(serverConn, value)) continue

        this.log(chalk.yellow(`Detected table "${value}" for ${key} not found in database`))
        server.tables[key] = await promptTable(serverConn, [key, value])
      }
    } else {
      this.log('Please enter table names from config.yml')

      server.tables = {}

      for (const [key, value] of Object.entries(defaultTables)) {
        server.tables[key] = await promptTable(serverConn, [key, value])
      }
    }

    const playerExists = async (conn, table, id) => conn(table).select('name').where('id', id).first()
    const askPlayer = async (question, conn, table, defaultId) => {
      const questions = [{ name: 'id', message: question, default: defaultId }]
      const { id } = await inquirer.prompt(questions)

      if (!isUUID(id)) {
        this.log(`Invalid UUID format ${id}`)
        return askPlayer(question, conn, table)
      }

      const parsedId = parse(id, Buffer.alloc(16))
      const player = await playerExists(conn, table, parsedId)

      if (!player) {
        this.log(`Could not find Player ${id}, ensure the player has joined the Minecraft server after installing BanManager`)
        return askPlayer(question, conn, table)
      }

      this.log(`Found player ${player.name}`)

      return parsedId
    }
    const consoleDefault = bmConfig && bmConfig.consoleUuid ? bmConfig.consoleUuid : undefined

    if (server.console) {
      if (!(await playerExists(serverConn, server.tables.players, server.console))) {
        this.log('Console player not found, please update')
        server.console = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, server.tables.players, consoleDefault)
      }
    } else {
      server.console = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, server.tables.players, consoleDefault)
    }

    this.log(`Saving server ${server.name}`)

    if (server.password) {
      server.password = await crypto.encrypt(ENCRYPTION_KEY, server.password)
    } else {
      server.password = ''
    }

    if (server.id) {
      await conn('bm_web_servers').update({ ...server, tables: JSON.stringify(server.tables) }).where({ id: server.id })
    } else {
      server.id = (await generateServerId()).toString('hex')

      await conn('bm_web_servers').insert({ ...server, tables: JSON.stringify(server.tables) })
    }

    const roleResults = await conn('bm_web_player_roles').select('player_id').where('role_id', 3).limit(1)

    if (roleResults.length) {
      this.log('Admin user detected, skipping')
      this.log(`To create an additional account later, run ${chalk.yellow('npx bmwebui account create')}`)
    } else {
      this.log('Setup your admin user')

      const askPassword = async () => {
        const { password, vPass } = await inquirer.prompt(
          [{ type: 'password', name: 'password', message: 'Your Password' },
            { type: 'password', name: 'vPass', message: 'Confirm Password' }
          ])

        if (!isLength(password, { min: 6, max: 255 })) {
          this.log('Invalid password, minimum length 6 characters')
          return askPassword()
        }

        if (!(password && vPass) || password !== vPass) {
          this.log('Passwords do not match')
          return askPassword()
        }

        return hash(password)
      }
      const askPlayerAccount = async (question, conn, serverConn, table) => {
        const id = await askPlayer(question, serverConn, table)

        const [{ exists }] = await conn('bm_web_users').select(conn.raw('COUNT(*) AS `exists`')).where('player_id', id)

        if (exists) {
          this.log('An account already exists for that player')
          return askPlayerAccount(question, conn, serverConn, table)
        }

        return id
      }

      const { email } = await inquirer.prompt([{ name: 'email', message: 'Your email address' }])
      const hashedPassword = await askPassword()
      const playerId = await askPlayerAccount('Your Minecraft Player UUID', conn, serverConn, server.tables.players)
      const playerUuid = unparse(playerId)

      // Use the shared, transactional helper so a failure between user-insert
      // and role-insert can never leave a half-created admin account.
      await setupLib.createAdminUser({
        email,
        password: hashedPassword,
        hashedPassword,
        playerUuid,
        dbPool: conn
      })
    }

    this.log('Cleaning up...')

    await conn.destroy()
    await serverConn.destroy()

    this.log('Setup complete, environment variables are:')

    if (flags.writeFile) {
      this.log(await save())
      this.log(`Written ${flags.writeFile} to disk`)
    } else {
      this.log(contents)
    }

    this.log('')
    this.log(chalk.green('Next steps:'))
    this.log('  - Verify your installation: ' + chalk.yellow('npx bmwebui doctor'))
    this.log('  - Start the WebUI as a systemd service: ' + chalk.yellow('npx bmwebui setup systemd'))
    this.log('  - Create additional accounts later: ' + chalk.yellow('npx bmwebui account create'))
    this.log('')
    this.log(chalk.dim('Tip: re-running `bmwebui setup` is safe — it skips steps that are already done.'))
  }
}

SetupCommand.description = 'Setup the WebUI'
SetupCommand.flags = {
  writeFile: Flags.string()
}

module.exports = SetupCommand
