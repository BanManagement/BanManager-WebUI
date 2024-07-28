import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import DefaultLayout from '../../components/DefaultLayout'
import ErrorLayout from '../../components/ErrorLayout'
import PageContainer from '../../components/PageContainer'
import PlayerAppealBadge from '../../components/appeals/PlayerAppealBadge'
import PlayerAppealCommentList from '../../components/appeals/PlayerAppealCommentList'
import { fromNow, useApi, useUser } from '../../utils'
import PlayerAppealSidebar from '../../components/appeals/PlayerAppealSidebar'

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
        viewerSubscription {
          state
        }
      }
    }`
  })
  const appeal = data?.appeal

  if (loading) return <DefaultLayout title='Loading...' loading />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.appealStates.map(state => ({ value: state.id, label: state.name }))
  const canComment = appeal.state.id < 3 && appeal.acl.comment
  const canUpdateState = appeal.acl.state
  const canAssign = appeal.acl.assign

  return (
    <DefaultLayout title={`#${id} | ${appeal.actor.name} | ${appeal.punishmentReason} | Appeal`}>
      <PageContainer>
        <div className='pb-6'>
          <h1
            className='text-2xl font-bold break-words pb-2'
          >
            <span className='mr-3'>{appeal.punishmentReason}</span>
            <span className='block md:inline text-gray-400'>#{appeal.id}</span>
            <span className='block md:inline text-gray-400'> {format(fromUnixTime(appeal.created), 'dd MMM yyyy')}</span>
          </h1>
          <p className='pb-4 border-b border-accent-400 text-gray-400'>
            <Link href={`/player/${appeal.actor.id}`}>

              {appeal.actor.name}

            </Link> is appealing a{appeal.punishmentExpires === 0 ? ' permanent' : ' temporary'} <PlayerAppealBadge appeal={appeal} /> issued on {format(fromUnixTime(appeal.punishmentCreated), 'dd MMM yyyy')} by&nbsp;
            <Link href={`/player/${appeal.punishmentActor.id}`}>

              {appeal.punishmentActor.name}

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
              <PlayerAppealSidebar
                data={data}
                canUpdateState={canUpdateState}
                canAssign={canAssign}
                stateOptions={stateOptions}
                mutate={mutate}
                user={user}
              />
            </div>
          </div>
        </div>
        <div className='md:hidden col-span-12 space-y-6'>
          <PlayerAppealSidebar
            data={data}
            canUpdateState={canUpdateState}
            canAssign={canAssign}
            stateOptions={stateOptions}
            mutate={mutate}
            user={user}
          />
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
