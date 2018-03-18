import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import {
  Container,
  Header,
  Image,
  Loader
} from 'semantic-ui-react'
import Moment from 'react-moment'

function PlayerHeader ({ data: { loading, error, player } }) {
  if (player) {
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

  return (
    <Container text>
      <Loader active inverted inline />
    </Container>
  )
}

const query = gql`
  query player($id: UUID!) {
    player(id: $id) {
      id
      name
      lastSeen
    }
  }
`

export default graphql(query, {
  options: ({ id }) => ({ variables: { id } })
})(PlayerHeader)
