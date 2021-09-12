import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerMuteForm from '../../../components/PlayerMuteForm'
import ErrorLayout from '../../../components/ErrorLayout'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id?.split('-') || []
  const { loading, data, errors } = useApi({
    query: !serverId || !id ? null : `
  query playerMute($id: ID!, $serverId: ID!) {
    playerMute(id: $id, serverId: $serverId) {
      id
      reason
      expires
      soft
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

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerMute($id: ID!, $serverId: ID!, $input: UpdatePlayerMuteInput!) {
    updatePlayerMute(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Mute ${data.playerMute.player.name}`}>
      <PageContainer>
        <PlayerMuteForm
          player={data.playerMute.player}
          servers={[{ server: data.playerMute.server }]}
          defaults={data.playerMute}
          query={query}
          parseVariables={(input) => ({
            id,
            serverId,
            input: {
              reason: input.reason,
              expires: Math.floor(input.expires / 1000),
              soft: input.soft
            }
          })}
          disableServers
          onFinished={() => router.push(`/player/${data.playerMute.player.id}`)}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
