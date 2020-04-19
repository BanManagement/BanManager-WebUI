const depthLimit = require('graphql-depth-limit')
const responseCachePlugin = require('apollo-server-plugin-response-cache')
const { unparse } = require('uuid-parse')
const typeDefs = require('./types')
const resolvers = require('./resolvers')
const schemaDirectives = {
  constraint: require('graphql-constraint-directive'),
  allowIf: require('./directives/allow-if'),
  allowIfLoggedIn: require('./directives/allow-if-logged-in'),
  sqlRelation: require('./directives/sql-relation'),
  sqlTable: require('./directives/sql-table')
}
const findOriginalError = (error) => {
  if (error.originalError) return findOriginalError(error.originalError)

  return error
}

module.exports = ({ logger }) => {
  return {
    debug: false,
    typeDefs,
    resolvers,
    schemaDirectives,
    validationRules: [depthLimit(10)],
    tracing: process.env.NODE_ENV !== 'production',
    cacheControl: process.env.NODE_ENV !== 'test',
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
