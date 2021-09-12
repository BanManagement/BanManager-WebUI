import { Button, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
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

  // @TODO Reduce
  const canCreateBan = false
  const canCreateMute = false
  const canCreateNote = false
  const canCreateWarning = false

  // data.player.servers.forEach(server => {
  //   if (server.acl.bans.create) canCreateBan = true
  //   if (server.acl.mutes.create) canCreateMute = true
  //   if (server.acl.notes.create) canCreateNote = true
  //   if (server.acl.warnings.create) canCreateWarning = true
  // })

  return (
    <>
      <DefaultLayout title={data.player.name}>
        <PageLayout
          availableComponents={availableComponents}
          pathname='player'
          props={{ id }}
        />
        <PageContainer>
          <Button.Group size='large' widths='4'>
            {canCreateBan &&
              <Button
                as='a'
                href={`/player/${id}/ban`}
                circular
                icon='ban'
                color='green'
                title='Ban Player'
              />}
            {canCreateMute &&
              <Button
                as='a'
                href={`/player/${id}/mute`}
                circular
                icon='mute'
                color='green'
                title='Mute Player'
              />}
            {canCreateNote &&
              <Button
                as='a'
                href={`/player/${id}/note`}
                circular
                icon='sticky note outline'
                color='green'
                title='Add Note'
              />}
            {canCreateWarning &&
              <Button
                as='a'
                href={`/player/${id}/warn`}
                circular
                icon='warning'
                color='green'
                title='Warn Player'
              />}
          </Button.Group>
        </PageContainer>
      </DefaultLayout>
    </>
  )
}
