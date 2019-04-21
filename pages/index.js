import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container,
  Header,
  Segment
} from 'semantic-ui-react'
import PlayerSearch from 'components/PlayerSearch'
import { Router } from 'routes'

export class HomePage extends React.Component {
  handlePlayerSelect = (e, { result }) => {
    if (!result.id) return

    Router.pushRoute('player', { id: result.id })
  }

  render () {
    return (
      <DefaultLayout title='Welcome'>
        <Segment
          inverted
          color='blue'
          textAlign='center'
          style={{ padding: '1em 0em', marginLeft: '-1em', marginRight: '-1em', display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
          vertical
        >
          <Container>
            <Header
              as='h1'
              content='Your Server Name'
              inverted
              style={{ fontSize: '4em', fontWeight: 'normal', marginBottom: 0, marginTop: '3em' }}
            />
            <PlayerSearch handleResultSelect={this.handlePlayerSelect} />
          </Container>
        </Segment>
      </DefaultLayout>
    )
  }
}

export default withData(HomePage)
