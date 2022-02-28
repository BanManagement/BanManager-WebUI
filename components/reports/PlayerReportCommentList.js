import Link from 'next/link'
import Avatar from '../Avatar'
import Loader from '../Loader'
import { useApi, useUser } from '../../utils'
import PlayerReportComment from './PlayerReportComment'
import PlayerCommentForm from '../PlayerCommentForm'

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
query listPlayerReportComments($report: ID!, $serverId: ID!, $actor: UUID, $order: OrderByInput) {
  listPlayerReportComments(report: $report, serverId: $serverId, actor: $actor, order: $order) {
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

export default function PlayerReportCommentList ({ serverId, report, showReply }) {
  const { user } = useUser()
  const { loading, data, mutate } = useApi({ query, variables: { serverId, report, actor: null, order: 'created_ASC' } })

  if (loading) return <Loader active />

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

  if (!items.length && !showReply) return null

  return (
    <div className="relative block ml-11 pl-4 before:block before:absolute before:content-[''] before:mt-3 before:mb-4 before:top-0 before:bottom-0 before:left-8 before:w-0.5 before:bg-gray-700 before:z-0">
      {items}
      <div>
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
                  parseVariables={(input) => ({ report, serverId, input: { comment: input.comment } })}
                  onFinish={({ createReportComment }) => {
                    const records = data.listPlayerReportComments.records.slice()

                    records.push(createReportComment)
                    mutate({ listPlayerReportComments: { total: data.listPlayerReportComments.total + 1, records } }, true)
                  }}
                  query={createCommentQuery}
                />
              </div>
            </div>
          </div>}
      </div>
    </div>
  )
}
