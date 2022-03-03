import { useRouter } from 'next/router'
import Loader from '../../../components/Loader'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerBanForm from '../../../components/PlayerBanForm'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { fromNow, useApi } from '../../../utils'

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

  if (loading) return <DefaultLayout title='Loading...'><Loader /></DefaultLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerBan($id: ID!, $serverId: ID!, $input: UpdatePlayerBanInput!) {
    updatePlayerBan(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={`Update ${data.playerBan.player.name} ban`}>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <PageHeader title='Edit ban' subTitle={`Created ${fromNow(data.playerBan.created)}`} />
          <PlayerBanForm
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
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
