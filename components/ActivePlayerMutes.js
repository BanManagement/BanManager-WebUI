import { Header, Loader, Card } from 'semantic-ui-react'
import PlayerPunishment from './PlayerPunishment'
import { useApi } from '../utils'

const query = `
query playerMutes($id: UUID!) {
  playerMutes(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    updated
    expires
    acl {
      update
      delete
      yours
    }
    server {
      id
      name
    }
  }
}`

export default function ActivePlayerMutes ({ id }) {
  const { loading, data, errors, mutate } = useApi({ query, variables: { id } })

  if (loading) return <Loader active inline='centered' />
  if (errors || !data || !data.playerMutes || !data.playerMutes.length) return null

  const rows = data.playerMutes.map((row, i) => (
    <PlayerPunishment
      key={row.server.id + row.id + 'mute'}
      type='mute'
      server={row.server}
      punishment={row}
      onDeleted={({ deletePlayerMute: { id } }) => {
        const records = data.playerMutes.filter(c => c.id !== id)

        mutate({ ...data, playerMutes: records }, false)
      }}
    />
  ))

  return (
    <>
      <Header>Active Mutes</Header>
      <Card.Group itemsPerRow={3} stackable>
        {rows}
      </Card.Group>
    </>
  )
}
