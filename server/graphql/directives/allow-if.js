const { defaultFieldResolver } = require('graphql')
const { getDirective, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { isNullableType } = require('graphql/type')
const { get } = require('lodash')
const ExposedError = require('../../data/exposed-error')

function allowIfDirective () {
  return schema => mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directiveArgumentMap = getDirective(schema, fieldConfig, 'allowIf')?.[0]

      if (directiveArgumentMap) {
        const { resolve = defaultFieldResolver } = fieldConfig

        fieldConfig.resolve = async function (...args) {
          const { resource, permission, serverVar, serverSrc } = directiveArgumentMap

          if (!resource) {
            return resolve.apply(this, args)
          }

          const src = args[0]
          const { state: { acl } } = args[2]
          const info = args[3]

          const serverId = get(info.variableValues, serverVar) || get(src, serverSrc)
          let allowed

          if (serverId && acl.hasServerPermission(serverId, resource, permission)) {
            allowed = true
          } else {
            allowed = acl.hasPermission(resource, permission)
          }

          if (!allowed) {
            if (
              info.parentType.toString() === 'Query' || // Cover non-fields
              info.operation.operation === 'mutation' ||
              !isNullableType(info.returnType) // Cover non-nullable fields
            ) {
              throw new ExposedError(
                'You do not have permission to perform this action, please contact your server administrator')
            }

            // @TODO Test more
            return null
          }

          return resolve.apply(this, args)
        }

        return fieldConfig
      }
    }
  })
}

const allowIfDirectiveTypeDefs = `
  directive @allowIf(resource: String!, permission: String!, serverVar: String, serverSrc: String) on FIELD_DEFINITION
`

module.exports = { allowIfDirective, allowIfDirectiveTypeDefs }
