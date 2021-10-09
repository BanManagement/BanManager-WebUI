import { Container, Header, Image, Loader, Button } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useApi, useUser } from '../utils'

export default function PlayerHeader ({ id, colour }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(player: $id) {
        id
        name
        lastSeen
      }
    }
  `
  })
  const { hasServerPermission } = useUser()
  const canCreateBan = hasServerPermission('player.bans', 'create', null, true)
  const canCreateMute = hasServerPermission('player.mutes', 'create', null, true)
  const canCreateNote = hasServerPermission('player.notes', 'create', null, true)
  const canCreateWarning = hasServerPermission('player.warnings', 'create', null, true)
  const showActions = canCreateBan || canCreateMute || canCreateNote || canCreateWarning

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorMessages errors={errors} />

  return (
    <Container text>
      <Header
        as='h1'
        icon
        inverted={!!colour}
        style={{ fontWeight: 'normal' }}
      >
        <Image src={`https://crafatar.com/avatars/${data.player.id}?size=128&overlay=true`} />
        <Header.Content>{data.player.name}</Header.Content>
        <Header.Subheader>{fromNow(data.player.lastSeen)}</Header.Subheader>
      </Header>
      {showActions &&
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
      }
    </Container>
  )
}
