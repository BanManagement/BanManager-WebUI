import React from 'react'
import {
  Container,
  Header,
  Image
} from 'semantic-ui-react'
import Moment from 'react-moment'

export default function PlayerHeader({ player }) {
  return (
    <Container text>
      <Header
        as='h1'
        icon
        inverted
        style={{ fontWeight: 'normal' }}
      >
        <Image src={`https://crafatar.com/avatars/${player.id}?size=128&overlay=true`} />
        <Header.Content>{player.name}</Header.Content>
        <Header.Subheader>
          <Moment unix fromNow>{player.lastSeen}</Moment>
        </Header.Subheader>
      </Header>
    </Container>
  )
}
