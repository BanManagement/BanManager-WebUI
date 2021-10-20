import { useEffect, useState } from 'react'
import { Button, Card, Confirm, Label } from 'semantic-ui-react'
import { format, fromUnixTime } from 'date-fns'
import { fromNow, useMutateApi } from '../utils'
import ErrorMessages from './ErrorMessages'

const metaMap = {
  ban: {
    editPath: 'ban',
    recordType: 'PlayerBan',
    deleteMutation: `mutation deletePlayerBan($id: ID!, $serverId: ID!) {
      deletePlayerBan(id: $id, serverId: $serverId) {
        id
      }
    }`
  },
  kick: {
    editPath: 'kick',
    recordType: 'PlayerKick'
  },
  mute: {
    editPath: 'mute',
    recordType: 'PlayerMute',
    deleteMutation: `mutation deletePlayerMute($id: ID!, $serverId: ID!) {
      deletePlayerMute(id: $id, serverId: $serverId) {
        id
      }
    }`
  },
  note: {
    editPath: 'note',
    recordType: 'PlayerNote',
    deleteMutation: `mutation deletePlayerNote($id: ID!, $serverId: ID!) {
      deletePlayerNote(id: $id, serverId: $serverId) {
        id
      }
    }`
  },
  warning: {
    editPath: 'warning',
    recordType: 'PlayerWarning',
    deleteMutation: `mutation deletePlayerWarning($id: ID!, $serverId: ID!) {
      deletePlayerWarning(id: $id, serverId: $serverId) {
        id
      }
    }`
  }
}
const buttonWords = { 1: 'one', 2: 'two', 3: 'three' }

export default function PlayerPunishment ({ punishment, server, type, onDeleted }) {
  const meta = metaMap[type]
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })

  const { load, data, loading, errors } = useMutateApi({ query: meta.deleteMutation })

  const showConfirmDelete = () => setState({ ...state, deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load({ id: punishment.id, serverId: server.id })

    if (!loading) setState({ ...state, deleting: false })
  }
  const handleDeleteCancel = () => setState({ ...state, deleteConfirmShow: false })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      onDeleted(data)
    }
  }, [data])

  let label = ''

  if (punishment.expires === 0) label = <Label style={{ float: 'right' }} color='red' horizontal>Permanent</Label>
  if (punishment.expires) label = <Label style={{ float: 'right' }} color='yellow' horizontal>{fromNow(punishment.expires)}</Label>

  const extraButtonsAmount = [punishment.acl.yours, punishment.acl.update, punishment.acl.delete].filter(x => x).length
  const extraButtonAmountWord = buttonWords[extraButtonsAmount]
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>{punishment.actor.name} {label}</Card.Header>
        <Card.Meta>{server.name} {format(fromUnixTime(punishment.created), dateFormat)}</Card.Meta>
        <Card.Description>{punishment.reason || punishment.message}</Card.Description>
      </Card.Content>
      {!!extraButtonsAmount &&
        <Card.Content extra>
          <div className={`ui ${extraButtonAmountWord} buttons`}>
            {punishment.acl.yours &&
              <Button
                basic
                color='blue'
                href={`/player/appeal/${server.id}-${punishment.id}/${meta.editPath.replace('edit-', '')}`}
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
              header={`Delete ${type}?`}
              content={errors ? <ErrorMessages errors={errors} /> : 'Are you sure?'}
            />
          </div>
        </Card.Content>}
    </Card>
  )
}
