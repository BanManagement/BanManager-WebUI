import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerBanForm from '../../../components/PlayerBanForm'
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
      : `query playerBan($id: ID!, $serverId: ID!) {
    playerBan(id: $id, serverId: $serverId) {
      id
      reason
      expires
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

  const query = `mutation updatePlayerBan($id: ID!, $serverId: ID!, $input: UpdatePlayerBanInput!) {
    updatePlayerBan(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Edit ${data?.playerBan?.player?.name} ban`} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Edit ban' subTitle={fromNow(data?.playerBan?.created || 0)} />
          <PlayerBanForm
            defaults={data?.playerBan}
            query={query}
            parseVariables={(input) => ({
              id,
              serverId,
              input: {
                reason: input.reason,
                expires: Math.floor(input.expires / 1000)
              }
            })}
            disableServers
            onFinished={() => router.push(`/player/${data?.playerBan.player.id}`)}
          />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
