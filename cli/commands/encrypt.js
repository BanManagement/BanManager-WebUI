const { Command } = require('@oclif/command')
const inquirer = require('inquirer')
const crypto = require('../../server/data/crypto')

class EncryptCommand extends Command {
  async run () {
    const { value } = await inquirer.prompt([{ type: 'password', name: 'value', message: 'Value to encrypt' }])
    const encValue = await crypto.encrypt(process.env.ENCRYPTION_KEY, value)

    this.log(`Encrypted value: ${encValue}`)
  }
}

EncryptCommand.description = 'Encrypt a value'

module.exports = EncryptCommand
