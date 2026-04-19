const assert = require('assert')
const {
  isValidHexKey,
  generateEncryptionKey,
  generateSessionKey,
  generateVapidKeyPair,
  generateKeys,
  HEX_KEY_LENGTH
} = require('../setup/keys')

describe('setup/keys', () => {
  test('isValidHexKey accepts a valid 64-char hex string', () => {
    const key = 'a'.repeat(HEX_KEY_LENGTH)

    assert.strictEqual(isValidHexKey(key), true)
  })

  test('isValidHexKey rejects empty strings, wrong-length strings and non-hex chars', () => {
    assert.strictEqual(isValidHexKey(''), false)
    assert.strictEqual(isValidHexKey('a'.repeat(HEX_KEY_LENGTH - 1)), false)
    assert.strictEqual(isValidHexKey('z'.repeat(HEX_KEY_LENGTH)), false)
    assert.strictEqual(isValidHexKey(null), false)
    assert.strictEqual(isValidHexKey(undefined), false)
    assert.strictEqual(isValidHexKey(12345), false)
  })

  test('generateEncryptionKey/generateSessionKey produce valid hex keys', async () => {
    const enc = await generateEncryptionKey()
    const sess = await generateSessionKey()

    assert.strictEqual(isValidHexKey(enc), true)
    assert.strictEqual(isValidHexKey(sess), true)
    assert.notStrictEqual(enc, sess)
  })

  test('generateVapidKeyPair returns non-empty publicKey and privateKey', () => {
    const { publicKey, privateKey } = generateVapidKeyPair()

    assert.ok(publicKey && publicKey.length > 0)
    assert.ok(privateKey && privateKey.length > 0)
    assert.notStrictEqual(publicKey, privateKey)
  })

  test('generateKeys preserves provided existing keys and fills missing ones', async () => {
    const existing = {
      encryptionKey: 'b'.repeat(HEX_KEY_LENGTH),
      sessionKey: 'c'.repeat(HEX_KEY_LENGTH)
    }

    const result = await generateKeys({ existing })

    assert.strictEqual(result.encryptionKey, existing.encryptionKey)
    assert.strictEqual(result.sessionKey, existing.sessionKey)
    assert.ok(result.vapidPublicKey)
    assert.ok(result.vapidPrivateKey)
  })

  test('generateKeys generates everything when nothing is provided', async () => {
    const result = await generateKeys()

    assert.strictEqual(isValidHexKey(result.encryptionKey), true)
    assert.strictEqual(isValidHexKey(result.sessionKey), true)
    assert.ok(result.vapidPublicKey)
    assert.ok(result.vapidPrivateKey)
  })
})
