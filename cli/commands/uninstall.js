const { Command } = require('@oclif/command')
const inquirer = require('inquirer')
const DBMigrate = require('db-migrate')

class UninstallCommand extends Command {
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

    const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: 'Confirm? Cannot be undone' }])

    if (confirm) {
      await dbm.reset()

      this.log('Database rolled back successfully')
    }
  }
}

UninstallCommand.description = 'Uninstall database schema'

module.exports = UninstallCommand
