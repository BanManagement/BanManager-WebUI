const { GraphQLList, GraphQLObjectType } = require('graphql')
const fillTemplate = require('es6-dynamic-template')
const { filter, find, isEmpty, isNil, isPlainObject, omitBy } = require('lodash')

function stripNonNullType (type) {
  return type.constructor.name === 'GraphQLNonNull' ? type.ofType : type
}

function handleEmptyResults (joins) {
  for (const [key, value] of Object.entries(joins)) {
    if (isPlainObject(value)) {
      const newValue = omitBy(value, isNil)

      joins[key] = isEmpty(newValue) ? undefined : newValue
    } else {
      joins[key] = value
    }
  }

  return joins
}

function getCol (field) {
  const sqlCol = find(field.astNode.directives, { name: { value: 'sqlColumn' } })

  if (sqlCol) {
    const args = sqlCol.arguments.reduce((acc, curr) => {
      acc[curr.name.value] = curr.value.value

      return acc
    }, {})

    return args.name
  }
}

function getSql (schema, server, fields, tableKey, nested) {
  const tables = server.config.tables
  const queries = { core: server.pool(tables[tableKey]).options({ nestTables: true }), additional: [] }

  for (const [nodeType, nodeField] of Object.entries(fields.fieldsByTypeName)) {
    const fieldInfo = schema.getType(nodeType)

    if (!fieldInfo.sqlMeta) continue

    const sql = fieldInfo.sqlMeta
    const tableName = tables[sql.tableKey]

    for (const [fieldName, field] of Object.entries(nodeField)) {
      if (sql.possibleValues.has(fieldName)) {
        const sqlCol = getCol(fieldInfo.getFields()[fieldName]) || fieldName

        if (sqlCol !== fieldName) {
          queries.core.select(`${tableName}.${sqlCol} AS ${fieldName}`)
        } else {
          queries.core.select(`${tableName}.${sqlCol}`)
        }

        queries.core.select(`${tableName}.${sqlCol}`)
      } else if (sql.joins[fieldName]) {
        const join = sql.joins[fieldName]

        if (join.fieldType instanceof GraphQLObjectType) {
          const joinArgs = join.args.slice().map(args => fillTemplate(args, { table: tables[join.tableKey], parentTable: tableName }))

          queries.core[join.type].apply(queries.core, joinArgs)

          for (const key of Object.keys(nodeField[fieldName].fieldsByTypeName[join.fieldType])) {
            const sqlCol = getCol(join.fieldType.getFields()[key]) || key

            if (sqlCol !== key) {
              queries.core.select(`${fieldName}.${sqlCol} AS ${key}`)
            } else {
              queries.core.select(`${fieldName}.${sqlCol}`)
            }
          }
        } else if (join.fieldType instanceof GraphQLList && join.type === 'query') {
          const listField = stripNonNullType(join.fieldType.ofType)

          if (!listField.sqlMeta) continue

          const query = getSql(schema, server, field, listField.sqlMeta.tableKey, true)

          if (join.whereKey) {
            queries.core.select(`${tableName}.${join.field}`)

            queries.core.on('query-response', function (response, obj, builder) {
              const ids = response.map(row => row[join.field] || row[tableName][join.field])
              const col = `${tables[join.tableKey]}.${join.whereKey}`

              query.core.select(col).whereIn(col, ids)
            })
          }

          queries.additional.push({ fieldName, query, join, sqlMeta: listField.sqlMeta })
        }
      }
    }
  }

  queries.core.exec = async () => {
    const unmappedResults = await queries.core
    // Format results
    const results = unmappedResults.map(result => {
      const { [tables[tableKey]]: record, ...joins } = result

      return omitBy({ ...record, ...handleEmptyResults(joins) }, isNil)
    })

    if (queries.additional.length) {
      await Promise.all(queries.additional.map(async ({ fieldName, query, join, sqlMeta }) => {
        const additionalResults = await query.core.exec()

        for (const result of results) {
          const rows = filter(additionalResults, { [join.whereKey]: result[join.field] })

          if (!rows) {
            result[fieldName] = []
            continue
          }

          if (!Array.isArray(result[fieldName])) {
            result[fieldName] = []
          }

          for (const row of rows) {
            const { [tables[join.tableKey]]: record, ...joins } = row

            result[fieldName].push(omitBy({ ...record, ...handleEmptyResults(joins) }, isNil))
          }
        }
      }))
    }

    return results
  }

  return nested ? queries : queries.core
}

module.exports = { getSql, stripNonNullType }
