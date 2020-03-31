// (U)pdates, (D)eletes and (I)nserts
// Reads should be done seperately via loaders or native SELECT queries

// @TODO Replace with knex or a lighter query builder
module.exports =
{
  update,
  delete: deleteData,
  insert
}

async function deleteData (pool, table, where) {
  let query = `DELETE FROM \`${table}\` WHERE `
  const values = Object.values(where)

  Object.keys(where).forEach(col => {
    query += `\`${col}\` = ? AND ` // @TODO Escape column names
  })

  query = query.slice(0, -5)

  return pool.execute(query, values)
}

async function insert (pool, table, entity) {
  if (Array.isArray(entity)) {
    const isTransaction = !pool.getConnection
    const conn = isTransaction ? pool : await pool.getConnection()

    try {
      if (!isTransaction) await conn.beginTransaction()

      for (const item of entity) {
        await insert(conn, table, item)
      }

      if (!isTransaction) await conn.commit()
    } catch (e) {
      if (isTransaction && !conn.connection._fatalError) {
        await conn.rollback()
      }

      throw e
    } finally {
      if (!isTransaction) conn.release()
    }

    return
  }

  const columns = Object.keys(entity).map(key => `\`${key}\``)
  const values = Object.values(entity)
  const query = `INSERT INTO \`${table}\`
    (${columns.join()})
    VALUES (${buildParams(values)})` // @TODO Escape column names

  return pool.execute(query, values)
}

async function update (pool, table, entity, where) {
  let values = []
  let query = `UPDATE \`${table}\` SET `

  Object.keys(entity).forEach(column => {
    query += `\`${column}\` = `

    if (entity[column] === 'UNIX_TIMESTAMP()') {
      query += 'UNIX_TIMESTAMP(),'
    } else {
      values.push(entity[column])
      query += '?,'
    }
  })

  query = query.slice(0, -1)

  if (where) {
    query += ' WHERE '

    Object.keys(where).forEach(col => {
      query += `\`${col}\` = ? ` // @TODO Escape column names
    })

    values = [...values, ...Object.values(where)]
  }

  return pool.execute(query, values)
}

function buildParams (columns) {
  return columns.map(() => '?').join(', ')
}
