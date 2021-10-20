import { useState } from 'react'
import { Comment, Grid, Header, Loader, Pagination } from 'semantic-ui-react'
import { useApi } from '../utils'
import PlayerAppealComment from './PlayerAppealComment'
import PlayerCommentForm from './PlayerCommentForm'

const createCommentQuery = `mutation createAppealComment($id: ID!, $input: AppealCommentInput!) {
  createAppealComment(id: $id, input: $input) {
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
query listPlayerAppealComments($id: ID!, $actor: UUID, $limit: Int, $offset: Int, $order: OrderByInput) {
  listPlayerAppealComments(id: $id, actor: $actor, limit: $limit, offset: $offset, order: $order) {
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

export default function PlayerAppealCommentList ({ appeal, showReply, limit = 10 }) {
  const [tableState, setTableState] = useState({ id: appeal, activePage: 1, limit, offset: 0, actor: null, order: 'created_DESC' })
  const { loading, data, mutate } = useApi({ query, variables: tableState })

  if (loading) return <Loader active />

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const items = data?.listPlayerAppealComments?.records
    ? data.listPlayerAppealComments.records.map(comment => (
      <PlayerAppealComment
        key={comment.id}
        {...comment}
        onFinish={({ deleteAppealComment: { id } }) => {
          const records = data.listPlayerAppealComments.records.filter(c => c.id !== id)

          mutate({ ...data, listPlayerAppealComments: { total: data.listPlayerAppealComments.total - 1, records } }, false)
        }}
      />
      ))
    : []
  const total = data?.listPlayerAppealComments.total || 0
  const totalPages = Math.ceil(total / limit)

  if (!items.length && !showReply) return null

  return (
    <Grid.Row style={{ marginTop: '1em' }}>
      <Grid.Column width={16}>
        <Header>Comments</Header>
        <Comment.Group>
          {showReply &&
            <PlayerCommentForm
              parseVariables={(input) => ({ id: appeal, input: { comment: input.comment } })}
              onFinish={({ createAppealComment }) => {
                const records = data.listPlayerAppealComments.records.slice()

                records.push(createAppealComment)
                mutate({ listPlayerAppealComments: { total: data.listPlayerAppealComments.total + 1, records } }, true)
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
