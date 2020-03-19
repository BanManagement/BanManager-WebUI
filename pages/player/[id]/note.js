import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerNoteForm from '../../../components/PlayerNoteForm'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, graphQLErrors } = useApi({
    query: `query player($id: UUID!) {
    player(id: $id) {
      id
      name
      servers {
        server {
          id
          name
        }
      }
    }
  }`,
    variables: { id }
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data || graphQLErrors) return <GraphQLErrorMessage error={graphQLErrors} />

  const query = `mutation createPlayerNote($input: CreatePlayerNoteInput!) {
    createPlayerNote(input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Ban ${data.player.name}`}>
      <PageContainer>
        <PlayerNoteForm
          player={data.player}
          servers={data.player.servers}
          query={query}
          parseVariables={(input) => ({
            input: {
              player: id,
              server: input.server,
              message: input.message
            }
          })}
          onFinished={() => router.push(`/player/${id}`)}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
