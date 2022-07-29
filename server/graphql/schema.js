const depthLimit = require('graphql-depth-limit')
const responseCachePlugin = require('apollo-server-plugin-response-cache').default
const { unparse } = require('uuid-parse')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const typeDefs = require('./types')
const resolvers = require('./resolvers')
const { constraintDirectiveTypeDefs, constraintDirective } = require('graphql-constraint-directive')
const { allowIfDirectiveTypeDefs, allowIfDirective } = require('./directives/allow-if')
const { allowIfLoggedInDirectiveTypeDefs, allowIfLoggedInDirective } = require('./directives/allow-if-logged-in')
const { sqlRelationDirectiveTypeDefs, sqlRelationDirective } = require('./directives/sql-relation')
const { sqlTableDirectiveTypeDefs, sqlTableDirective } = require('./directives/sql-table')

const findOriginalError = (error) => {
  if (error.originalError) return findOriginalError(error.originalError)

  return error
}

module.exports = ({ logger }) => {
  let schema = makeExecutableSchema({
    typeDefs: [
      constraintDirectiveTypeDefs,
      allowIfDirectiveTypeDefs,
      allowIfLoggedInDirectiveTypeDefs,
      sqlRelationDirectiveTypeDefs,
      sqlTableDirectiveTypeDefs,
      typeDefs
    ],
    resolvers
  })

  schema = constraintDirective()(schema)
  schema = allowIfDirective()(schema)
  schema = allowIfLoggedInDirective()(schema)
  schema = sqlRelationDirective()(schema)
  schema = sqlTableDirective()(schema)

  return {
    cache: 'bounded',
    debug: false,
    schema,
    validationRules: [depthLimit(10)],
    context: ({ ctx: { log, session, state } }) => ({
      log,
      session,
      state
    }),
    formatError (error) {
      const originalError = findOriginalError(error)

      if (originalError.exposed) {
        return originalError
      }

      if (originalError.code === 'ERR_GRAPHQL_CONSTRAINT_VALIDATION') {
        const { fieldName, message } = originalError

        return { ...originalError, message: `${fieldName} ${message}` }
      }

      logger.error(originalError.stack ? originalError.stack : originalError)

      return { message: 'Internal Server Error' }
    },
    plugins: [
      {
        requestDidStart ({ request, context }) {
          context.log.debug(request.query)
        }
      },
      responseCachePlugin({
        sessionId: ({ context }) => {
          if (context.session && context.session.playerId) {
            return unparse(context.session.playerId)
          }

          return 'public' // Shared cache for guests
        }
      })
    ]
  }
}
