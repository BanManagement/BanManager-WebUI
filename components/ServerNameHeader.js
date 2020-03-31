import React from 'react'
import { Header, Loader } from 'semantic-ui-react'
import { useApi } from '../utils'

export default function ServerNameHeader ({ meta: { serverId, as } }) {
  if (!serverId) return null

  const variables = { serverId }
  const query = `
    query ($serverId: ID!) {
      server(id: $serverId) {
        name
      }
    }`
  const { loading, data } = useApi({ query, variables })

  if (loading || !data) return <Loader active />

  return <Header as={as}>{data.server.name}</Header>
}
