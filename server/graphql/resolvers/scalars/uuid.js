const { GraphQLScalarType } = require('graphql')
const { GraphQLError } = require('graphql/error')
const { Kind } = require('graphql/language')
// eslint-disable-next-line max-len
const regex = /^([[{(]?)([0-9A-F]{8})([:-]?)([0-9A-F]{4})([:-]?)([0-9A-F]{4})([:-]?)([0-9A-F]{4})([:-]?)([0-9A-F]{12})([\]})]?)$/i

module.exports = new GraphQLScalarType(
  {
    name: 'UUID',
    serialize: value => {
      return value
    },
    parseValue: value => {
      if (!regex.test(value)) {
        throw new GraphQLError('Query error: Not a valid UUID')
      }

      return value
    },
    parseLiteral: ast => {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast])
      }

      if (!regex.test(ast.value)) {
        throw new GraphQLError('Query error: Not a valid UUID: ', [ast])
      }

      return ast.value
    }
  })
