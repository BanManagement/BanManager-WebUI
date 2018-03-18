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
      data: { id: query.id }
    }
  }

  onUpdate = (playerId) => {
    return Router.pushRoute('player', { id: playerId })
  }

  render() {
    const { data: { id } } = this.props
    const title = 'Add Player Warning'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <PlayerWarningQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerWarningForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerWarningQuery>
        </Container>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerWarningPage)
