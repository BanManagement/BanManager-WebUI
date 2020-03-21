const { createKey } = require('./crypto')
const argon2 = require('argon2-ffi').argon2i

module.exports = {
  async hash (str) {
    return argon2.hash(str, await createKey(32))
  },
  async verify (hash, str) {
    return argon2.verify(hash, str)
  }
}
