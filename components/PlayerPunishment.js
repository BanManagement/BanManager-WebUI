import React from 'react'
import {
  Button,
  Card,
  Confirm,
  Icon,
  Label
} from 'semantic-ui-react'
import Moment from 'react-moment'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { Router } from 'routes'
import Alert from 'react-s-alert'

const icons =
{ PlayerBan: 'ban'
, PlayerKick: 'hand paper'
, PlayerMute: 'mute'
, PlayerNote: 'sticky note outline'
, PlayerWarning: 'warning'
}

const editPaths =
{ PlayerBan: 'edit-player-ban'
, PlayerKick: 'edit-player-kick'
, PlayerMute: 'edit-player-mute'
, PlayerNote: 'edit-player-note'
, PlayerWarning: 'edit-player-warning'
}

const buttonWords = { 1: 'one', 2: 'two', 3: 'three' }

const deletePunishmentRecordMutation = gql`
  mutation deletePunishmentRecord($id: ID!, $serverId: ID!, $type: RecordType!, $keepHistory: Boolean!) {
    deletePunishmentRecord(id: $id, serverId: $serverId, type: $type, keepHistory: $keepHistory)
  }
`

class PlayerPunishment extends React.Component {
  state = { deleteConfirmShow: false, deleting: false }

  handleEdit = () => {
    const { data: { id, __typename: type }, server: { id: server } } = this.props

    Router.pushRoute(editPaths[type], { server, id })
  }
  showConfirmDelete = () => this.setState({ deleteConfirmShow: true })
  handleConfirmDelete = async () => {
    this.setState({ deleteConfirmShow: false })

    const { data, server } = this.props
    const { id: id, __typename: type } = data
    const { id: serverId } = server

    this.setState({ deleting: true })

    try {
      await this.props.mutate(
        { variables: { id, serverId, type, keepHistory: true }
        , refetchQueries: [ 'player' ]
        })
    } catch (e) {
      Alert.error('An error occurred')
    } finally {
      this.setState({ deleting: false })
    }

  }
  handleDeleteCancel = () => this.setState({ deleteConfirmShow: false })

  render() {
    const { data, server } = this.props
    let label = ''

    if (data.expires === 0) label = <Label color='red' horizontal>Permanent</Label>
    if (data.expires) label = <Label color='yellow' horizontal><Moment unix fromNow>{data.expires}</Moment></Label>
    const extraButtonsAmount = [ data.acl.yours, data.acl.update, data.acl.delete ].filter(x => x).length
    const extraButtonAmountWord = buttonWords[extraButtonsAmount]

    return (
      <Card fluid>
        <Card.Content>
          <Icon name={ icons[data.__typename] } style={{ float: 'right' }} size='large' />
          <Card.Header>{server.name}</Card.Header>
          <Card.Meta>
            {label} {data.actor.name}
          </Card.Meta>
          <Card.Description>{ data.reason || data.message }</Card.Description>
        </Card.Content>
        {!!extraButtonsAmount &&
          <Card.Content extra>
            <div className={`ui ${extraButtonAmountWord} buttons`}>
              {data.acl.yours &&
                <Button basic color='blue'>Appeal</Button>
              }
              {data.acl.update &&
                <Button basic color='green' onClick={this.handleEdit}>Edit</Button>
              }
              {data.acl.delete &&
                <Button basic color='red' loading={this.state.deleting} disabled={this.state.deleting} onClick={this.showConfirmDelete}>Delete</Button>
              }
              <Confirm
                open={this.state.deleteConfirmShow}
                onConfirm={this.handleConfirmDelete}
                onCancel={this.handleDeleteCancel}
              />
            </div>
          </Card.Content>
        }
      </Card>
    )
  }
}

export default graphql(deletePunishmentRecordMutation)(PlayerPunishment)
