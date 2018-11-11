import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerMuteForm from 'components/PlayerMuteForm'
import PlayerMuteQuery from 'components/queries/PlayerMuteQuery'
import PageContentContainer from 'components/PageContentContainer'

export class PlayerMutePage extends React.Component {
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
    const title = 'Edit Player Mute'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <PlayerMuteQuery id={id} server={server} onUpdate={this.onUpdate}>
            {({ playerMute }, { handleUpdate }) => (
              <PlayerMuteForm data={playerMute} onSubmit={handleUpdate} />
            )}
          </PlayerMuteQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerMutePage)
