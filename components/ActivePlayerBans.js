import React from 'react'
import { Header, Loader, Card } from 'semantic-ui-react'
import PlayerPunishment from './PlayerPunishment'
import { useApi } from '../utils'

const query = `
query playerBans($id: UUID!) {
  playerBans(player: $id) {
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
    }
    server {
      id
      name
    }
  }
}`

export default function ActivePlayerBans ({ id }) {
  const { loading, data, errors } = useApi({ query, variables: { id } })

  if (loading) return <Loader active inline='centered' />
  if (errors || !data || !data.playerBans || !data.playerBans.length) return null

  const rows = data.playerBans.map((row, i) => (
    <PlayerPunishment key={row.server.id + row.id + 'ban'} type='ban' server={row.server} punishment={row} />
  ))

  return (
    <>
      <Header>Active Bans</Header>
      <Card.Group itemsPerRow={3} stackable>
        {rows}
      </Card.Group>
    </>
  )
}
