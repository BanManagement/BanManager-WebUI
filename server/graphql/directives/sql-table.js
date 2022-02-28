const { GraphQLScalarType, GraphQLObjectType, GraphQLList } = require('graphql')
const { getDirective, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { stripNonNullType } = require('../utils')
const { find } = require('lodash')

const getPossibleValues = (objectType) => {
  const possibleValues = new Set()
  const fieldType = stripNonNullType(objectType)

  if (!(fieldType instanceof GraphQLObjectType)) return possibleValues

  for (const [fieldName, field] of Object.entries(stripNonNullType(objectType).getFields())) {
    const fieldType = stripNonNullType(field.type)

    if (fieldType instanceof GraphQLScalarType) {
      possibleValues.add(fieldName)
    }
  }

  return possibleValues
}

const getArgs = (directive) => directive.arguments.reduce((acc, curr) => {
  acc[curr.name.value] = curr.value.value

  return acc
}, {})

function sqlTableDirective () {
  function wrapType (objectType, args) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType.extensions.sqlMeta) return

    const { name: tableKey } = args
    const fields = objectType.getFields()
    const possibleValues = getPossibleValues(objectType)
    const joins = {}

    for (const field of Object.values(fields)) {
      if (!field.astNode.directives.length) continue

      const relationDirective = find(field.astNode.directives, { name: { value: 'sqlRelation' } })

      if (!relationDirective) continue

      const args = getArgs(relationDirective)

      const fieldType = stripNonNullType(field.type)

      if (fieldType instanceof GraphQLObjectType) {
        possibleValues.add(args.field)

        joins[field.name] = {
          tableKey: args.table,
          fieldType,
          type: args.joinType || 'join',
          args: [`\${table} AS ${field.name}`, `\${parentTable}.${args.field}`, `${field.name}.${args.joinOn}`],
          possibleValues: getPossibleValues(field.type)
        }
      } else if (fieldType instanceof GraphQLList) {
        const listField = stripNonNullType(fieldType.ofType)
        const sqlTableDirective = find(listField.astNode.directives, { name: { value: 'sqlTable' } })

        if (!sqlTableDirective) continue

        if (!args.whereKey) throw Error(`Missing whereKey for ${field.name}`)

        wrapType(listField, getArgs(sqlTableDirective))

        joins[field.name] = {
          field: args.field,
          tableKey: args.table,
          whereKey: args.whereKey,
          fieldType,
          type: 'query',
          possibleValues: getPossibleValues(listField)
        }
      }
    }

    objectType.extensions.sqlMeta = { possibleValues, tableKey, joins }
  }

  return schema => mapSchema(schema, {
    [MapperKind.OBJECT_TYPE]: (fieldConfig) => {
      const directiveArgumentMap = getDirective(schema, fieldConfig, 'sqlTable')?.[0]

      if (directiveArgumentMap) {
        wrapType(fieldConfig, directiveArgumentMap)

        return fieldConfig
      }
    }
  })
}

const sqlTableDirectiveTypeDefs = `
  directive @sqlTable(name: String!) on OBJECT
`

module.exports = { sqlTableDirective, sqlTableDirectiveTypeDefs }

// module.exports = class SQLTable extends SchemaDirectiveVisitor {
//   visitObject (type) {
//     this.ensureFieldsWrapped(type)
//   }

//   ensureFieldsWrapped (objectType) {
//     // Mark the GraphQLObjectType object to avoid re-wrapping:
//     if (objectType.sqlMeta) return

//     const { name: tableKey } = this.args
//     const fields = objectType.getFields()
//     const possibleValues = getPossibleValues(objectType)
//     const joins = {}

//     for (const field of Object.values(fields)) {
//       if (!field.astNode.directives.length) continue

//       const relationDirective = find(field.astNode.directives, { name: { value: 'sqlRelation' } })

//       if (!relationDirective) continue

//       const args = getArgs(relationDirective)

//       const fieldType = stripNonNullType(field.type)

//       if (fieldType instanceof GraphQLObjectType) {
//         possibleValues.add(args.field)

//         joins[field.name] = {
//           tableKey: args.table,
//           fieldType,
//           type: args.joinType || 'join',
//           args: [`\${table} AS ${field.name}`, `\${parentTable}.${args.field}`, `${field.name}.${args.joinOn}`],
//           possibleValues: getPossibleValues(field.type)
//         }
//       } else if (fieldType instanceof GraphQLList) {
//         const listField = stripNonNullType(fieldType.ofType)
//         const sqlTableDirective = find(listField.astNode.directives, { name: { value: 'sqlTable' } })

//         if (!sqlTableDirective) continue

//         if (!args.whereKey) throw Error(`Missing whereKey for ${field.name}`)

//         this.ensureFieldsWrapped.call({ args: getArgs(sqlTableDirective) }, listField)

//         joins[field.name] = {
//           field: args.field,
//           tableKey: args.table,
//           whereKey: args.whereKey,
//           fieldType,
//           type: 'query',
//           possibleValues: getPossibleValues(listField)
//         }
//       }
//     }

//     objectType.sqlMeta = { possibleValues, tableKey, joins }
//   }
// }
