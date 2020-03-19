import React, { useEffect, useState } from 'react'
import { Dropdown, Loader } from 'semantic-ui-react'
import { useApi } from '../utils'

export default function PlayerReportState ({ id, currentState, states, server, onChange }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({ report: id, serverId: server, state: currentState.id })

  const { load, data, graphQLErrors } = useApi({
    query: `mutation reportState($report: ID!, $serverId: ID!, $state: ID!) {
    reportState(report: $report, serverId: $serverId, state: $state) {
      updated
      state {
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
    const stateId = currentState ? currentState.id : null

    if (variables && variables.state !== stateId) {
      load()
    }
  }, [variables])

  const handleChange = (e, { value }) => {
    setLoading(true)

    setVariables({ serverId: server, report: id, state: value })
  }

  if (loading) return <Loader active />

  return (
    <Dropdown
      selection
      fluid={false}
      value={currentState.id}
      options={states}
      onChange={handleChange}
    />
  )
}
