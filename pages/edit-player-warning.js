import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerWarningForm from 'components/PlayerWarningForm'
import PlayerWarningQuery from 'components/queries/PlayerWarningQuery'

export class PlayerWarningPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      data: { id: query.id, server: query.server }
    }
  }

  onUpdate = (playerId) => {
    return Router.pushRoute('player', { id: playerId })
  }

  render() {
    const { data: { id, server } } = this.props
    const title = 'Edit Player Warning'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <PlayerWarningQuery id={id} server={server} onUpdate={this.onUpdate}>
            {({ playerWarning }, { handleUpdate }) => (
              <PlayerWarningForm data={playerWarning} onSubmit={handleUpdate} />
            )}
          </PlayerWarningQuery>
        </Container>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerWarningPage)
