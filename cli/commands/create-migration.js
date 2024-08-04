const { Command } = require('@oclif/core')
const DBMigrate = require('db-migrate')

class CreateMigrationCommand extends Command {
  async run () {
    const { argv } = await this.parse(CreateMigrationCommand)
    const dbConfig = {
      connectionLimit: 1,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      driver: { require: '@confuser/db-migrate-mysql' }
    }

    const dbm = DBMigrate.getInstance(true, {
      config: { dev: dbConfig },
      cmdOptions: {
        'migrations-dir': './server/data/migrations'
      }
    })

    await dbm.create(argv[0])

    this.log('Database migration schema created')
  }
}

CreateMigrationCommand.strict = false
CreateMigrationCommand.description = 'Development only command to create a database schema changeset'

module.exports = CreateMigrationCommand
