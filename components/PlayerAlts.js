import { Header, Image, List, Loader } from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'
import { useApi } from '../utils'

export default function PlayerAlts ({ id, colour }) {
  const { loading, data, graphQLErrors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(id: $id) {
        servers {
          alts {
            id
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

  // @TODO Clean up, iterating mutliple times
  const players = data.player.servers.reduce((data, server) => {
    if (!server.alts) return data

    data = data.concat(server.alts)

    return data
  }, [])

  if (!players.length) return null

  const uniq = players.filter((s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) === pos)
  const alts = uniq.map(alt => {
    return (
      <List.Item key={alt.id}>
        <Image avatar src={`https://crafatar.com/avatars/${alt.id}?size=50&overlay=true`} />
        <List.Content>
          <List.Header as='a' href={`/player/${alt.id}`}>{alt.name}</List.Header>
        </List.Content>
      </List.Item>
    )
  })

  return (
    <>
      <Header inverted={!!colour}>Possible Alts</Header>
      <List divided inverted={!!colour}>
        {alts}
      </List>
    </>
  )
}
