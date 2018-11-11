import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerBanForm from 'components/PlayerBanForm'
import PlayerBanQuery from 'components/queries/PlayerBanQuery'
import PageContentContainer from 'components/PageContentContainer'

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
        <PageContentContainer>
          <PlayerBanQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerBanForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerBanQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerBanPage)
