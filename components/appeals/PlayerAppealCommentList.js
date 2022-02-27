import Link from 'next/link'
import Avatar from '../Avatar'
import Loader from '../Loader'
import { useApi, useUser } from '../../utils'
import PlayerAppealComment from './PlayerAppealComment'
import PlayerCommentForm from '../PlayerCommentForm'
import PlayerAppealCommentAssigned from './PlayerAppealCommentAssigned'
import PlayerAppealCommentState from './PlayerAppealCommentState'
import PlayerAppealCommentPunishmentDeleted from './PlayerAppealCommentPunishmentDeleted'
import PlayerAppealCommentPunishmentUpdate from './PlayerAppealCommentPunishmentUpdate'

const createCommentQuery = `mutation createAppealComment($id: ID!, $input: AppealCommentInput!) {
  createAppealComment(id: $id, input: $input) {
    id
    content
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
query listPlayerAppealComments($id: ID!, $actor: UUID, $order: OrderByInput) {
  listPlayerAppealComments(id: $id, actor: $actor, order: $order) {
    total
    records {
      id
      type
      content
      created
      oldReason
      newReason
      oldExpires
      newExpires
      oldSoft
      newSoft
      oldPoints
      newPoints
      actor {
        id
        name
      }
      assignee {
        id
        name
      }
      state {
        id
        name
      }
      acl {
        delete
      }
    }
  }
}`

export default function PlayerAppealCommentList ({ appeal, showReply }) {
  const { user } = useUser()
  const { loading, data, mutate } = useApi({ query, variables: { id: appeal.id, actor: null, order: 'created_ASC' } })

  if (loading) return <Loader active />

  const items = data?.listPlayerAppealComments?.records
    ? data.listPlayerAppealComments.records.map(comment => {
        switch (comment.type) {
          case 'comment':
            return (
              <PlayerAppealComment
                key={comment.id}
                {...comment}
                onDelete={({ deleteAppealComment: { id } }) => {
                  const records = data.listPlayerAppealComments.records.filter(c => c.id !== id)

                  mutate({ ...data, listPlayerAppealComments: { total: data.listPlayerAppealComments.total - 1, records } }, false)
                }}
              />
            )
          case 'state':
            return <PlayerAppealCommentState key={comment.id} {...comment} />
          case 'assigned':
            return <PlayerAppealCommentAssigned key={comment.id} {...comment} />
          case 'deletepunishment':
            return <PlayerAppealCommentPunishmentDeleted key={comment.id} appeal={appeal} {...comment} />
          case 'editpunishment':
            return <PlayerAppealCommentPunishmentUpdate key={comment.id} appeal={appeal} {...comment} />
        }

        return null
      })
    : []

  if (!items.length && !showReply) return null

  return (
    <div className="relative block ml-11 pl-4 before:block before:absolute before:content-[''] before:mt-3 before:mb-4 before:top-0 before:bottom-0 before:left-8 before:w-0.5 before:bg-gray-700 before:z-0">
      <PlayerAppealComment id={0} actor={appeal.actor} created={appeal.created} content={appeal.reason} />
      {items}
      {showReply &&
        <div className='ml-4 pt-3 pb-3 relative'>
          <Link href={`/player/${user.id}`}>
            <a className='absolute -left-20'>
              <Avatar uuid={user.id} width={40} height={40} className='mx-1 inline-block relative' />
            </a>
          </Link>
          <div className='-ml-7 md:-ml-4'>
            <div className='relative bg-primary-500 top-0 bottom-0'>
              <PlayerCommentForm
                parseVariables={(input) => ({ id: appeal.id, input: { content: input.comment } })}
                onFinish={({ createAppealComment }) => {
                  const records = data.listPlayerAppealComments.records.slice()

                  records.push(createAppealComment)
                  mutate({ listPlayerAppealComments: { total: data.listPlayerAppealComments.total + 1, records } }, true)
                }}
                query={createCommentQuery}
              />
            </div>
          </div>
        </div>}
    </div>
  )
}
