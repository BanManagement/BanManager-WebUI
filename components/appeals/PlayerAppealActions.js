import { useUser } from '../../utils'
import PlayerAppealActionDelete from './actions/PlayerAppealActionDelete'
import PlayerAppealActionUpdate from './actions/PlayerAppealActionUpdate'

const createDeleteQuery = (mutation) => `mutation ${mutation}($id: ID!) {
  ${mutation}(id: $id) {
    appeal {
      state {
        id
        name
      }
      updated
    }
    comment {
      id
      type
      content
      created
      actor {
        id
        name
      }
      assignee {
        id
        name
      }
      state {
        id
        name
      }
      acl {
        delete
      }
    }
  }
}`
const createUpdateQuery = (mutation, input) => `mutation ${mutation}($id: ID!, $input: ${input}!) {
  ${mutation}(id: $id, input: $input) {
    appeal {
      state {
        id
        name
      }
      updated
    }
    comment {
      id
      type
      content
      created
      oldReason
      newReason
      oldExpires
      newExpires
      actor {
        id
        name
      }
      assignee {
        id
        name
      }
      state {
        id
        name
      }
      acl {
        delete
      }
    }
  }
}`

export default function PlayerAppealActions ({ appeal, server, onAction }) {
  const { user, hasServerPermission } = useUser()

  switch (appeal.punishmentType) {
    case 'PlayerBan': {
      const canDelete = hasServerPermission('player.bans', 'delete.any', server.id) ||
        (hasServerPermission('player.bans', 'delete.own', server.id) && user.id === appeal.punishmentActor.id)
      const canUpdate = hasServerPermission('player.bans', 'update.any', server.id) ||
       (hasServerPermission('player.bans', 'update.own', server.id) && user.id === appeal.punishmentActor.id)

      return (
        <div className='flex flex-col gap-6'>
          {canUpdate &&
            <PlayerAppealActionUpdate
              appeal={appeal}
              title='Edit Ban'
              type='ban'
              query={createUpdateQuery('resolveAppealUpdateBan', 'UpdatePlayerBanInput')}
              onUpdated={onAction}
            />}
          {canDelete &&
            <PlayerAppealActionDelete
              appeal={appeal}
              title='Unban'
              type='ban'
              query={createDeleteQuery('resolveAppealDeleteBan')}
              onDeleted={data => onAction(data.resolveAppealDeleteBan)}
            />}
        </div>
      )
    }
    case 'PlayerMute': {
      const canDelete = hasServerPermission('player.mutes', 'delete.any', server.id) ||
        (hasServerPermission('player.mutes', 'delete.own', server.id) && user.id === appeal.punishmentActor.id)
      const canUpdate = hasServerPermission('player.mutes', 'update.any', server.id) ||
       (hasServerPermission('player.mutes', 'update.own', server.id) && user.id === appeal.punishmentActor.id)

      return (
        <div className='flex flex-col gap-6'>
          {canUpdate &&
            <PlayerAppealActionUpdate
              appeal={appeal}
              title='Edit Mute'
              type='mute'
              query={createUpdateQuery('resolveAppealUpdateMute', 'UpdatePlayerMuteInput')}
              onUpdated={onAction}
            />}
          {canDelete &&
            <PlayerAppealActionDelete
              appeal={appeal}
              title='Unmute'
              type='mute'
              query={createDeleteQuery('resolveAppealDeleteMute')}
              onDeleted={data => onAction(data.resolveAppealDeleteMute)}
            />}
        </div>
      )
    }
    case 'PlayerWarning':
      return null
  }

  return null
}
