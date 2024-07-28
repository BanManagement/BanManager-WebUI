import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerNoteForm from '../../../components/PlayerNoteForm'
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
      : `query playerNote($id: ID!, $serverId: ID!) {
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
  })

  if (errors) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerNote($id: ID!, $serverId: ID!, $input: UpdatePlayerNoteInput!) {
    updatePlayerNote(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Edit ${data?.playerNote?.player?.name} note`} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Edit note' subTitle={fromNow(data?.playerNote?.created || 0)} />
          <PlayerNoteForm
            defaults={data?.playerNote}
            query={query}
            parseVariables={(input) => ({
              id,
              serverId,
              input: { message: input.message }
            })}
            disableServers
            onFinished={() => router.push(`/player/${data?.playerNote?.player?.id}`)}
          />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
