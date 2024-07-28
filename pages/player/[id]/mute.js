import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerMuteForm from '../../../components/PlayerMuteForm'
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
  }`,
    variables: { id }
  })
  const { hasServerPermission } = useUser({ redirectIfFound: false, redirectTo: '/' })

  if (errors) return <ErrorLayout errors={errors} />

  const query = `mutation createPlayerMute($input: CreatePlayerMuteInput!) {
    createPlayerMute(input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Mute ${data?.player?.name}`} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title={`Mute ${data?.player?.name}`} subTitle='' />
          <PlayerMuteForm
            serverFilter={server => hasServerPermission('player.mutes', 'create', server.id)}
            query={query}
            parseVariables={(input) => ({
              input: {
                player: id,
                server: input.server,
                reason: input.reason,
                expires: Math.floor(input.expires / 1000),
                soft: input.soft
              }
            })}
            onFinished={() => router.push(`/player/${id}`)}
          />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
