const { SchemaDirectiveVisitor } = require('graphql-tools')

module.exports = class SQLRelationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field, details) {
    if (!details.objectType.sqlMeta) throw Error(`Invalid @sqlRelation placement, ${details.objectType} must be @sqlTable`)
  }
}
