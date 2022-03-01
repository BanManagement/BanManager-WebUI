const assert = require('assert')
const { inetTop, inetPton } = require('../data/ip')

describe('ip', () => {
  describe('#inetTop', () => {
    test('converts buffer to string', () => {
      assert.strictEqual(inetTop(Buffer.from([0x7F, 0x00, 0x00, 0x01])), '127.0.0.1')
      assert.strictEqual(inetTop('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0'), '::')
      assert.strictEqual(inetTop(Buffer.from([0x4f, 0xf1, 0x8d, 0x31])), '79.241.141.49')
    })
  })

  describe('#inetPton', () => {
    test('converts string to buffer', () => {
      assert(inetPton('127.0.0.1').equals(Buffer.from([0x7F, 0x00, 0x00, 0x01])))
      assert(inetPton('::').equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])))
      assert(inetPton('79.241.141.49').equals(Buffer.from([0x4f, 0xf1, 0x8d, 0x31])))
    })
  })
})
