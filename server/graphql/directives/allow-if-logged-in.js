const { defaultFieldResolver } = require('graphql')
const { getDirective, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { valid } = require('../../data/session')
const ExposedError = require('../../data/exposed-error')

function allowIfLoggedInDirective () {
  return schema => mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directiveArgumentMap = getDirective(schema, fieldConfig, 'allowIfLoggedIn')?.[0]

      if (directiveArgumentMap) {
        const { resolve = defaultFieldResolver } = fieldConfig

        fieldConfig.resolve = async function (...args) {
          const { session } = args[2]

          if (!valid(session)) {
            throw new ExposedError(
              'You do not have permission to perform this action, please contact your server administrator')
          }

          return resolve.apply(this, args)
        }

        return fieldConfig
      }
    }
  })
}

const allowIfLoggedInDirectiveTypeDefs = `
  directive @allowIfLoggedIn on FIELD_DEFINITION
`

module.exports = { allowIfLoggedInDirective, allowIfLoggedInDirectiveTypeDefs }
