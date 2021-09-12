import { useEffect } from 'react';
import { Loader } from 'semantic-ui-react'
import PlayerSelector from '../components/admin/PlayerSelector'
import { useMutateApi } from '../utils'

export default function PlayerReportAssign ({ id, player, server, onChange }) {
  const { data, loading, load } = useMutateApi({
    query: /* GraphQL */ `
      mutation assignReport($report: ID!, $serverId: ID!, $player: UUID!) {
        assignReport(report: $report, serverId: $serverId, player: $player) {
          updated
          state {
            id
            name
          }
          assignee {
            id
            name
          }
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].updated)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (newPlayer) => {
    if (player?.id !== newPlayer) {
      load({ serverId: server, report: id, player: newPlayer || null })
    }
  }

  if (loading) return <Loader active />

  const options = []

  if (player) {
    options.push({
      key: player.id,
      value: player.id,
      text: player.name,
      image: `https://crafatar.com/avatars/${player.id}?size=128&overlay=true`
    })
  }

  return (
    <PlayerSelector
      fluid={false}
      multiple={false}
      // clearable
      value={player ? player.id : null}
      options={options}
      handleChange={handleChange}
    />
  )
}
