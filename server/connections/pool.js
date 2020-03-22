const mysql = require('mysql2/promise')

module.exports = (config) => {
  return mysql.createPool(config)
}
