import React from 'react'
import { Card, Image, List, Loader } from 'semantic-ui-react'
import { useApi } from '../utils'

const metaMap = {
  bans: {
    title: 'Recent Bans',
    operation: 'listPlayerBans'
  },
  mutes: {
    title: 'Recent Mutes',
    operation: 'listPlayerMutes'
  },
  reports: {
    title: 'Recept Reports',
    operation: 'listPlayerReports'
  },
  warnings: {
    title: 'Recent Warnings',
    operation: 'listPlayerWarnings'
  }
}

export default function RecentServerPunishments ({ meta: { serverId, type } }) {
  const variables = { serverId, limit: 5 }
  const meta = metaMap[type]
  const query = `
    query ($serverId: ID!, $limit: Int) {
      ${meta.operation}(serverId: $serverId, limit: $limit, order: created_DESC) {
        total
        records {
          id
          player {
            id
            name
          }
        }
      }
    }`
  const { loading, data } = useApi({ query, variables })

  if (loading) return <Loader active />
  if (!data) return null

  const records = data[meta.operation].records.map(record => {
    const href = type === 'reports' ? `/reports/${serverId}/${record.id}` : `/player/${record.player.id}`
    return (
      <List.Item key={record.id}>
        <Image avatar src={`https://crafatar.com/avatars/${record.player.id}?size=50&overlay=true`} />
        <List.Content>
          <List.Header as='a' href={href}>{record.player.name}</List.Header>
        </List.Content>
      </List.Item>
    )
  })

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>{meta.title}</Card.Header>
      </Card.Content>
      <Card.Content>
        <List>
          {records}
        </List>
      </Card.Content>
    </Card>
  )
}
