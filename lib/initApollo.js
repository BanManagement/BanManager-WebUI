import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { ApolloLink } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-fetch'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

function omitTypename(key, value) {
  return key === '__typename' ? undefined : value
}

function create(initialState, ctx) {
  let link = new HttpLink(
    { uri: process.env.API_HOST + '/graphql' // Server URL (must be absolute)
    , credentials: 'include'
    })

  link = new ApolloLink((operation, forward) => {
    if (operation.variables) {
      operation.variables = JSON.parse(JSON.stringify(operation.variables), omitTypename)
    }

    return forward(operation)
  }).concat(link)

  if (!process.browser) { // Forward cookies to API when SSR
    const middlewareLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          cookie: ctx.req.headers.cookie
        }
      })

      return forward(operation)
    })

    link = middlewareLink.concat(link)
  }

  return new ApolloClient(
    { connectToDevTools: process.browser
    , ssrMode: !process.browser // Disables forceFetch on the server (so queries are only run once)
    , link
    , cache: new InMemoryCache().restore(initialState || {})
    })
}

export default function initApollo(initialState, ctx) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState, ctx)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState)
  }

  return apolloClient
}
