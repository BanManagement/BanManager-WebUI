const tables = Object.keys(require('../../../data/tables').tables)

module.exports = function serverTables () {
  return tables
}
