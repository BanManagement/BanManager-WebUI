import { Header, Loader, Table } from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'
import { fromNow, useApi } from '../utils'

const PlayerHistory = ({ server, history }) => {
  if (!history || !history.length) return null

  const ips = history.map((item, i) => {
    return (
      <Table.Row key={i}>
        <Table.Cell>
          {fromNow(item.join)}
        </Table.Cell>
        <Table.Cell>
          {fromNow(item.leave)}
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
      </Table.Header>
      <Table.Body>{ips}</Table.Body>
    </Table>
  )
}

export default function PlayerHistoryList ({ id }) {
  const { loading, data, graphQLErrors } = useApi({
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
  if (graphQLErrors) return <GraphQLErrorMessage error={graphQLErrors} />
  if (!data || !data.player || !data.player.servers) return null

  const history = data.player.servers.reduce((data, server, i) => {
    if (!server.history) return data

    const row = <PlayerHistory server={server} history={server.history} key={i} />

    data.push(row)

    return data
  }, [])

  if (!history.length) return null

  return (
    <>
      <Header>Player History</Header>
      {history}
    </>
  )
}
