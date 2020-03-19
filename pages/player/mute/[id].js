import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerMuteForm from '../../../components/PlayerMuteForm'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id.split('-')
  const { loading, data, graphQLErrors } = useApi({
    query: `
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
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data || graphQLErrors) return <GraphQLErrorMessage error={graphQLErrors} />

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
