// Based on http://vancelucas.com/blog/stronger-encryption-and-decryption-in-node-js/
const crypto = require('crypto')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const ivLength = 16
const keyLength = 32
const algorithm = 'aes-256-cbc'

// Creates 32 byte key (for AES-256), buffer
const createKey = async (length) => randomBytes(length || keyLength)

// Creates 16 byte iv, buffer
const createIv = async (length) => randomBytes(length || ivLength)

// Encrypts given text string, using AES-256-CBC. Returns encrypted message as hex string.
const encrypt = async (key, text) => {
  if (!Buffer.isBuffer(key)) key = Buffer.from(key, 'hex')

  const iv = await createIv()
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = cipher.update(text)

  return Buffer.concat([encrypted, cipher.final(), iv]).toString('hex')
}

// Decrypts given text string. Presumes encryptedText to be hex string.
const decrypt = async (key, text) => {
  if (!Buffer.isBuffer(key)) key = Buffer.from(key, 'hex')

  const buffText = Buffer.from(text, 'hex')

  const encryptedLength = buffText.length - ivLength
  const iv = buffText.slice(encryptedLength)
  const encryptedText = buffText.slice(0, encryptedLength)

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  const decrypted = decipher.update(Buffer.from(encryptedText, 'hex'))

  return Buffer.concat([decrypted, decipher.final()]).toString()
}

module.exports = { createKey, createIv, decrypt, encrypt }
