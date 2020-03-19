import { Loader, Table } from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'
import { fromNow, useApi } from '../utils'

export default function PlayerIpList ({ id }) {
  const { loading, data, graphQLErrors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(id: $id) {
        servers {
          id
          ip
          lastSeen
          server {
            name
          }
        }
      }
    }
  `
  })

  if (loading) return <Loader active />
  if (graphQLErrors) return <GraphQLErrorMessage error={graphQLErrors} />
  if (!data || !data.player || !data.player.servers) return null

  const ips = data.player.servers.reduce((rows, server) => {
    if (!server.ip) return rows

    const row = (
      <Table.Row key={server.id}>
        <Table.Cell>{server.server.name}</Table.Cell>
        <Table.Cell>{server.ip}</Table.Cell>
        <Table.Cell collapsing textAlign='right'>{fromNow(server.lastSeen)}</Table.Cell>
      </Table.Row>
    )

    rows.push(row)

    return rows
  }, [])

  if (!ips.length) return null

  return (
    <Table celled striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan='3'>IP Addresses</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{ips}</Table.Body>
    </Table>
  )
}
