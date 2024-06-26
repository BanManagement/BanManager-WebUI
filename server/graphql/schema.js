const depthLimit = require('graphql-depth-limit')
const responseCachePlugin = require('@apollo/server-plugin-response-cache').default
const { unparse } = require('uuid-parse')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const typeDefs = require('./types')
const resolvers = require('./resolvers')
const { constraintDirectiveTypeDefs, createApollo4QueryValidationPlugin } = require('graphql-constraint-directive/apollo4')
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

  schema = allowIfDirective()(schema)
  schema = allowIfLoggedInDirective()(schema)
  schema = sqlRelationDirective()(schema)
  schema = sqlTableDirective()(schema)

  return {
    cache: 'bounded',
    debug: false,
    schema,
    validationRules: [depthLimit(10)],
    introspection: true,
    context: ({ ctx: { log, session, state } }) => ({
      log,
      session,
      state
    }),
    formatError (error) {
      const originalError = findOriginalError(error)

      if (originalError?.extensions?.code === 'ERR_EXPOSED' || originalError?.extensions?.code === 'BAD_USER_INPUT') {
        return originalError
      }

      logger.error(originalError.stack ? originalError.stack : originalError)

      return { message: 'Internal Server Error' }
    },
    plugins: [
      createApollo4QueryValidationPlugin(),
      {
        requestDidStart ({ request, contextValue }) {
          contextValue.log.debug(request.query)
        }
      },
      responseCachePlugin({
        sessionId: ({ contextValue }) => {
          if (contextValue.session && contextValue.session.playerId) {
            return unparse(contextValue.session.playerId)
          }

          return 'public' // Shared cache for guests
        }
      })
    ]
  }
}
