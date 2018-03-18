import App from '../components/App'
import withData from '../lib/withData'
import withSession from '../lib/withSession'
import DefaultLayout from '../components/DefaultLayout'
import {
  Button,
  Container,
  Header,
  Icon,
  Segment
} from 'semantic-ui-react'
import PlayerSearch from '../components/PlayerSearch'
import { Router } from '../routes'

export class HomePage extends React.Component {
  handlePlayerSelect = (e, { result }) => {
    if (!result.id) return

    Router.pushRoute('player', { id: result.id })
  }

  render() {
    return (
      <DefaultLayout title='Welcome'>
        <Segment
          inverted
          color='blue'
          textAlign='center'
          style={{ minHeight: 700, padding: '1em 0em', marginLeft: '-1em', marginRight: '-1em' }}
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
