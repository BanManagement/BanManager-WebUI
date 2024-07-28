import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerNoteForm from '../../../components/PlayerNoteForm'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { useApi, useUser } from '../../../utils'
import Panel from '../../../components/Panel'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    query: !id
      ? null
      : `query player($id: UUID!) {
    player(player: $id) {
      id
      name
    }
    servers {
      id
      name
    }
  }`,
    variables: { id }
  })
  const { hasServerPermission } = useUser({ redirectIfFound: false, redirectTo: '/' })

  if (errors) return <ErrorLayout errors={errors} />

  const query = `mutation createPlayerNote($input: CreatePlayerNoteInput!) {
    createPlayerNote(input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Add note to ${data?.player?.name}`} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Add note' subTitle={data?.player?.name} />
          <PlayerNoteForm
            serverFilter={server => hasServerPermission('player.notes', 'create', server.id)}
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
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
