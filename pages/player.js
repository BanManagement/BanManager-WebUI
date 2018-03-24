import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Button,
  Container,
  Segment
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerHeader from 'components/PlayerHeader'
import PlayerPunishmentList from 'components/PlayerPunishmentList'
import PlayerPunishmentsQuery from 'components/queries/PlayerPunishmentsQuery'
import PlayerHistoryList from 'components/PlayerHistoryList'
import PlayerIpList from 'components/PlayerIpList'
import PlayerAlts from 'components/PlayerAlts'

export class PlayerPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      player: { id: query.id }
    }
  }

  clickAddHandler = (route) => () => Router.pushRoute(route, { id: this.props.player.id })

  render() {
    return (
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
              <Segment
                inverted
                color='blue'
                textAlign='center'
                style={{ padding: '1em 0em', marginLeft: '-1em', marginRight: '-1em' }}
                vertical
              >
                <PlayerHeader player={player} />
              </Segment>
              <Container style={{ marginTop: '1em' }}>
                <Button.Group size='large' widths='4'>
                { canCreateBan &&
                  <Button circular icon='ban' color='green' onClick={this.clickAddHandler('add-player-ban')} />
                }
                { canCreateMute &&
                  <Button circular icon='mute' color='green' onClick={this.clickAddHandler('add-player-mute')} />
                }
                { canCreateNote &&
                  <Button circular icon='sticky note outline' color='green' onClick={this.clickAddHandler('add-player-note')} />
                }
                { canCreateWarning &&
                  <Button circular icon='warning' color='green' onClick={this.clickAddHandler('add-player-warning')} />
                }
                </Button.Group>
              </Container>
              <Container style={{ marginTop: '1em' }}>
                <PlayerPunishmentList player={player} />
                <PlayerIpList player={player} />
                <PlayerHistoryList player={player} />
                <PlayerAlts player={player} />
              </Container>
            </DefaultLayout>
          )
        }}
      </PlayerPunishmentsQuery>
    )
  }
}

export default withData(PlayerPage)
