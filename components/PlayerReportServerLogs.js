import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import Moment from 'react-moment'

export default function PlayerReportServerLogs({ logs }) {
  const serverLogs = logs.map(log => (
    <Segment key={log.id}>
      [<Moment unix format='YYYY-MM-DD HH:mm:ss'>{log.created}</Moment>] {log.message}
    </Segment>
  ))

  return (
    <React.Fragment>
      <Header>Server Logs</Header>
      <Segment.Group color='black'>{serverLogs}</Segment.Group>
    </React.Fragment>
  )
}
