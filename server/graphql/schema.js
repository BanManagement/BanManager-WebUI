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
      const code = originalError?.extensions?.code

      if (code === 'ERR_EXPOSED') {
        const meta = originalError.extensions.meta || originalError.meta

        return {
          message: originalError.message,
          extensions: {
            code: 'ERR_EXPOSED',
            appCode: originalError.extensions.appCode || originalError.code || 'UNKNOWN',
            ...(meta ? { meta } : {})
          }
        }
      }

      if (code === 'BAD_USER_INPUT') {
        return {
          message: originalError.message,
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        }
      }

      logger.error(originalError.stack ? originalError.stack : originalError)

      return {
        message: 'Internal Server Error',
        extensions: { code: 'INTERNAL_SERVER_ERROR', appCode: 'INTERNAL' }
      }
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
