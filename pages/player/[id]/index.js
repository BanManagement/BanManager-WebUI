import { useRouter } from 'next/router'
import { usePalette } from '@universemc/react-palette'
import DefaultLayout from '../../../components/DefaultLayout'
import { useApi, useUser } from '../../../utils'

import Loader from '../../../components/Loader'
import PlayerAlts from '../../../components/player/PlayerAlts'
import PlayerHeader from '../../../components/player/PlayerHeader'
import PlayerAvatar from '../../../components/player/PlayerAvatar'
import ActivePlayerBans from '../../../components/ActivePlayerBans'
import ActivePlayerMutes from '../../../components/ActivePlayerMutes'
import ErrorLayout from '../../../components/ErrorLayout'

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
import PlayerStatistics from '../../../components/player/PlayerStatistics'
import PlayerNotes from '../../../components/PlayerNotes'
import PlayerWarnings from '../../../components/PlayerWarnings'
import PlayerBans from '../../../components/PlayerBans'
import PlayerMutes from '../../../components/PlayerMutes'
import PlayerKicks from '../../../components/PlayerKicks'
import PlayerHistoryList from '../../../components/PlayerHistoryList'
import PageContainer from '../../../components/PageContainer'

const fullConfig = resolveConfig(tailwindConfig)

export default function Page () {
  const { hasServerPermission } = useUser()
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    query: !id
      ? null
      : `query player($id: UUID!) {
    player(player: $id) {
      id
      name
      lastSeen
    }
  }`,
    variables: { id }
  })
  const { data: colourData } = usePalette(!data?.player?.id ? null : `https://crafatar.com/renders/body/${data.player.id}?scale=10&overlay=true`)

  if (loading) return <DefaultLayout title='Loading...'><Loader /></DefaultLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />
  if (!data.player) return <ErrorLayout errors={{ error: new Error('Player not found') }} />

  const color = colourData.vibrant || fullConfig.theme.colors.accent['500']

  return (
    <>
      <DefaultLayout title={data.player.name}>
        <PageContainer>
          <div className='grid grid-flow-row xl:grid-flow-col grid-cols-12'>
            <div className='col-span-12 xl:col-span-9 space-y-10'>
              <PlayerHeader id={id} color={color} colourData={colourData} />
              <PlayerStatistics id={id} color={color} colourData={colourData} />
              {hasServerPermission('player.alts', 'view', null, true) && <PlayerAlts id={data.player.id} color={color} />}
              <ActivePlayerBans id={data.player.id} color={color} />
              {hasServerPermission('player.bans', 'view', null, true) && <PlayerBans id={data.player.id} color={color} />}
              <ActivePlayerMutes id={data.player.id} color={color} />
              {hasServerPermission('player.mutes', 'view', null, true) && <PlayerMutes id={data.player.id} color={color} />}
              {hasServerPermission('player.kicks', 'view', null, true) && <PlayerKicks id={data.player.id} color={color} />}
              {hasServerPermission('player.notes', 'view', null, true) && <PlayerNotes id={data.player.id} color={color} />}
              {hasServerPermission('player.warnings', 'view', null, true) && <PlayerWarnings id={data.player.id} color={color} />}
            </div>
            <div className='hidden xl:block col-span-3 space-y-10'>
              <PlayerAvatar id={id} color={color} colourData={colourData} />
              {hasServerPermission('player.history', 'view', null, true) && <div className='mx-6'><PlayerHistoryList id={id} color={color} /></div>}
            </div>
          </div>
          <div className='xl:hidden col-span-12 space-y-10'>
            {hasServerPermission('player.history', 'view', null, true) && <PlayerHistoryList id={id} color={color} />}
          </div>
        </PageContainer>
      </DefaultLayout>
    </>
  )
}
