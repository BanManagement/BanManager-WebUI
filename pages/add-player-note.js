import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Router } from 'routes'
import PlayerNoteForm from 'components/PlayerNoteForm'
import PlayerNoteQuery from 'components/queries/PlayerNoteQuery'
import PageContentContainer from 'components/PageContentContainer'

export class PlayerNotePage extends React.Component {
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
    const title = 'Add Player Note'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <PlayerNoteQuery id={id} onUpdate={this.onUpdate}>
            {(data, { handleCreate }) => (
              <PlayerNoteForm data={data} onSubmit={handleCreate} />
            )}
          </PlayerNoteQuery>
        </PageContentContainer>

      </DefaultLayout>
    )
  }
}

export default withData(PlayerNotePage)
