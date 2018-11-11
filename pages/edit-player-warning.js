import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerWarningForm from 'components/PlayerWarningForm'
import PlayerWarningQuery from 'components/queries/PlayerWarningQuery'
import PageContentContainer from 'components/PageContentContainer'

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
        <PageContentContainer>
          <PlayerWarningQuery id={id} server={server} onUpdate={this.onUpdate}>
            {({ playerWarning }, { handleUpdate }) => (
              <PlayerWarningForm data={playerWarning} onSubmit={handleUpdate} />
            )}
          </PlayerWarningQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerWarningPage)
