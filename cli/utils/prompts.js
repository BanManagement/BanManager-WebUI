const { isEmail, isLength, isUUID } = require('validator')
const inquirer = require('inquirer')
const { parse } = require('uuid-parse')
const createPlayerLoader = require('../../server/graphql/loaders/player-loader')
const { hash } = require('../../server/data/hash')

const askPlayer = async (question, serversPool, logger) => {
  const questions = [{ name: 'id', message: question }]
  const { id } = await inquirer.prompt(questions)

  if (!isUUID(id)) {
    logger.log(`Invalid UUID format ${id}`)
    return askPlayer(question, serversPool, logger)
  }

  const parsedId = parse(id, Buffer.alloc(16))
  const player = await createPlayerLoader(serversPool).load({ id: parsedId, fields: ['id', 'name'] })

  if (!player) {
    logger.log(`Could not find Player ${id}, ensure the player has joined the Minecraft server after installing BanManager`)
    return askPlayer(question, serversPool, logger)
  }

  logger.log(`Found player ${player.name}`)

  return parsedId
}

const askEmailAddress = async (dbPool, logger) => {
  const { emailAddress } = await inquirer.prompt([
    {
      type: 'input',
      name: 'emailAddress',
      message: 'Enter email address:'
    }
  ])

  console.log(emailAddress)

  if (!isEmail(emailAddress)) {
    logger.log('Invalid email address')
    return askEmailAddress(dbPool, logger)
  }

  const player = await dbPool('bm_web_users')
    .select('email')
    .where('email', emailAddress)
    .first()

  if (player && player.email) {
    logger.log('A user with this email address already exists')
    return askEmailAddress(dbPool, logger)
  }

  return emailAddress
}

const askPassword = async (logger) => {
  const { password, vPass } = await inquirer.prompt(
    [{ type: 'password', name: 'password', message: 'Your Password' },
      { type: 'password', name: 'vPass', message: 'Confirm Password' }
    ])

  if (!isLength(password, { min: 6, max: 255 })) {
    logger.log('Invalid password, minimum length 6 characters')
    return askPassword(logger)
  }

  if (!(password && vPass) || password !== vPass) {
    logger.log('Passwords do not match')
    return askPassword(logger)
  }

  return hash(password)
}

module.exports = {
  askPlayer,
  askEmailAddress,
  askPassword
}
