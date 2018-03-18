import {
  Table
} from 'semantic-ui-react'
import React from 'react'
import Moment from 'react-moment'
import { fromLong } from 'ip'

const PlayerIpList = ({ player }) => {
  if (!player || !player.servers) return null

  const ips = player.servers.reduce((data, server) => {
    if (!server.ip) return data

    const row = <Table.Row key={server.id}>
      <Table.Cell>{server.server.name}</Table.Cell>
      <Table.Cell>{fromLong(server.ip)}</Table.Cell>
      <Table.Cell collapsing textAlign='right'>
        <Moment unix fromNow>{server.lastSeen}</Moment>
      </Table.Cell>
    </Table.Row>

    data.push(row)

    return data
  }, [])

  if (!ips.length) return null

  return (
    <Table celled striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan='3'>IP Addresses</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{ips}</Table.Body>
    </Table>
  )
}

export default PlayerIpList
