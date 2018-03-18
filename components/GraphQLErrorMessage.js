import {
  Message
} from 'semantic-ui-react'
import React from 'react'
import PropTypes from 'prop-types'

const GraphQLErrorMessage = ({ error }) => {
  const { graphQLErrors = [] } = error || {}
  let content
  let hidden = false

  if (error && error.networkError) {
    content = [ <Message.Item key='network-error'>An error occured, please try again</Message.Item> ]
  } else {
    content = graphQLErrors.map((error, i) => <Message.Item key={i}>{error.message}</Message.Item>)
    hidden = !graphQLErrors.length
  }

  return (
    <Message error hidden={hidden}>
      <Message.Header>Error</Message.Header>
      <Message.List children={content} />
    </Message>
  )
}

GraphQLErrorMessage.propTypes =
{ error: PropTypes.instanceOf(Error)
}

export default GraphQLErrorMessage
