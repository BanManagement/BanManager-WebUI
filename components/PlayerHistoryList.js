import { Header, Loader, Table } from 'semantic-ui-react'
import { format, fromUnixTime } from 'date-fns'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

const PlayerHistory = ({ server, history }) => {
  if (!history || !history.length) return null

  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  const ips = history.map((item, i) => {
    return (
      <Table.Row key={i}>
        <Table.Cell>
          {format(fromUnixTime(item.join), dateFormat)}
        </Table.Cell>
        <Table.Cell>
          {format(fromUnixTime(item.leave), dateFormat)}
        </Table.Cell>
        <Table.Cell>{item.ip}</Table.Cell>
      </Table.Row>
    )
  })

  return (
    <Table celled striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan='3'>{server.server.name}</Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell>Joined</Table.HeaderCell>
          <Table.HeaderCell>Left</Table.HeaderCell>
          <Table.HeaderCell>IP Address</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{ips}</Table.Body>
    </Table>
  )
}

export default function PlayerHistoryList ({ id }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(id: $id) {
        servers {
          server {
            name
          }
          history {
            ip
            join
            leave
          }
        }
      }
    }
  `
  })

  if (loading) return <Loader active />
  if (errors) return <ErrorMessages {...errors} />
  if (!data || !data.player || !data.player.servers) return null

  const history = data.player.servers.reduce((data, server, i) => {
    if (!server.history || !server.history.length) return data

    const row = <PlayerHistory server={server} history={server.history} key={i} />

    data.push(row)

    return data
  }, [])

  if (!history.length) return null

  return (
    <>
      <Header>Player Session History</Header>
      {history}
    </>
  )
}
