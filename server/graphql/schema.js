const typeDefs = require('./types')
const resolvers = require('./resolvers')
const schemaDirectives = {
  constraint: require('graphql-constraint-directive'),
  allowIf: require('./directives/allow-if'),
  allowIfLoggedIn: require('./directives/allow-if-logged-in')
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

      logger.error(originalError)

      return { message: 'Internal Server Error' }
    }
    // validationRules: [depthLimit(10)]
  }
}
