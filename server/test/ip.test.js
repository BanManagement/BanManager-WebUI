const assert = require('assert')
const { inetTop, inetPton } = require('../data/ip')

describe('ip', () => {
  describe('#inetTop', () => {
    test('converts binary to string', () => {
      assert.strictEqual(inetTop('\x7F\x00\x00\x01'), '127.0.0.1')
      assert.strictEqual(inetTop('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0'), '::')

      assert.strictEqual(inetTop('asdasd'), null)
    })
  })

  describe('#inetPton', () => {
    test('converts string to binary', () => {
      assert.strictEqual(inetPton('127.0.0.1'), '\x7F\x00\x00\x01')
      assert.strictEqual(inetPton('::'), '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0')

      assert.strictEqual(inetPton('asdasd'), null)
    })
  })
})
