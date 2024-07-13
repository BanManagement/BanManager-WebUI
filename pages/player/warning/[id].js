import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerWarnForm from '../../../components/PlayerWarnForm'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { fromNow, useApi } from '../../../utils'
import Panel from '../../../components/Panel'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id?.split('-') || []
  const { loading, data, errors } = useApi({
    query: !serverId || !id
      ? null
      : `query playerWarning($id: ID!, $serverId: ID!) {
    playerWarning(id: $id, serverId: $serverId) {
      id
      reason
      expires
      points
      created
      player {
        id
        name
      }
      server {
        id
        name
      }
    }
  }`,
    variables: { id, serverId }
  })

  if (errors) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerWarning($id: ID!, $serverId: ID!, $input: UpdatePlayerWarningInput!) {
    updatePlayerWarning(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Edit ${data?.playerWarning?.player?.name} warning`} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Edit warning' subTitle={fromNow(data?.playerWarning?.created || 0)} />
          <PlayerWarnForm
            defaults={data?.playerWarning}
            query={query}
            parseVariables={(input) => ({
              id,
              serverId,
              input: {
                reason: input.reason,
                expires: Math.floor(input.expires / 1000),
                points: input.points
              }
            })}
            disableServers
            onFinished={() => router.push(`/player/${data?.playerWarning.player.id}`)}
          />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
