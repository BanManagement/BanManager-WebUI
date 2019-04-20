import {
  Table
} from 'semantic-ui-react'
import React from 'react'
import PropTypes from 'prop-types'
import Moment from 'react-moment'
import { fromLong } from 'ip'

const PlayerHistory = ({ server, history }) => {
  if (!history || !history.length) return null

  const ips = history.map((item, i) => {
    return (
      <Table.Row key={i}>
        <Table.Cell>
          <Moment unix fromNow>{item.join}</Moment>
        </Table.Cell>
        <Table.Cell>
          <Moment unix fromNow>{item.leave}</Moment>
        </Table.Cell>
        <Table.Cell>{fromLong(item.ip)}</Table.Cell>
      </Table.Row>
    )
  })

  return (
    <Table celled striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan='3'>{server.name}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{ips}</Table.Body>
    </Table>
  )
}

PlayerHistory.propTypes =
{ server: PropTypes.object.isRequired,
  history: PropTypes.array.isRequired
}

export default PlayerHistory
