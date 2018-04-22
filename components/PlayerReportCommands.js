import React from 'react'
import { Header, Image, Segment } from 'semantic-ui-react'
import Moment from 'react-moment'

export default function PlayerReportCommands({ commands }) {
  const cmds = commands.map(cmd => (
    <Segment key={cmd.id}>
      [<Moment unix format='YYYY-MM-DD HH:mm:ss'>{cmd.created}</Moment>] <Image floated='left' src={`https://crafatar.com/avatars/${cmd.actor.id}?size=28&overlay=true`} /> {cmd.actor.name} <pre style={{ display: 'inline' }}>/{cmd.command} {cmd.args}</pre>
    </Segment>
  ))

  return (
    <React.Fragment>
      <Header>Commands</Header>
      <Segment.Group color='black'>{cmds}</Segment.Group>
    </React.Fragment>
  )
}
