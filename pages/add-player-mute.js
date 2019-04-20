import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerMuteForm from 'components/PlayerMuteForm'
import PlayerMuteQuery from 'components/queries/PlayerMuteQuery'
import PageContentContainer from 'components/PageContentContainer'

export class PlayerMutePage extends React.Component {
  static async getInitialProps ({ query }) {
    return {
      data: { id: query.id }
    }
  }

  onUpdate = (playerId) => {
    return Router.pushRoute('player', { id: playerId })
  }

  render () {
    const { data: { id } } = this.props
    const title = 'Add Player Mute'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <PlayerMuteQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerMuteForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerMuteQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerMutePage)
