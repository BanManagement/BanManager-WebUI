const { Command } = require('@oclif/command')
const DBMigrate = require('db-migrate')

class UndoCommand extends Command {
  async run () {
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

    await dbm.down(1)

    this.log('Database updated successfully')
  }
}

UndoCommand.description = 'Undo database schema'

module.exports = UndoCommand
