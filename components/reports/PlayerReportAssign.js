import { useEffect } from 'react'
import Loader from '../Loader'
import PlayerSelector from '../admin/PlayerSelector'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerReportAssign ({ id, player, server, onChange }) {
  const { data, loading, load, errors } = useMutateApi({
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
    if (newPlayer && player?.id !== newPlayer) {
      load({ serverId: server, report: id, player: newPlayer || null })
    }
  }

  if (loading) return <Loader />

  return (
    <>
      <ErrorMessages errors={errors} />
      <PlayerSelector
        multiple={false}
        onChange={handleChange}
        placeholder='Search by player name'
        defaultValue={player ? ({ value: player.id, label: <PlayerSelector.Label player={player} /> }) : null}
      />
    </>
  )
}
