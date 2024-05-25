module.exports = function ExposedError (message, code) {
  Error.captureStackTrace(this, this.constructor)

  this.name = this.constructor.name
  this.message = message
  this.code = code
  this.exposed = true
  this.extensions = {
    code: 'ERR_EXPOSED'
  }
}

require('util').inherits(module.exports, Error)
