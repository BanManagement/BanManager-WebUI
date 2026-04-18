const { parse } = require('uuid-parse')
const { isEmail, isLength, isUUID } = require('validator')
const { hash } = require('../data/hash')

const ADMIN_ROLE_ID = 3

const validateAdminInput = ({ email, password, playerUuid }) => {
  const errors = []

  if (!email || !isEmail(email)) errors.push({ field: 'email', message: 'A valid email address is required' })
  if (!password || !isLength(password, { min: 6, max: 255 })) {
    errors.push({ field: 'password', message: 'Password must be between 6 and 255 characters' })
  }
  if (!playerUuid || !isUUID(playerUuid)) errors.push({ field: 'playerUuid', message: 'A valid Minecraft player UUID is required' })

  return errors
}

const createAdminUser = async ({ email, password, playerUuid, dbPool, hashedPassword }) => {
  const errors = validateAdminInput({ email, password: hashedPassword || password, playerUuid })

  if (errors.length) {
    const err = new Error(`Invalid admin input: ${errors.map((e) => e.message).join('; ')}`)
    err.code = 'CREATE_ADMIN_VALIDATION'
    err.errors = errors
    throw err
  }

  const playerId = parse(playerUuid, Buffer.alloc(16))

  const existingByEmail = await dbPool('bm_web_users').select('player_id').where('email', email).first()
  if (existingByEmail) {
    const err = new Error('An account with this email address already exists')
    err.code = 'CREATE_ADMIN_EMAIL_TAKEN'
    throw err
  }

  const existingByPlayer = await dbPool('bm_web_users').select('player_id').where('player_id', playerId).first()
  if (existingByPlayer) {
    const err = new Error('An account already exists for this player')
    err.code = 'CREATE_ADMIN_PLAYER_TAKEN'
    throw err
  }

  const passwordHash = hashedPassword || (await hash(password))

  await dbPool.transaction(async (trx) => {
    await trx('bm_web_users').insert({
      email,
      password: passwordHash,
      player_id: playerId,
      updated: Math.floor(Date.now() / 1000)
    })
    await trx('bm_web_player_roles').insert({ player_id: playerId, role_id: ADMIN_ROLE_ID })
  })

  return { email, playerId }
}

module.exports = {
  ADMIN_ROLE_ID,
  validateAdminInput,
  createAdminUser
}
