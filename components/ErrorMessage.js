import {
  Message
} from 'semantic-ui-react'

export default ({ error }) => {
  if (!error) return null

  const content = <Message.Item key='error-message'>{error.message}</Message.Item>

  return (
    <Message error>
      <Message.Header>Error</Message.Header>
      <Message.List children={content} />
    </Message>
  )
}
