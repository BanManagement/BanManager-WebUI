const { Command } = require('@oclif/core')
const inquirer = require('inquirer')
const { createDbPools, teardownDbPools } = require('../../utils/db')
const { askPlayer, askPassword, askEmailAddress } = require('../../utils/prompts')

class CreateCommand extends Command {
  async run () {
    const { dbPool, serversPool } = await createDbPools(this)

    const askRole = async () => {
      const { role } = await inquirer.prompt([
        {
          type: 'list',
          name: 'role',
          message: 'Select a role:',
          choices: (await dbPool('bm_web_roles').select('name')).map(({ name }) => name)
        }
      ])

      return role
    }

    const emailAddress = await askEmailAddress(dbPool, this)
    const password = await askPassword(this)
    const getPlayer = async (dbPool, serversPool, logger) => {
      const playerId = await askPlayer('Minecraft Player UUID', serversPool, this)
      const exists = await dbPool('bm_web_users').select('player_id').where('player_id', playerId).first()

      if (exists) {
        logger.log('A user with this player already exists')
        return await getPlayer(dbPool, serversPool, logger)
      }

      return playerId
    }
    const playerId = await getPlayer(dbPool, serversPool, this)
    const role = await askRole()

    await dbPool.transaction(async trx => {
      await trx('bm_web_users').insert({
        email: emailAddress,
        password,
        player_id: playerId,
        updated: dbPool.raw('UNIX_TIMESTAMP()')
      })
      await trx('bm_web_player_roles').insert({
        player_id: playerId,
        role_id: (await dbPool('bm_web_roles').select('role_id').where('name', role).first()).role_id
      })
    })

    this.log(`Account ${emailAddress} created`)

    await teardownDbPools(dbPool, serversPool)
  }
}

CreateCommand.description = 'Create a user'

module.exports = CreateCommand
