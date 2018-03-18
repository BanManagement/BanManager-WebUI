import React from 'react'
import { Container, Card, Loader } from 'semantic-ui-react'
import PlayerPunishment from './PlayerPunishment'

const types = [ 'bans', 'kicks', 'mutes', 'notes', 'warnings' ]

export default function PlayerPunishmentList({ player }) {
  if (player && player.servers) {
    let activePunishments = []

    player.servers.forEach((server) => {
      types.forEach((type) => {
        if (!server[type] || !Array.isArray(server[type])) return

        const items = server[type].map(data => <PlayerPunishment data={data} server={server.server} key={data.__typename + server.id + data.id} />)

        activePunishments = activePunishments.concat(items)
      })
    })

    return (
      <Card.Group>
        { activePunishments }
      </Card.Group>
    )
  }

  return (
    <Container text>
      <Loader active inline />
    </Container>
  )
}
