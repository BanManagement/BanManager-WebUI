import { forwardRef } from 'react'
import Message from './Message'
import { uniqBy } from 'lodash-es'

// eslint-disable-next-line react/display-name
const ErrorMessages = forwardRef(({
  error,
  fetchError,
  httpError,
  parseError,
  errors
}, ref) => {
  return (
    <>
      {error && (
        <Message ref={ref} error>
          <Message.Header>Error</Message.Header>
          <Message.List data-cy='errors'>
            <Message.Item>{error.message}</Message.Item>
          </Message.List>
        </Message>
      )}
      {fetchError && (
        <Message ref={ref} error>
          <Message.Header>Fetch Error</Message.Header>
          <Message.List>
            <Message.Item>{fetchError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {httpError && (
        <Message ref={ref} error>
          <Message.Header>HTTP error: {httpError.status}</Message.Header>
          {httpError.statusText && <Message.List><Message.Item>{httpError.statusText}</Message.Item></Message.List>}
        </Message>
      )}
      {parseError && (
        <Message ref={ref} error>
          <Message.Header>Parse Error</Message.Header>
          <Message.List>
            <Message.Item>{parseError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {errors && (
        <Message ref={ref} error>
          <Message.Header>Error</Message.Header>
          <Message.List data-cy='errors'>
            {uniqBy(errors, 'message').map(({ message }, index) => (
              <Message.Item key={index}>{message}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
    </>
  )
})

export default ErrorMessages
