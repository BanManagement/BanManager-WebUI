const fs = require('fs').promises
const inquirer = require('inquirer')
const editDotenv = require('edit-dotenv')
const DBMigrate = require('db-migrate')
const udify = require('../../server/data/udify')
const { Command, flags } = require('@oclif/command')
const { isEmail } = require('validator')
const { generateVAPIDKeys } = require('web-push')
const { createConnection } = require('mysql2/promise')
const { merge } = require('lodash')
const { parse } = require('uuid-parse')
const { generateServerId } = require('../../server/data/generator')
const { hash } = require('../../server/data/hash')
const crypto = require('../../server/data/crypto')
const defaultTables = require('../../server/data/tables').tables

class SetupCommand extends Command {
  async run () {
    const { flags } = this.parse(SetupCommand)
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
    // Env variables
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
      ENCRYPTION_KEY = (await crypto.createKey()).toString('hex')
      await save({ ENCRYPTION_KEY })
    }

    if (SESSION_KEY) {
      this.log('SESSION_KEY detected, skipping')
    } else {
      SESSION_KEY = (await crypto.createKey()).toString('hex')
      await save({ SESSION_KEY })
    }

    if (NOTIFICATION_VAPID_PUBLIC_KEY && NOTIFICATION_VAPID_PRIVATE_KEY) {
      this.log('NOTIFICATION keys detected, skipping')
    } else {
      const { publicKey, privateKey } = generateVAPIDKeys()
      NOTIFICATION_VAPID_PUBLIC_KEY = publicKey
      NOTIFICATION_VAPID_PRIVATE_KEY = privateKey

      await save({ NOTIFICATION_VAPID_PUBLIC_KEY, NOTIFICATION_VAPID_PRIVATE_KEY })
    }

    const connectToDb = async (config) => {
      try {
        return await createConnection(config)
      } catch (e) {
        console.error(e)
        return null
      }
    }
    const askDb = async (setEnv) => {
      // Check DB connection details to web setup tables
      const messagePrefix = !setEnv ? 'Server ' : ''
      const dbQuestions = [
        { type: 'input', name: 'host', message: `${messagePrefix}Database Host`, default: DB_HOST || '127.0.0.1' },
        { type: 'input', name: 'port', message: `${messagePrefix}Database Port`, default: DB_PORT || 3306 },
        { type: 'input', name: 'user', message: `${messagePrefix}Database User`, default: DB_USER },
        { type: 'password', name: 'password', message: `${messagePrefix}Database Password`, default: DB_PASSWORD },
        { type: 'input', name: 'database', message: `${messagePrefix}Database Name`, default: DB_NAME }
      ]
      const dbAnswers = await inquirer.prompt(dbQuestions)
      this.log('Attempting to connect to database')

      if (setEnv) {
        DB_HOST = dbAnswers.host
        DB_PORT = dbAnswers.port
        DB_USER = dbAnswers.user
        DB_PASSWORD = dbAnswers.password
        DB_NAME = dbAnswers.database
      }

      const conn = await connectToDb(dbAnswers)

      if (!conn) {
        this.log('Failed to connect to database, please re-enter details')
        return askDb(setEnv)
      }

      this.log(`Connected to ${dbAnswers.user}@${dbAnswers.host}:${dbAnswers.port}/${dbAnswers.database} successfully`)

      return conn
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

    const dbConfig = {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      driver: 'mysql',
      connectionLimit: 1,
      multipleStatements: true
    }
    const dbmOpts = { config: { dev: dbConfig }, cmdOptions: { 'migrations-dir': './server/data/migrations' } }
    const dbm = DBMigrate.getInstance(true, dbmOpts)

    await dbm.up()

    const [results] = await conn.execute('SELECT * FROM bm_web_servers LIMIT 1')
    let serverConn
    let server

    if (results.length) {
      server = results[0]
      this.log(`BanManager Server ${server.name} detected, skipping server setup, attempting to connect`)

      try {
        serverConn = await createConnection({
          host: server.host,
          port: server.port,
          database: server.database,
          user: server.user,
          password: await crypto.decrypt(ENCRYPTION_KEY, server.password)
        })
      } catch (e) {
        this.log(`Connection to ${server.name} failed`)
      }
    }

    if (!serverConn) {
      this.log('Add a BanManager Server by specifying the databases.local connection details from your BanManager/config.yml file')

      serverConn = await askDb()

      const { serverName } = await inquirer.prompt([{ name: 'serverName', message: 'Server Name', default: server ? server.name : undefined }])
      const { host, port, user, password, database } = serverConn.config

      server = { host, port, user, password, database, name: serverName }
    }

    const checkTable = async (conn, table) => {
      const [[{ exists }]] = await conn.execute(
        'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
        , [conn.connection.config.database, table])

      return exists
    }
    const promptTable = async (conn, [key, value]) => {
      const { tableName } = await inquirer.prompt([{ name: 'tableName', message: `${key} table name`, default: value }])

      try {
        await checkTable(conn, tableName)
      } catch (e) {
        this.log(`Failed to find ${tableName} table in database, please try again`)

        return promptTable(conn, [key, value])
      }

      return tableName
    }

    if (server.tables) {
      let tables

      try {
        tables = JSON.parse(server.tables)

        // Merge in case there are new tables
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
    } else {
      this.log('Please enter table names from config.yml')

      server.tables = {}

      for (const [key, value] of Object.entries(defaultTables)) {
        server.tables[key] = await promptTable(serverConn, [key, value])
      }
    }

    const playerExists = async (conn, table, id) => {
      const [[result]] = await conn.query(
        'SELECT name FROM ?? WHERE id = ?'
        , [table, id])

      return result
    }
    const askPlayer = async (question, conn, table) => {
      const questions = [{ name: 'id', message: question }]
      const { id } = await inquirer.prompt(questions)
      const parsedId = parse(id, Buffer.alloc(16))
      const player = await playerExists(conn, table, parsedId)

      if (!player) {
        this.log(`Could not find Player ${id}`)
        return askPlayer(question, conn, table)
      }

      this.log(`Found player ${player.name}`)

      return parsedId
    }

    if (server.console) {
      if (!await playerExists(serverConn, server.tables.players, server.console)) {
        this.log('Console player not found, please update')
        server.console = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, server.tables.players)
      }
    } else {
      server.console = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, server.tables.players)
    }

    this.log(`Saving server ${server.name}`)

    if (server.id) {
      await udify.update(conn, 'bm_web_servers', { ...server, tables: JSON.stringify(server.tables) }, { id: server.id })
    } else {
      server.id = (await generateServerId()).toString('hex')

      if (server.password) {
        server.password = await crypto.encrypt(ENCRYPTION_KEY, server.password)
      } else {
        server.password = ''
      }

      await udify.insert(conn, 'bm_web_servers', server)
    }

    const [roleResults] = await conn.execute('SELECT player_id FROM bm_web_player_roles WHERE role_id = 3 LIMIT 1')

    if (roleResults.length) {
      this.log('Admin user detected, skipping')
    } else {
      this.log('Setup your admin user')

      const askPassword = async () => {
        const { password, vPass } = await inquirer.prompt(
          [{ type: 'password', name: 'password', message: 'Your Password' },
            { type: 'password', name: 'vPass', message: 'Confirm Password' }
          ])

        if (!(password && vPass) || password !== vPass) {
          this.log('Passwords do not match')
          return askPassword()
        }

        return hash(password)
      }
      const askPlayerAccount = async (question, conn, serverConn, table) => {
        const id = await askPlayer(question, serverConn, table)

        const [[{ exists }]] = await conn.execute(
          'SELECT COUNT(*) AS `exists` FROM bm_web_users WHERE player_id = ?'
          , [id])

        if (exists) {
          this.log('An account already exists for that player')
          return askPlayerAccount(question, conn, serverConn, table)
        }

        return id
      }

      const { email } = await inquirer.prompt([{ name: 'email', message: 'Your email address' }])
      const password = await askPassword()
      const playerId = await askPlayerAccount('Your Minecraft Player UUID', conn, serverConn, server.tables.players)
      const user = {
        email, password, player_id: playerId, updated: Math.floor(Date.now() / 1000)
      }

      await udify.insert(conn, 'bm_web_users', user)
      await udify.insert(conn, 'bm_web_player_roles', { player_id: playerId, role_id: 3 })
    }

    this.log('Cleaning up...')

    await conn.end()
    await serverConn.end()

    this.log('Setup complete, environment variables are:')

    if (flags.writeFile) {
      this.log(await save())
      this.log(`Written ${flags.writeFile} to disk`)
    } else {
      this.log(contents)
    }
  }
}

SetupCommand.description = 'Setup the WebUI'
SetupCommand.flags = {
  writeFile: flags.string()
}

module.exports = SetupCommand
