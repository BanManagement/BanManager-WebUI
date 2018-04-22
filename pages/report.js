import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container,
  Comment,
  Grid,
  Header,
  Image,
  Responsive
} from 'semantic-ui-react'
import Moment from 'react-moment'
import PlayerReportCommentList from 'components/PlayerReportCommentList'
import ReportQuery from 'components/queries/ReportQuery'
import PlayerReportServerLogs from 'components/PlayerReportServerLogs'
import PlayerReportAssign from 'components/PlayerReportAssign'
import PlayerReportState from 'components/PlayerReportState'
import PlayerReportCommands from 'components/PlayerReportCommands'

export class PlayerPage extends React.Component {
  state = {}

  static async getInitialProps({ query }) {
    return {
      report: { id: query.id }
    , server: { id: query.server }
    }
  }

  handleOnScreenUpdate = (e, { width }) => this.setState({ width })

  render() {
    const { width } = this.state

    return (
      <DefaultLayout title={`#${this.props.report.id} Report`}>
        <ReportQuery id={this.props.report.id} server={this.props.server.id}>
          {({ report, reportStates }, { handleCommentCreate }) => {
            const stateOptions = reportStates.map(state => ({ key: state.id, value: state.id, text: state.name }))
            const canComment = report.acl.comment
            const canUpdateState = report.acl.state
            const canDelete = report.acl.delete
            const canAssign = report.acl.assign

            const { id, actor, commands, player, assignee, reason, created, updated, state, locations, serverLogs, comments } = report

            return (
              <Container style={{ marginTop: '3em' }}>
                <Responsive
                  as={Grid}
                  fireOnMount
                  onUpdate={this.handleOnScreenUpdate}
                >
                  <Grid.Row>
                    <Grid.Column width={12}>
                      <Comment.Group>
                        <Header dividing>Report #{id} - {player.name}</Header>
                        <Comment>
                          <Comment.Avatar src={`https://crafatar.com/avatars/${actor.id}?size=128&overlay=true`} />
                          <Comment.Content>
                            <Comment.Author as='a' href={`/player/${actor.id}`}>{actor.name}</Comment.Author>
                            <Comment.Metadata>
                              <Moment unix fromNow>{created}</Moment>
                            </Comment.Metadata>
                            <Comment.Text>{reason}</Comment.Text>
                          </Comment.Content>
                        </Comment>
                      </Comment.Group>
                      {serverLogs &&
                        <PlayerReportServerLogs logs={serverLogs} />
                      }
                      {commands &&
                        <PlayerReportCommands commands={commands} />
                      }
                    </Grid.Column>
                    <Grid.Column computer={4} mobile={16}>
                      <Grid.Row style={{ marginTop: width <= Responsive.onlyComputer.minWidth ? '1em' : 0 }}>
                        <Grid.Column width={16}>
                          <Header dividing>Details</Header>
                          <Grid.Row>
                            <Grid.Column>
                              State: {canUpdateState ? (
                                <PlayerReportState id={id} server={this.props.server.id} currentState={state} states={stateOptions} />
                              ) : (
                                <span>{state.name}</span>
                              )}
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row>
                            <Grid.Column>
                              Assigned: {canAssign ? (
                                <PlayerReportAssign id={id} assignee={assignee} server={this.props.server.id} />
                              ) : (
                                <span>{assignee ? assignee.name : ''}</span>
                              )}
                            </Grid.Column>
                          </Grid.Row>
                          <p>Updated: <Moment unix fromNow>{updated}</Moment></p>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column width={16}>
                          <Header dividing>Locations</Header>
                          <p>
                            <Image floated='left' src={`https://crafatar.com/avatars/${locations.player.player.id}?size=28&overlay=true`} /> {locations.player.player.name}
                          </p>
                          <pre>/tppos {locations.player.x} {locations.player.y} {locations.player.z} {locations.player.pitch} {locations.player.yaw} {locations.player.world}</pre>
                          <p>
                            <Image floated='left' src={`https://crafatar.com/avatars/${locations.actor.player.id}?size=28&overlay=true`} /> {locations.actor.player.name}
                          </p>
                          <pre>/tppos {locations.actor.x} {locations.actor.y} {locations.actor.z} {locations.actor.pitch} {locations.actor.yaw} {locations.actor.world}</pre>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid.Column>
                  </Grid.Row>
                  {comments &&
                    <Grid.Row style={{ marginTop: '1em' }}>
                      <Grid.Column width={16}>
                        <Header>Comments</Header>
                        <PlayerReportCommentList handleCommentCreate={handleCommentCreate} comments={comments} server={this.props.server.id} showReply={canComment} />
                      </Grid.Column>
                    </Grid.Row>
                  }
                </Responsive>
              </Container>
            )
          }}
        </ReportQuery>
      </DefaultLayout>
    )
  }
}

export default withData(PlayerPage)
