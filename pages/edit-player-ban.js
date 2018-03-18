import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerBanForm from 'components/PlayerBanForm'
import PlayerBanQuery from 'components/queries/PlayerBanQuery'

export class PlayerBanPage extends React.Component {
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
    const title = 'Edit Player Ban'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <PlayerBanQuery id={id} server={server} onUpdate={this.onUpdate}>
            {({ playerBan }, { handleUpdate }) => (
              <PlayerBanForm data={playerBan} onSubmit={handleUpdate} />
            )}
          </PlayerBanQuery>
        </Container>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerBanPage)
