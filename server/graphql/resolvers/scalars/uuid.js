const { parse, unparse } = require('uuid-parse')
const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { isUUID } = require('validator')
const ExposedErrpr = require('../../../data/exposed-error')

module.exports = new GraphQLScalarType(
  {
    name: 'UUID',
    serialize: value => {
      if (!Buffer.isBuffer(value)) return value

      return unparse(value)
    },
    parseValue: value => {
      if (!isUUID(value)) {
        throw new ExposedErrpr('Type Error: Invalid UUID')
      }

      return parse(value, Buffer.alloc(16))
    },
    parseLiteral: ast => {
      if (ast.kind === Kind.STRING && isUUID(ast.value)) {
        return parse(ast.value, Buffer.alloc(16))
      }

      return null
    }
  })
