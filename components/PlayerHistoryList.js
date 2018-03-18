import {
  Header
} from 'semantic-ui-react'
import React from 'react'
import PlayerHistory from 'components/PlayerHistory'

const PlayerHistoryList = ({ player }) => {
  if (!player || !player.servers) return null

  const history = player.servers.reduce((data, server) => {
    if (!server.history) return data

    const row = <PlayerHistory server={server} history={server.history} />

    data.push(row)

    return data
  }, [])

  if (!history.length) return null

  return (
    <React.Fragment>
      <Header>Player History</Header>
      {history}
    </React.Fragment>
  )
}

export default PlayerHistoryList
