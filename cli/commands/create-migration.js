const { Command } = require('@oclif/command')
const DBMigrate = require('db-migrate')

class CreateMigrationCommand extends Command {
  async run () {
    const { args } = this.parse(CreateMigrationCommand)
    const dbConfig = {
      connectionLimit: 1,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      driver: 'mysql'
    }

    const dbm = DBMigrate.getInstance(true, {
      config: { dev: dbConfig },
      cmdOptions: {
        'migrations-dir': './server/data/migrations'
      }
    })

    await dbm.create(args.name)

    this.log('Database migration schema created')
  }
}

CreateMigrationCommand.args = [
  { name: 'name', description: 'Schema migration name', required: true }
]
CreateMigrationCommand.description = 'Development only command to create a database schema changeset'

module.exports = CreateMigrationCommand
