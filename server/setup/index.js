const keys = require('./keys')
const db = require('./db')
const migrations = require('./migrations')
const tables = require('./tables')
const parseConfig = require('./parse-config')
const admin = require('./admin')
const state = require('./state')
const envValidator = require('./env-validator')

module.exports = {
  ...keys,
  ...db,
  ...migrations,
  ...tables,
  ...parseConfig,
  ...admin,
  ...state,
  ...envValidator
}
