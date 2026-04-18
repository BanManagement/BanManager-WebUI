const chalk = require('chalk')
const { Command } = require('@oclif/core')
const { runMigrations } = require('../../server/setup/migrations')

class UpdateCommand extends Command {
  async run () {
    this.log('Updating database schema...')

    await runMigrations({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    this.log(chalk.green('Done'))
  }
}

UpdateCommand.description = 'Update database schema'

module.exports = UpdateCommand
