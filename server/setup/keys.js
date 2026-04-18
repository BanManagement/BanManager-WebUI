const crypto = require('../data/crypto')
const { generateVAPIDKeys } = require('web-push')

const HEX_KEY_LENGTH = 64 // 32 bytes hex-encoded
const HEX_REGEX = /^[a-f0-9]+$/i

const isValidHexKey = (value) => {
  if (typeof value !== 'string') return false

  return value.length === HEX_KEY_LENGTH && HEX_REGEX.test(value)
}

const generateEncryptionKey = async () => (await crypto.createKey()).toString('hex')

const generateSessionKey = async () => (await crypto.createKey()).toString('hex')

const generateVapidKeyPair = () => {
  const { publicKey, privateKey } = generateVAPIDKeys()

  return { publicKey, privateKey }
}

const generateKeys = async ({ existing = {} } = {}) => {
  const result = {
    encryptionKey: existing.encryptionKey || (await generateEncryptionKey()),
    sessionKey: existing.sessionKey || (await generateSessionKey()),
    vapidPublicKey: existing.vapidPublicKey,
    vapidPrivateKey: existing.vapidPrivateKey
  }

  if (!result.vapidPublicKey || !result.vapidPrivateKey) {
    const vapid = generateVapidKeyPair()
    result.vapidPublicKey = vapid.publicKey
    result.vapidPrivateKey = vapid.privateKey
  }

  return result
}

module.exports = {
  HEX_KEY_LENGTH,
  isValidHexKey,
  generateEncryptionKey,
  generateSessionKey,
  generateVapidKeyPair,
  generateKeys
}
