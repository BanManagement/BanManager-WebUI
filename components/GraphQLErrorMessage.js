import {
  Message
} from 'semantic-ui-react'
import React from 'react'

const GraphQLErrorMessage = ({ error = {} }) => {
  let content
  let hidden = false

  if (error && error.networkError) {
    content = [<Message.Item key='network-error'>An error occured, please try again</Message.Item>]
  } else if (error && error.length) {
    content = error.map((e, i) => <Message.Item key={i}>{e.message}</Message.Item>)
    hidden = !error.length
  } else {
    return null
  }

  return (
    <Message error hidden={hidden}>
      <Message.Header>Error</Message.Header>
      <Message.List children={content} />
    </Message>
  )
}

export default GraphQLErrorMessage
