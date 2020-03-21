const { GraphQLScalarType } = require('graphql')
const { GraphQLError } = require('graphql/error')
const { Kind } = require('graphql/language')
const { isIP } = require('validator')
const { inetTop } = require('../../../data/ip')

module.exports = new GraphQLScalarType(
  {
    name: 'IPAddress',
    serialize: value => {
      if (!Buffer.isBuffer(value)) return value

      return inetTop(value)
    },
    parseValue: value => {
      if (!isIP(value)) {
        throw new GraphQLError('Query error: Not a valid IPAddress')
      }

      return value
    },
    parseLiteral: ast => {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast])
      }

      if (!isIP(ast.value)) {
        throw new GraphQLError('Query error: Not a valid IPAddress: ', [ast])
      }

      return ast.value
    }
  })
