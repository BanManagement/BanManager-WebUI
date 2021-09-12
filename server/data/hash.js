const argon2 = require('argon2')

module.exports = {
  async hash (str) {
    return argon2.hash(str)
  },
  async verify (hash, str) {
    return argon2.verify(hash, str)
  }
}
