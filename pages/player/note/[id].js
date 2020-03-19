import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerNoteForm from '../../../components/PlayerNoteForm'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const [serverId, id] = router.query.id.split('-')
  const { loading, data, graphQLErrors } = useApi({
    query: `
  query playerNote($id: ID!, $serverId: ID!) {
    playerNote(id: $id, serverId: $serverId) {
      id
      message
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

  const query = `mutation updatePlayerNote($id: ID!, $serverId: ID!, $input: UpdatePlayerNoteInput!) {
    updatePlayerNote(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Update ${data.playerNote.player.name} Note`}>
      <PageContainer>
        <PlayerNoteForm
          player={data.playerNote.player}
          servers={[{ server: data.playerNote.server }]}
          defaults={data.playerNote}
          query={query}
          parseVariables={(input) => ({
            id,
            serverId,
            input: { message: input.message }
          })}
          disableServers
          onFinished={() => router.push(`/player/${data.playerNote.player.id}`)}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
