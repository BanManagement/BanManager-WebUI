import { useRouter } from 'next/router'
import { Comment, Grid, Header, Loader } from 'semantic-ui-react'
import { fromNow, useApi } from '../../utils'
import DefaultLayout from '../../components/DefaultLayout'
import ErrorLayout from '../../components/ErrorLayout'
import PageContainer from '../../components/PageContainer'
import PlayerAppealCommentList from '../../components/PlayerAppealCommentList'
import PlayerAppealAssign from '../../components/PlayerAppealAssign'
import PlayerAppealState from '../../components/PlayerAppealState'
import PlayerPunishment from '../../components/PlayerPunishment'

const types = {
  PlayerBan: 'ban',
  PlayerKick: 'kick',
  PlayerMute: 'mute',
  PlayerNote: 'note',
  PlayerWarning: 'warning'
}

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query appeal($id: ID!) {
      appealStates {
        id
        name
      }
      appeal(id: $id) {
        id
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
        server {
          id
          name
        }
        punishment {
          __typename
          ... on PlayerBan {
            id
            actor {
              id
              name
            }
            created
            reason
            expires
            acl {
              delete
            }
          }
          ... on PlayerBanRecord {
            id
            actor {
              id
              name
            }
            pastActor {
              id
              name
            }
            created
            pastCreated
            reason
            expired
            acl {
              delete
            }
          }
          ... on PlayerKick {
            id
            actor {
              id
              name
            }
            created
            reason
            acl {
              delete
            }
          }
          ... on PlayerMute {
            id
            actor {
              id
              name
            }
            created
            reason
            expires
            acl {
              delete
            }
          }
          ... on PlayerMuteRecord {
            id
            actor {
              id
              name
            }
            pastActor {
              id
              name
            }
            created
            pastCreated
            reason
            expired
            acl {
              delete
            }
          }
          ... on PlayerWarning {
            id
            actor {
              id
              name
            }
            created
            reason
            expires
            acl {
              delete
            }
          }
        }
        acl {
          state
          assign
          comment
          delete
        }
      }
    }`
  })

  const appeal = data?.appeal

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.appealStates.map(state => ({ key: state.id, value: state.id, text: state.name }))
  const canComment = appeal.acl.comment
  const canUpdateState = appeal.acl.state
  const canAssign = appeal.acl.assign
  const punishmentType = types[appeal.punishment.__typename]

  return (
    <DefaultLayout title={`#${id} Appeal`}>
      <PageContainer>
        <Grid>
          <Grid.Row>
            <Grid.Column width={12}>
              <Comment.Group>
                <Header dividing>Appeal #{appeal.id} - {appeal.actor.name}</Header>
                <Comment>
                  <Comment.Avatar src={`https://crafatar.com/avatars/${appeal.actor.id}?size=128&overlay=true`} />
                  <Comment.Content>
                    <Comment.Author as='a' href={`/player/${appeal.actor.id}`}>{appeal.actor.name}</Comment.Author>
                    <Comment.Metadata>{fromNow(appeal.created)}</Comment.Metadata>
                    <Comment.Text>{appeal.reason}</Comment.Text>
                  </Comment.Content>
                </Comment>
              </Comment.Group>
            </Grid.Column>
            <Grid.Column computer={4} mobile={16}>
              <Grid.Row>
                <Grid.Column width={16}>
                  <Header dividing>Details</Header>
                  <Grid.Row>
                    <Grid.Column>
                      State: {canUpdateState
                      ? (
                        <PlayerAppealState
                          id={appeal.id}
                          currentState={appeal?.state}
                          states={stateOptions}
                          onChange={({ appealState: { state, updated } }) => {
                            mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                          }}
                        />)
                      : (
                        <span>{appeal.state.name}</span>
                        )}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column>
                      Assigned: {canAssign
                      ? (
                        <PlayerAppealAssign
                          id={appeal.id}
                          player={appeal.assignee}
                          onChange={({ assignAppeal: { assignee, updated } }) => {
                            mutate({ ...data, appeal: { ...data.appeal, assignee, updated } }, false)
                          }}
                        />)
                      : (<span>{appeal?.assignee?.name}</span>)}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column>
                      <p>Updated: {fromNow(appeal?.updated)}</p>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column>
                      <PlayerPunishment punishment={appeal.punishment} server={appeal.server} type={punishmentType} />
                    </Grid.Column>
                  </Grid.Row>
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
          <PlayerAppealCommentList appeal={id} showReply={canComment} />
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
