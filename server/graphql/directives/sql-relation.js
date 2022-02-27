const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')

function sqlRelationDirective () {
  return schema => mapSchema(schema, {
    [MapperKind.OBJECT_TYPE]: (fieldConfig) => {
      const directiveArgumentMap = getDirectives(schema, fieldConfig)
      const hasTable = directiveArgumentMap.some(directive => directive.name === 'sqlTable')

      for (const field of fieldConfig.astNode.fields) {
        const hasDirective = field.directives.some(directive => directive.name === 'sqlRelation')

        if (hasDirective && !hasTable) {
          throw Error(`Invalid @sqlRelation placement, ${field.name} must be @sqlTable`)
        }
      }
    }
  })
}

const sqlRelationDirectiveTypeDefs = `
  directive @sqlRelation(field: String!, table: String!, joinType: String, joinOn: String, whereKey: String) on FIELD_DEFINITION
`

module.exports = { sqlRelationDirective, sqlRelationDirectiveTypeDefs }
