const { defaultFieldResolver } = require('graphql')
const { SchemaDirectiveVisitor } = require('graphql-tools')
const { isNullableType } = require('graphql/type')
const { get } = require('lodash')
const ExposedError = require('../../data/exposed-error')

module.exports = class AllowIfDirective extends SchemaDirectiveVisitor {
  visitObject (type) {
    this.ensureFieldsWrapped(type)

    type._resource = this.args.resource
    type._permission = this.args.permission
    type._serverVar = this.args.serverVar
    type._serverSrc = this.args.serverSrc
  }

  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition (field, details) {
    this.ensureFieldsWrapped(details.objectType)

    field._resource = this.args.resource
    field._permission = this.args.permission
    field._serverVar = this.args.serverVar
    field._serverSrc = this.args.serverSrc
  }

  ensureFieldsWrapped (objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._allowIfFieldsWrapped) return

    objectType._allowIfFieldsWrapped = true

    const fields = objectType.getFields()

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = async function (...args) {
        const resource = field._resource || objectType._resource
        const permission = field._permission || objectType._permission
        const serverVar = field._serverVar || objectType._serverVar
        const serverSrc = field._serverSrc || objectType._serverSrc

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
    })
  }
}
