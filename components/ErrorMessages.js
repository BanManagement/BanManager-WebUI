import React from 'react'
import { Message } from 'semantic-ui-react'
import { uniqBy } from 'lodash-es'

export default function ErrorMessages ({
  error,
  fetchError,
  httpError,
  parseError,
  graphQLErrors
}) {
  return (
    <>
      {error && (
        <Message error>
          <Message.Header>Error</Message.Header>
          <Message.List>
            <Message.Item>{error.message}</Message.Item>
          </Message.List>
        </Message>
      )}
      {fetchError && (
        <Message error>
          <Message.Header>Fetch Error</Message.Header>
          <Message.List>
            <Message.Item>{fetchError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {httpError && (
        <Message error>
          <Message.Header>HTTP error: {httpError.status}</Message.Header>
          {httpError.statusText && <Message.List><Message.Item>{httpError.statusText}</Message.Item></Message.List>}
        </Message>
      )}
      {parseError && (
        <Message error>
          <Message.Header>Parse Error</Message.Header>
          <Message.List>
            <Message.Item>{parseError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {graphQLErrors && (
        <Message error>
          <Message.Header>Error</Message.Header>
          <Message.List>
            {uniqBy(graphQLErrors, 'message').map(({ message }, index) => (
              <Message.Item key={index}>{message}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
    </>
  )
}
