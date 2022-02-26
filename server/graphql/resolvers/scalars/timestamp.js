const { GraphQLScalarType } = require('graphql')
const { GraphQLError } = require('graphql/error')
const { Kind } = require('graphql/language')
const regex = /^\d{10}$/

module.exports = new GraphQLScalarType(
  {
    name: 'Timestamp',
    serialize: value => {
      return parseInt(value, 10)
    },
    parseValue: value => {
      if (value !== 0 && !regex.test(value)) {
        throw new GraphQLError('Query error: Not a valid Timestamp')
      }

      return value
    },
    parseLiteral: ast => {
      if (ast.kind !== Kind.INT) {
        throw new GraphQLError('Query error: Can only parse integers got a: ' + ast.kind, [ast])
      }

      if (ast.value !== 0 && ast.value !== '0' && !regex.test(ast.value)) {
        throw new GraphQLError('Query error: Not a valid Timestamp: ', [ast])
      }

      return parseInt(ast.value, 10)
    }
  })
