import React from 'react'
import { Header, Image, List, Loader } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

export default function PlayerAlts ({ id, colour }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `query playerAlts($id: UUID!) {
      playerAlts(player: $id) {
        id
        name
      }
    }`
  })

  if (loading) return <Loader active />
  if (errors) return <ErrorMessages {...errors} />
  if (!data || !data.playerAlts || !data.playerAlts.length) return null

  const alts = data.playerAlts.map(alt => {
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
