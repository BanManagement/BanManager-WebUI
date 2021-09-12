import { Loader, Table } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useApi } from '../utils'

export default function PlayerIpList ({ id }) {
  const { loading, data, errors } = useApi({
    variables: { id },
    query: `query playerInfo($id: UUID!) {
      playerInfo(player: $id) {
        id
        ip
        lastSeen
        server {
          id
          name
        }
      }
    }`
  })

  if (loading) return <Loader active />
  if (errors) return <ErrorMessages {...errors} />
  if (!data || !data.playerInfo) return null

  const ips = data.playerInfo.reduce((rows, info) => {
    if (!info.ip) return rows

    const row = (
      <Table.Row key={`playerInfo_${info.server.id}`}>
        <Table.Cell>{info.server.name}</Table.Cell>
        <Table.Cell>{info.ip}</Table.Cell>
        <Table.Cell collapsing textAlign='right'>{fromNow(info.lastSeen)}</Table.Cell>
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
