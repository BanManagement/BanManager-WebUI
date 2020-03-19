import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerWarnForm from '../../../components/PlayerWarnForm'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id.split('-')
  const { loading, data, graphQLErrors } = useApi({
    query: `
  query playerWarning($id: ID!, $serverId: ID!) {
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
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data || graphQLErrors) return <GraphQLErrorMessage error={graphQLErrors} />

  const query = `mutation updatePlayerWarning($id: ID!, $serverId: ID!, $input: UpdatePlayerWarningInput!) {
    updatePlayerWarning(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Warn ${data.playerWarning.player.name}`}>
      <PageContainer>
        <PlayerWarnForm
          player={data.playerWarning.player}
          servers={[{ server: data.playerWarning.server }]}
          defaults={data.playerWarning}
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
          onFinished={() => router.push(`/player/${data.playerWarning.player.id}`)}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
