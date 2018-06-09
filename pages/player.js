import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Button,
  Container,
  Grid,
  Segment,
  Responsive
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerHeader from 'components/PlayerHeader'
import PlayerPunishmentList from 'components/PlayerPunishmentList'
import PlayerPunishmentsQuery from 'components/queries/PlayerPunishmentsQuery'
import PlayerHistoryList from 'components/PlayerHistoryList'
import PlayerIpList from 'components/PlayerIpList'
import PlayerAlts from 'components/PlayerAlts'
import PageLayoutQuery from 'components/queries/PageLayoutQuery'

const availableComponents = {
  PlayerHeader,
  PlayerPunishmentList,
  PlayerIpList,
  PlayerHistoryList,
  PlayerAlts
}

export class PlayerPage extends React.Component {
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

              const rowCount = pageLayout.devices.desktop.reduce(function (x, y) {
                return (x.y > y.y) ? x.y : y.y
              })
              const rows = []

              for (let i = 0; i <= rowCount; i++) {
                rows[i] = []
              }

              pageLayout.devices.desktop.forEach(deviceComponent => {
                rows[deviceComponent.y].push(deviceComponent)
              })

              const desktopComponents = rows.map((row, i) => {
                const components = row.sort((a, b) => a.x - b.x).map((deviceComponent, index) => {
                  const Component = availableComponents[deviceComponent.component]
                  const rendered =
                    <Grid.Column
                      width={deviceComponent.w}
                      color={deviceComponent.colour}
                      key={index}
                      textAlign={deviceComponent.textAlign}
                    >
                      <Container><Component player={player} /></Container>
                    </Grid.Column>

                  return rendered
                })

                return (
                  <Grid.Row key={i}>
                    {components}
                  </Grid.Row>
                )
              })

              const components = <React.Fragment>
                <Responsive {...Responsive.onlyMobile}>
                  <Grid style={{ marginTop: '1em' }}>{desktopComponents}</Grid>
                </Responsive>
                <Responsive {...Responsive.onlyTablet}>
                  <Grid>{desktopComponents}</Grid>
                </Responsive>
                <Responsive {...Responsive.onlyComputer}>
                  <Grid>{desktopComponents}</Grid>
                </Responsive>
              </React.Fragment>

              return (
                <DefaultLayout title={player.name}>
                  {components}
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
