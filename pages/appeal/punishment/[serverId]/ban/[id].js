import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../../../components/DefaultLayout'
import PageContainer from '../../../../../components/PageContainer'
import ErrorLayout from '../../../../../components/ErrorLayout'
import PlayerAppealForm from '../../../../../components/appeal/PlayerAppealForm'
import { useApi, useUser } from '../../../../../utils'
import Panel from '../../../../../components/Panel'
import AppealStepHeader from '../../../../../components/appeal/AppealStepHeader'
import Button from '../../../../../components/Button'

export default function Page () {
  const router = useRouter()

  useUser({ redirectIfFound: false, redirectTo: '/' })

  const { id, serverId } = router.query
  const { loading, data, errors } = useApi({
    query: !serverId || !id
      ? null
      : `query playerBan($id: ID!, $serverId: ID!) {
    playerBan(id: $id, serverId: $serverId) {
      id
      reason
      expires
      created
      actor {
        id
        name
      }
      server {
        id
        name
      }
      acl {
        yours
      }
    }

  }`,
    variables: { id, serverId }
  })

  useEffect(() => {
    if (data?.playerBan && !data.playerBan.acl.yours) {
      router.push('/')
    }
  }, [data])

  if (errors) return <ErrorLayout errors={errors} />

  return (
    <DefaultLayout title='Appeal Ban | Appeal' loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={3} title='Appeal Ban' nextStep='Await Review' />
          {!loading && !data?.playerBan && (
            <div>
              <h2 className='text-center text-base font-semibold leading-relaxed pb-1'>Punishment not found</h2>
              <p className='text-center text-sm font-normal leading-snug pb-4'>Head back to the previous page</p>
              <div className='flex gap-3'>
                <Button onClick={() => router.back()}>Back</Button>
              </div>
            </div>
          )}
          {data?.playerBan && <PlayerAppealForm
            {...data?.playerBan}
            type='ban'
            parseVariables={(input) => ({ input: { reason: input.reason, type: 'PlayerBan', serverId, punishmentId: id } })}
            onFinished={({ createAppeal }) => {
              router.push(`/appeals/${createAppeal.id}`)
            }}
                              />}
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
