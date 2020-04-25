const fs = require('fs').promises
const path = require('path')

exports.up = async function (db) {
  const filePath = path.join(__dirname, 'sqls', '20180208130239-bm-tables-up.sql')
  const data = await fs.readFile(filePath, { encoding: 'utf-8' })

  return db.runSql(data)
}

exports.down = async function (db) {
  const filePath = path.join(__dirname, 'sqls', '20180208130239-bm-tables-down.sql')
  const data = await fs.readFile(filePath, { encoding: 'utf-8' })

  return db.runSql(data)
}

exports._meta = {
  version: 1
}
