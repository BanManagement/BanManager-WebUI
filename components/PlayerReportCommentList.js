import { useState } from 'react'
import { Comment, Grid, Header, Loader, Pagination } from 'semantic-ui-react'
import { useApi } from '../utils'
import PlayerReportComment from './PlayerReportComment'
import PlayerCommentForm from './PlayerCommentForm'

const createCommentQuery = `mutation createReportComment($report: ID!, $serverId: ID!, $input: ReportCommentInput!) {
  createReportComment(report: $report, serverId: $serverId, input: $input) {
    id
    comment
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
const query = `
query listPlayerReportComments($report: ID!, $serverId: ID!, $actor: UUID, $limit: Int, $offset: Int, $order: OrderByInput) {
  listPlayerReportComments(report: $report, serverId: $serverId, actor: $actor, limit: $limit, offset: $offset, order: $order) {
    total
    records {
      id
      comment
      created
      actor {
        id
        name
      }
      acl {
        delete
      }
    }
  }
}`

export default function PlayerReportCommentList ({ serverId, report, showReply, limit = 10 }) {
  const [tableState, setTableState] = useState({ serverId, report, activePage: 1, limit, offset: 0, actor: null, order: 'created_DESC' })
  const { loading, data, mutate } = useApi({ query, variables: tableState })

  if (loading) return <Loader active />

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const items = data?.listPlayerReportComments?.records
    ? data.listPlayerReportComments.records.map(comment => (
      <PlayerReportComment
        serverId={serverId}
        key={comment.id}
        {...comment}
        onFinish={({ deleteReportComment: { id } }) => {
          const records = data.listPlayerReportComments.records.filter(c => c.id !== id)

          mutate({ ...data, listPlayerReportComments: { total: data.listPlayerReportComments.total - 1, records } }, false)
        }}
      />
      ))
    : []
  const total = data?.listPlayerReportComments.total || 0
  const totalPages = Math.ceil(total / limit)

  if (!items.length && !showReply) return null

  return (
    <Grid.Row style={{ marginTop: '1em' }}>
      <Grid.Column width={16}>
        <Header>Comments</Header>
        <Comment.Group>
          {showReply &&
            <PlayerCommentForm
              parseVariables={(input) => ({ report, serverId, input: { comment: input.comment } })}
              onFinish={({ createReportComment }) => {
                const records = data.listPlayerReportComments.records.slice()

                records.push(createReportComment)
                mutate({ listPlayerReportComments: { total: data.listPlayerReportComments.total + 1, records } }, true)
              }}
              query={createCommentQuery}
            />}
          {items}
        </Comment.Group>
        <Pagination
          fluid
          totalPages={totalPages}
          activePage={tableState.activePage}
          onPageChange={handlePageChange}
        />
      </Grid.Column>
    </Grid.Row>
  )
}
