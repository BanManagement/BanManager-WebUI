import React, { useState } from 'react'
import { Comment } from 'semantic-ui-react'
import PlayerReportComment from './PlayerReportComment'
import PlayerCommentForm from './PlayerCommentForm'

const query = `mutation createReportComment($report: ID!, $serverId: ID!, $input: ReportCommentInput!) {
  createReportComment(report: $report, serverId: $serverId, input: $input) {
    id
    message
    created
    actor {
      id
      name
    }
    acl {
      delete
    }
  }
}`

export default function PlayerReportCommentList ({ id, comments: defaultComments, handleCommentCreate, showReply, serverId }) {
  const [comments, setComments] = useState(defaultComments)

  const items = comments ? comments.map(comment => (
    <PlayerReportComment
      serverId={serverId}
      key={comment.id}
      {...comment}
      onFinish={(data) => {
        const currentComments = [...comments].filter(c => c.id !== data.deleteReportComment.id)
        setComments(currentComments)
      }}
    />
  )) : []

  return (
    <Comment.Group>
      {showReply &&
        <PlayerCommentForm
          parseVariables={(input) => ({ report: id, serverId, input: { message: input.message } })}
          onFinish={(data) => setComments([...comments, data.createReportComment])}
          query={query}
        />}
      {items}
    </Comment.Group>
  )
}
