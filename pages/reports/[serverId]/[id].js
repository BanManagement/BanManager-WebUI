import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Comment, Grid, Header, Image, Loader, Segment } from 'semantic-ui-react'
import { format, fromUnixTime } from 'date-fns'
import { fromNow, useApi } from '../../../utils'
import DefaultLayout from '../../../components/DefaultLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerReportCommentList from '../../../components/PlayerReportCommentList'
import PlayerReportAssign from '../../../components/PlayerReportAssign'
import PlayerReportState from '../../../components/PlayerReportState'

export default function Page () {
  const router = useRouter()
  const { id, serverId } = router.query
  const { loading, data, errors } = useApi({
    variables: { serverId, id },
    query: `query report($id: ID!, $serverId: ID!) {
      reportStates(serverId: $serverId) {
        id
        name
      }
      server(id: $serverId) {
        id
        name
      }
      report(id: $id, serverId: $serverId) {
        id
        player {
          id
          name
        }
        actor {
          id
          name
        }
        assignee {
          id
          name
        }
        reason
        created
        updated
        state {
          id
          name
        }
        playerLocation {
          world
          x
          y
          z
          yaw
          pitch
        }
        actorLocation {
          world
          x
          y
          z
          yaw
          pitch
        }
        acl {
          state
          assign
          comment
          delete
        }
        serverLogs {
          id
          log {
            message
            created
          }
        }
        commands {
          id
          command
          args
          created
          actor {
            id
            name
          }
        }
      }
    }`
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  const report = data?.report

  const [state, setState] = useState(report?.state)
  const [updated, setUpdated] = useState(report?.updated)
  const [assignee, setAssignee] = useState(report?.assignee)

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const renderLocation = (location, player) => (
    <>
      <p>
        <Image floated='left' src={`https://crafatar.com/avatars/${player.id}?size=28&overlay=true`} /> {player.name}
      </p>
      <pre style={{ overflowY: 'auto' }}>/tppos {location.x} {location.y} {location.z} {location.pitch} {location.yaw} {location.world}</pre>
    </>
  )
  const stateOptions = data.reportStates.map(state => ({ key: state.id, value: state.id, text: state.name }))
  const canComment = report.acl.comment
  const canUpdateState = report.acl.state
  const canAssign = report.acl.assign

  return (
    <DefaultLayout title={`#${id} Report`}>
      <PageContainer>
        <Grid>
          <Grid.Row>
            <Grid.Column width={12}>
              <Comment.Group>
                <Header dividing>Report #{report.id} - {report.player.name}</Header>
                <Comment>
                  <Comment.Avatar src={`https://crafatar.com/avatars/${report.actor.id}?size=128&overlay=true`} />
                  <Comment.Content>
                    <Comment.Author as='a' href={`/player/${report.actor.id}`}>{report.actor.name}</Comment.Author>
                    <Comment.Metadata>{fromNow(report.created)}</Comment.Metadata>
                    <Comment.Text>{report.reason}</Comment.Text>
                  </Comment.Content>
                </Comment>
              </Comment.Group>
              {!!report.serverLogs && !!report.serverLogs.length &&
                <>
                  <Header>Server Logs</Header>
                  <Segment.Group color='black'>
                    {report.serverLogs.map(({ id, log }) => (
                      <Segment key={id}>
                        [{format(fromUnixTime(log.created), 'yyyy-MM-dd HH:mm:ss')}] {log.message}
                      </Segment>
                    ))}
                  </Segment.Group>
                </>}
              {!!report.commands && !!report.commands.length &&
                <>
                  <Header>Commands</Header>
                  <Segment.Group color='black'>
                    {report.commands.map(cmd => (
                      <Segment key={cmd.id}>
                        [{format(fromUnixTime(cmd.created), 'yyyy-MM-dd HH:mm:ss')}] <Image floated='left' src={`https://crafatar.com/avatars/${cmd.actor.id}?size=28&overlay=true`} /> {cmd.actor.name} <pre style={{ display: 'inline' }}>/{cmd.command} {cmd.args}</pre>
                      </Segment>
                    ))}
                  </Segment.Group>
                </>}
            </Grid.Column>
            <Grid.Column computer={4} mobile={16}>
              <Grid.Row>
                <Grid.Column width={16}>
                  <Header dividing>Details</Header>
                  <Grid.Row>
                    <Grid.Column>
                      State: {canUpdateState ? (
                        <PlayerReportState
                          id={report.id}
                          server={data.server.id}
                          currentState={state}
                          states={stateOptions}
                          onChange={({ reportState: { state, updated } }) => {
                            setState(state)
                            setUpdated(updated)
                          }}
                        />
                      ) : (
                        <span>{report.state.name}</span>
                      )}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column>
                      Assigned: {canAssign ? (
                        <PlayerReportAssign
                          id={report.id}
                          player={assignee}
                          server={data.server.id}
                          onChange={({ assignReport: { assignee, updated } }) => {
                            setAssignee(assignee)
                            setUpdated(updated)
                          }}
                        />
                      ) : (
                        <span>{assignee ? assignee.name : ''}</span>
                      )}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column>
                      <p>Updated: {fromNow(updated)}</p>
                    </Grid.Column>
                  </Grid.Row>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row style={{ marginTop: '1em' }}>
                <Grid.Column width={16}>
                  <Header dividing>Locations</Header>
                  {report.playerLocation && renderLocation(report.playerLocation, report.player)}
                  {report.actorLocation && renderLocation(report.actorLocation, report.actor)}
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
          <PlayerReportCommentList report={id} serverId={serverId} showReply={canComment} />
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
