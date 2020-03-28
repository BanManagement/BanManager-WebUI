import { Button, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import PageLayout from '../../../components/PageLayout'
import { useApi } from '../../../utils'

import PlayerAlts from '../../../components/PlayerAlts'
import PlayerHeader from '../../../components/PlayerHeader'
import PlayerIpList from '../../../components/PlayerIpList'
import PlayerPunishmentList from '../../../components/PlayerPunishmentList'
import PlayerHistoryList from '../../../components/PlayerHistoryList'
import HTML from '../../../components/HTML'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'

const availableComponents = {
  PlayerAlts, PlayerHeader, PlayerIpList, PlayerHistoryList, PlayerPunishmentList, HTML
}

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data } = useApi({
    query: ` query player($id: UUID!) {
    player(id: $id) {
      id
      name
      lastSeen
      servers {
        acl {
          bans {
            create
          }
          mutes {
            create
          }
          notes {
            create
          }
          warnings {
            create
          }
        }
      }
    }
  }`,
    variables: { id }
  })

  if (loading) return <Loader active />
  if (!data) return <GraphQLErrorMessage />

  // @TODO Reduce
  let canCreateBan = false
  let canCreateMute = false
  let canCreateNote = false
  let canCreateWarning = false

  data.player.servers.forEach(server => {
    if (server.acl.bans.create) canCreateBan = true
    if (server.acl.mutes.create) canCreateMute = true
    if (server.acl.notes.create) canCreateNote = true
    if (server.acl.warnings.create) canCreateWarning = true
  })

  return (
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
  )
}
