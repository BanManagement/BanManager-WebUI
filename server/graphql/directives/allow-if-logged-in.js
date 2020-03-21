const { defaultFieldResolver } = require('graphql')
const { SchemaDirectiveVisitor } = require('graphql-tools')
const { valid } = require('../../data/session')
const ExposedError = require('../../data/exposed-error')

module.exports = class AllowIfLoggedInDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type)
  }

  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType)
  }

  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._allowIfLoggedInFieldsWrapped) return

    objectType._allowIfLoggedInFieldsWrapped = true

    const fields = objectType.getFields()

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = async function (...args) {
        const { session } = args[2]

        if (!valid(session)) {
          throw new ExposedError(
            'You do not have permission to perform this action, please contact your server administrator')
        }

        return resolve.apply(this, args)
      }
    })
  }
}


// module.exports = async function allowIfLoggedIn (next, src, args, { session }) {
//   if (!valid(session)) {
//     throw new ExposedError(
//       'You do not have permission to perform this action, please contact your server administrator')
//   }

//   return next()
// }
