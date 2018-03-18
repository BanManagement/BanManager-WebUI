import React from 'react'
import PlayerReportComment from 'components/PlayerReportComment'
import {
  Button,
  Comment,
  Form
} from 'semantic-ui-react'
import PlayerCommentForm from 'components/PlayerCommentForm'

class PlayerReportCommentList extends React.Component {
  render() {
    const { showReply } = this.props
    const comments = this.props.comments ? this.props.comments.map(comment => {
      return <PlayerReportComment server={this.props.server} key={comment.id} {...comment} />
    }) : []

    return (
      <Comment.Group>
        {showReply &&
          <PlayerCommentForm onSubmit={this.props.handleCommentCreate} />
        }
        {comments}
      </Comment.Group>
    )
  }
}

export default PlayerReportCommentList
