import React, { useEffect, useState } from 'react'
import { Loader } from 'semantic-ui-react'
import PlayerSelector from '../components/admin/PlayerSelector'
import { useApi } from '../utils'

export default function PlayerReportAssign ({ id, player, server, onChange }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({ serverId: server, report: id, player: player ? player.id : null })

  const { load, data, graphQLErrors } = useApi({
    query: `mutation assignReport($report: ID!, $serverId: ID!, $player: UUID!) {
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
  }`,
    variables
  }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [graphQLErrors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].updated)) {
      setLoading(false)
      onChange(data)
    }
  }, [data])
  useEffect(() => {
    const playerId = player ? player.id : null

    if (variables && variables.player !== playerId) {
      load()
    }
  }, [variables])

  const handleChange = (player) => {
    setLoading(true)

    setVariables({ serverId: server, report: id, player: player || null })
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
