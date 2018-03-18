import {
  Header,
  Image,
  List
} from 'semantic-ui-react'
import React from 'react'
import PropTypes from 'prop-types'

const PlayerAlts = ({ player }) => {
  if (!player || !player.servers) return null

  // @TODO Clean up, iterating mutliple times
  const players = player.servers.reduce((data, server) => {
    if (!server.alts) return data

    data = data.concat(server.alts)

    return data
  }, [])

  if (!players.length) return null

  const uniq = players.filter((s1, pos, arr) => arr.findIndex((s2)=> s2.id === s1.id) === pos )
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
    <React.Fragment>
      <Header>Possible Alts</Header>
      <List divided>
        {alts}
      </List>
    </React.Fragment>
  )
}

PlayerAlts.propTypes =
{ player: PropTypes.object
}

export default PlayerAlts
