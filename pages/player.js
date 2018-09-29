import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import { Button } from 'semantic-ui-react'
import { Router } from 'routes'
import PropTypes from 'prop-types'
import PlayerHeader from 'components/PlayerHeader'
import PlayerPunishmentList from 'components/PlayerPunishmentList'
import PlayerPunishmentsQuery from 'components/queries/PlayerPunishmentsQuery'
import PlayerHistoryList from 'components/PlayerHistoryList'
import PlayerIpList from 'components/PlayerIpList'
import PlayerAlts from 'components/PlayerAlts'
import PageLayoutQuery from 'components/queries/PageLayoutQuery'
import PageLayout from 'components/PageLayout'
import PageContentContainer from 'components/PageContentContainer'

const availableComponents = {
  PlayerHeader, PlayerPunishmentList, PlayerIpList, PlayerHistoryList, PlayerAlts
}

export class PlayerPage extends React.Component {
  static propTypes =
    { player: PropTypes.object.isRequired
    , pathname: PropTypes.string.isRequired
    }

  static async getInitialProps({ query, pathname }) {
    return {
      player: { id: query.id }, pathname
    }
  }

  clickAddHandler = (route) => () => Router.pushRoute(route, { id: this.props.player.id })

  render() {
    return (
      <PageLayoutQuery pathname={this.props.pathname}>
        {({ pageLayout }) => (
          <PlayerPunishmentsQuery id={this.props.player.id}>
            {({ player }) => {
              // @TODO Reduce
              let canCreateBan = false
              let canCreateMute = false
              let canCreateNote = false
              let canCreateWarning = false

              player.servers.forEach(server => {
                if (server.acl.bans.create) canCreateBan = true
                if (server.acl.mutes.create) canCreateMute = true
                if (server.acl.notes.create) canCreateNote = true
                if (server.acl.warnings.create) canCreateWarning = true
              })

              return (
                <DefaultLayout title={player.name}>
                  <PageLayout
                    availableComponents={availableComponents}
                    pageLayout={pageLayout}
                    player={player}
                  />
                  <PageContentContainer>
                    <Button.Group size='large' widths='4'>
                    { canCreateBan &&
                      <Button circular icon='ban' color='green' onClick={this.clickAddHandler('add-player-ban')} />
                    }
                    { canCreateMute &&
                      <Button circular icon='mute' color='green' onClick={this.clickAddHandler('add-player-mute')} />
                    }
                    { canCreateNote &&
                      <Button
                        circular
                        icon='sticky note outline'
                        color='green'
                        onClick={this.clickAddHandler('add-player-note')}
                      />
                    }
                    { canCreateWarning &&
                      <Button
                        circular
                        icon='warning'
                        color='green'
                        onClick={this.clickAddHandler('add-player-warning')}
                      />
                    }
                    </Button.Group>
                  </PageContentContainer>
                </DefaultLayout>
              )
            }}
          </PlayerPunishmentsQuery>
        )}
      </PageLayoutQuery>
    )
  }
}

export default withData(PlayerPage)
