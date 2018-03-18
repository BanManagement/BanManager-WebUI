import React from 'react'
import { Comment, Confirm, Loader } from 'semantic-ui-react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Moment from 'react-moment'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

class PlayerReportComment extends React.Component {
  state = { deleteConfirmShow: false, deleting: false }

  showConfirmDelete = () => this.setState({ deleteConfirmShow: true })
  handleConfirmDelete = async () => {
    this.setState({ deleteConfirmShow: false })

    const { id, server } = this.props

    this.setState({ deleting: true })

    try {
      await this.props.mutate(
        { variables: { id, serverId: server }
        , refetchQueries: [ 'report' ] // @TODO Only refetch comments
        })
    } catch (e) {
      this.setState({ error: 'An error occurred' })
    } finally {
      this.setState({ deleting: false })
    }

  }
  handleDeleteCancel = () => this.setState({ deleteConfirmShow: false })

  render() {
    const { actor, created, message, acl } = this.props
    const { deleteConfirmShow, deleting, error } = this.state

    if (deleting) return <Loader active />

    return (
      <Comment>
        <Confirm
          open={deleteConfirmShow}
          onConfirm={this.handleConfirmDelete}
          onCancel={this.handleDeleteCancel}
        />
        <GraphQLErrorMessage error={error} />
        <Comment.Avatar src={`https://crafatar.com/avatars/${actor.id}?size=128&overlay=true`} />
        <Comment.Content>
          <Comment.Author as='a' href={`/player/${actor.id}`}>{actor.name}</Comment.Author>
          <Comment.Metadata>
            <div><Moment unix fromNow>{created}</Moment></div>
          </Comment.Metadata>
          <Comment.Text>{message}</Comment.Text>
          <Comment.Actions>
            {acl.delete &&
              <Comment.Action onClick={this.showConfirmDelete}>Delete</Comment.Action>
            }
          </Comment.Actions>
        </Comment.Content>
      </Comment>
    )
  }
}

const mutation = gql`
  mutation deleteReportComment($id: ID!, $serverId: ID!) {
    deleteReportComment(comment: $id, serverId: $serverId) {
      id
    }
  }
`

export default graphql(mutation)(PlayerReportComment)
