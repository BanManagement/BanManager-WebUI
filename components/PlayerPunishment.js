import React, { useState } from 'react'
import { Button, Card, Confirm, Icon, Label } from 'semantic-ui-react'
import { fromNow, useApi } from '../utils'

const metaMap = {
  bans: {
    icon: 'ban',
    editPath: 'ban',
    recordType: 'PlayerBan'
  },
  kicks: {
    icon: 'hand paper',
    editPath: 'kick',
    recordType: 'PlayerKick'
  },
  mutes: {
    icon: 'mute',
    editPath: 'mute',
    recordType: 'PlayerMute'
  },
  notes: {
    icon: 'sticky note outline',
    editPath: 'note',
    recordType: 'PlayerNote'
  },
  warnings: {
    icon: 'warning',
    editPath: 'warning',
    recordType: 'PlayerWarning'
  }
}
const buttonWords = { 1: 'one', 2: 'two', 3: 'three' }
const query = `
  mutation deletePunishmentRecord($id: ID!, $serverId: ID!, $type: RecordType!, $keepHistory: Boolean!) {
    deletePunishmentRecord(id: $id, serverId: $serverId, type: $type, keepHistory: $keepHistory)
  }`

export default function PlayerPunishment ({ punishment, server, type }) {
  const meta = metaMap[type]
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })

  const { load, loading } = useApi({
    query,
    variables: { id: punishment.id, serverId: server.id, type: meta.recordType, keepHistory: true }
  }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  const showConfirmDelete = () => setState({ deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load()

    if (!loading) setState({ deleting: false })
  }
  const handleDeleteCancel = () => setState({ deleteConfirmShow: false })

  let label = ''

  if (punishment.expires === 0) label = <Label color='red' horizontal>Permanent</Label>
  if (punishment.expires) label = <Label color='yellow' horizontal>{fromNow(punishment.expires)}</Label>
  const extraButtonsAmount = [punishment.acl.yours, punishment.acl.update, punishment.acl.delete].filter(x => x).length
  const extraButtonAmountWord = buttonWords[extraButtonsAmount]

  return (
    <Card fluid>
      <Card.Content>
        <Icon name={meta.icon} style={{ float: 'right' }} size='large' />
        <Card.Header>{server.name}</Card.Header>
        <Card.Meta>
          {label} {punishment.actor.name}
        </Card.Meta>
        <Card.Description>{punishment.reason || punishment.message}</Card.Description>
      </Card.Content>
      {!!extraButtonsAmount &&
        <Card.Content extra>
          <div className={`ui ${extraButtonAmountWord} buttons`}>
            {punishment.acl.yours &&
              <Button
                basic
                color='blue'
                href={`/appeal/${server.id}/${punishment.id}/${meta.editPath.replace('edit-', '')}`}
              >
                Appeal
              </Button>}
            {punishment.acl.update &&
              <Button
                basic
                color='green'
                href={`/player/${meta.editPath}/${server.id}-${punishment.id}`}
              >Edit
              </Button>}
            {punishment.acl.delete &&
              <Button
                basic
                color='red'
                loading={state.deleting}
                disabled={state.deleting}
                onClick={showConfirmDelete}
              >
                Delete
              </Button>}
            <Confirm
              open={state.deleteConfirmShow}
              onConfirm={handleConfirmDelete}
              onCancel={handleDeleteCancel}
            />
          </div>
        </Card.Content>}
    </Card>
  )
}
