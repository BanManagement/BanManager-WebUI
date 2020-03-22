const assert = require('assert')
const crypto = require('../data/crypto')

describe('Crypto', () => {
  test('should decrypt an encrypted value', async () => {
    const text = 'hello "world`\'# this will be an encrypted value'
    const key = await crypto.createKey()
    const encryptedText = await crypto.encrypt(key, text)
    const decryptedText = await crypto.decrypt(key, encryptedText)

    assert.strictEqual(decryptedText, text)

    // Encrypt again and compare to test duplicate encryption values are not returned
    const encryptedTextSecond = await crypto.encrypt(key, text)
    const decryptedTextSecond = await crypto.decrypt(key, encryptedTextSecond)

    assert.notStrictEqual(encryptedText, encryptedTextSecond)
    assert.strictEqual(decryptedTextSecond, text)
  })
})
