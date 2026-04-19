import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerMuteForm from '../../../components/PlayerMuteForm'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { fromNow, useApi } from '../../../utils'
import Panel from '../../../components/Panel'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const [serverId, id] = router.query.id?.split('-') || []
  const { loading, data, errors } = useApi({
    query: !serverId || !id
      ? null
      : `query playerMute($id: ID!, $serverId: ID!) {
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

  if (errors) return <ErrorLayout errors={errors} />

  const query = `mutation updatePlayerMute($id: ID!, $serverId: ID!, $input: UpdatePlayerMuteInput!) {
    updatePlayerMute(id: $id, serverId: $serverId, input: $input) {
      id
    }
  }`

  return (
    <DefaultLayout title={t('pages.player.actionTitles.editMuteDocument', { name: data?.playerMute?.player?.name ?? '' })} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title={t('pages.player.actionTitles.editMute')} subTitle={fromNow(data?.playerMute?.created || 0)} />
          <PlayerMuteForm
            defaults={data?.playerMute}
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
            onFinished={() => router.push(`/player/${data?.playerMute?.player?.id}`)}
          />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
