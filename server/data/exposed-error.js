module.exports = function ExposedError (message, code, meta) {
  Error.captureStackTrace(this, this.constructor)

  this.name = this.constructor.name
  this.message = message
  this.code = code || 'UNKNOWN'
  this.meta = meta || null
  this.exposed = true
  this.extensions = {
    code: 'ERR_EXPOSED',
    appCode: this.code,
    ...(this.meta ? { meta: this.meta } : {})
  }
}

require('util').inherits(module.exports, Error)
