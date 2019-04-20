import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerWarningForm from 'components/PlayerWarningForm'
import PlayerWarningQuery from 'components/queries/PlayerWarningQuery'
import PageContentContainer from 'components/PageContentContainer'

export class PlayerWarningPage extends React.Component {
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
    const title = 'Add Player Warning'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <PlayerWarningQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerWarningForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerWarningQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerWarningPage)
