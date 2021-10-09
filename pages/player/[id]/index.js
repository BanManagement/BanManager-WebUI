import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageLayout from '../../../components/PageLayout'
import { useApi } from '../../../utils'

import PlayerAlts from '../../../components/PlayerAlts'
import PlayerHeader from '../../../components/PlayerHeader'
import PlayerIpList from '../../../components/PlayerIpList'
import ActivePlayerBans from '../../../components/ActivePlayerBans'
import ActivePlayerMutes from '../../../components/ActivePlayerMutes'
import PlayerHistoryList from '../../../components/PlayerHistoryList'
import PlayerPunishmentRecords from '../../../components/PlayerPunishmentRecords'
import HTML from '../../../components/HTML'
import ErrorLayout from '../../../components/ErrorLayout'

const availableComponents = {
  PlayerAlts,
  PlayerHeader,
  PlayerIpList,
  PlayerHistoryList,
  HTML,
  ActivePlayerBans,
  ActivePlayerMutes,
  PlayerPunishmentRecords
}

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
      lastSeen
    }
  }`,
    variables: { id }
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />
  if (!data.player) return <ErrorLayout errors={{ error: new Error('Player not found') }} />

  return (
    <>
      <DefaultLayout title={data.player.name}>
        <PageLayout
          availableComponents={availableComponents}
          pathname='player'
          props={{ id }}
        />
      </DefaultLayout>
    </>
  )
}
