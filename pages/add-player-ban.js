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
      data: { id: query.id }
    }
  }

  onUpdate = (playerId) => {
    return Router.pushRoute('player', { id: playerId })
  }

  render() {
    const { data: { id } } = this.props
    const title = 'Add Player Ban'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <PlayerBanQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerBanForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerBanQuery>
        </Container>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerBanPage)
