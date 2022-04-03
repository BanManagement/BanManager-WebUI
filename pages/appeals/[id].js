import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import Loader from '../../components/Loader'
import DefaultLayout from '../../components/DefaultLayout'
import ErrorLayout from '../../components/ErrorLayout'
import PageContainer from '../../components/PageContainer'
import PlayerAppealBadge from '../../components/appeals/PlayerAppealBadge'
import PageHeader from '../../components/PageHeader'
import PlayerAppealCommentList from '../../components/appeals/PlayerAppealCommentList'
import PlayerAppealAssign from '../../components/appeals/PlayerAppealAssign'
import PlayerAppealState from '../../components/appeals/PlayerAppealState'
import { fromNow, useApi, useMatchMutate, useUser } from '../../utils'
import PlayerAppealActions from '../../components/appeals/PlayerAppealActions'

export default function Page () {
  const { user } = useUser()
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query appeal($id: ID!) {
      appealStates {
        id
        name
      }
      appeal(id: $id) {
        id
        actor {
          id
          name
        }
        assignee {
          id
          name
        }
        punishmentActor {
          id
          name
        }
        punishmentType
        punishmentReason
        punishmentCreated
        punishmentExpires
        punishmentSoft
        punishmentPoints
        reason
        created
        updated
        state {
          id
          name
        }
        server {
          id
          name
        }
        acl {
          state
          assign
          comment
          delete
        }
      }
    }`
  })
  const matchMutate = useMatchMutate()

  const appeal = data?.appeal

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.appealStates.map(state => ({ value: state.id, label: state.name }))
  const canComment = appeal.state.id < 3 && appeal.acl.comment
  const canUpdateState = appeal.acl.state
  const canAssign = appeal.acl.assign
  const mutateCommentInsert = (comment) => (data, mutate) => {
    const records = data.listPlayerAppealComments.records.slice()

    records.push(comment)
    mutate({ listPlayerAppealComments: { total: data.listPlayerAppealComments.total + 1, records } }, false)
  }

  return (
    <DefaultLayout title={`#${id} Appeal`}>
      <PageContainer>
        <div className='pb-6'>
          <h1
            className='text-2xl font-bold break-words pb-2'
          >
            <span className='mr-3'>{appeal.punishmentReason}</span>
            <span className='block md:inline text-gray-400'>#{appeal.id}</span>
            <span className='block md:inline text-gray-400'> {format(fromUnixTime(appeal.created), 'dd MMM yyyy')}</span>
          </h1>
          <p className='pb-4 border-b border-accent-200 text-gray-400'>
            <Link href={`/player/${appeal.actor.id}`}>
              <a>
                {appeal.actor.name}
              </a>
            </Link> is appealing a{appeal.punishmentExpires === 0 ? ' permanent' : ' temporary'} <PlayerAppealBadge appeal={appeal} /> issued on {format(fromUnixTime(appeal.punishmentCreated), 'dd MMM yyyy')} by&nbsp;
            <Link href={`/player/${appeal.punishmentActor.id}`}>
              <a>
                {appeal.punishmentActor.name}
              </a>
            </Link>
            {appeal.punishmentExpires !== 0 && ` which expires ${fromNow(appeal.punishmentExpires)}`}
          </p>
        </div>
        <div className='grid grid-flow-row md:grid-flow-col grid-cols-12'>
          <div className='col-span-12 md:col-span-9'>
            <div>
              <PlayerAppealCommentList appeal={appeal} showReply={canComment} />
            </div>
          </div>
          <div className='hidden md:block col-span-3 space-y-6 mx-6'>
            <div className='sticky top-6'>
              <ul role='list' className='divide-y divide-gray-700'>
                <li className='pb-3'>
                  <div className='flex items-center'>
                    <div className='flex-1 min-w-0 space-y-3'>
                      <p>
                        State
                      </p>
                      {canUpdateState
                        ? (
                          <PlayerAppealState
                            id={appeal.id}
                            currentState={appeal?.state}
                            states={stateOptions}
                            onChange={({ appealState: { appeal: { state, updated }, comment } }) => {
                              mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                              matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                            }}
                          />)
                        : (<p className='text-sm text-gray-400'>{appeal?.state?.name}</p>)}
                    </div>
                  </div>
                </li>
                <li className='py-3 sm:py-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-1 min-w-0 space-y-3'>
                      <p>
                        Assignee
                      </p>
                      {canAssign
                        ? (
                          <PlayerAppealAssign
                            id={appeal.id}
                            player={appeal.assignee}
                            onChange={({ assignAppeal: { appeal: { assignee, updated }, comment } }) => {
                              mutate({ ...data, appeal: { ...data.appeal, assignee, updated } }, false)
                              matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                            }}
                          />)
                        : (<p className='text-sm text-gray-400'>{appeal?.assignee?.name || 'No one'}</p>)}
                    </div>
                  </div>
                </li>
              </ul>
              {!!user && appeal.state.id < 3 ? <PageHeader title='Actions' /> : <></>}
              {!!user && appeal.state.id < 3 &&
                <PlayerAppealActions
                  appeal={appeal}
                  server={appeal.server}
                  onAction={({ appeal: { state, updated }, comment }) => {
                    mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                    matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                  }}
                />}
            </div>
          </div>
        </div>
        <div className='md:hidden col-span-12 space-y-10'>
          <ul role='list' className='divide-y divide-gray-700'>
            <li className='py-3'>
              <div className='flex items-center'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <p>
                    State
                  </p>
                  {canUpdateState
                    ? (
                      <PlayerAppealState
                        id={appeal.id}
                        currentState={appeal?.state}
                        states={stateOptions}
                        onChange={({ appealState: { appeal: { state, updated }, comment } }) => {
                          mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                          matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                        }}
                      />)
                    : (<p className='text-sm text-gray-400'>{appeal?.state?.name}</p>)}
                </div>
              </div>
            </li>
            <li className='py-3 sm:py-4'>
              <div className='flex items-center space-x-4'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <p>
                    Assignee
                  </p>
                  {canAssign
                    ? (
                      <PlayerAppealAssign
                        id={appeal.id}
                        player={appeal.assignee}
                        onChange={({ assignAppeal: { appeal: { assignee, updated }, comment } }) => {
                          mutate({ ...data, appeal: { ...data.appeal, assignee, updated } }, false)
                          matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                        }}
                      />)
                    : (<p className='text-sm text-gray-400'>{appeal?.assignee?.name || 'No one'}</p>)}
                </div>
              </div>
            </li>
          </ul>
          <div>
            {!!user && appeal.state.id < 3 ? <PageHeader title='Actions' /> : <></>}
            {!!user && appeal.state.id < 3 &&
              <PlayerAppealActions
                appeal={appeal}
                server={appeal.server}
                onAction={({ appeal: { state, updated }, comment }) => {
                  mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                  matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id })
                }}
              />}
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
