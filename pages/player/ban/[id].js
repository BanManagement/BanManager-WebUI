import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerBanForm from '../../../components/PlayerBanForm'
import ErrorLayout from '../../../components/ErrorLayout'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id.split('-')
  const { loading, data, errors } = useApi({
    query: `
  query playerBan($id: ID!, $serverId: ID!) {
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
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerBan($id: ID!, $serverId: ID!, $input: UpdatePlayerBanInput!) {
    updatePlayerBan(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Ban ${data.playerBan.player.name}`}>
      <PageContainer>
        <PlayerBanForm
          player={data.playerBan.player}
          servers={[{ server: data.playerBan.server }]}
          defaults={data.playerBan}
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
          onFinished={() => router.push(`/player/${data.playerBan.player.id}`)}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
