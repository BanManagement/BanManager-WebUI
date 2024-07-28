import { useState } from 'react'
import Loader from '../Loader'
import ServerSelector from '../admin/ServerSelector'
import { useApi } from '../../utils'
import PastPlayerPunishment from './PastPlayerPunishment'

const query = `
query listPlayerPunishmentRecords($serverId: ID!, $player: UUID!, $type: RecordType!) {
  listPlayerPunishmentRecords(serverId: $serverId, player: $player, type: $type) {
    total
    records {
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
        expired
        createdReason
        reason
        soft
        acl {
          delete
        }
      }
    }
  }
}`

export default function PlayerMutes ({ id }) {
  const [tableState, setTableState] = useState({ type: 'PlayerMuteRecord', serverId: null })
  const { loading, data, mutate } = useApi({ query: !tableState.serverId ? null : query, variables: { ...tableState, player: id } })

  const rows = data?.listPlayerPunishmentRecords?.records || []
  const total = data?.listPlayerPunishmentRecords?.total || 0
  const onDeleted = ({ deletePlayerMuteRecord: { id } }) => {
    const records = rows.filter(c => c.id !== id)

    mutate({ ...data, listPlayerPunishmentRecords: { records, total: total - 1 } }, false)
  }

  return (
    <div>
      <h1
        className='pb-4 mb-4 border-b border-indigo-800' id='mutes'
      >
        <div className='flex items-center'>
          <p className='mr-6 text-xl font-bold '>Past Mutes</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
        </div>
      </h1>
      <div className='relative'>
        {loading && <div className='absolute bg-black/50 h-full w-full'><Loader /></div>}
        {data?.listPlayerPunishmentRecords?.total > 0 && rows.map((row, i) => (<PastPlayerPunishment type='mute' punishment={row} key={i} serverId={tableState.serverId} onDeleted={onDeleted} />))}
      </div>
      {!data?.listPlayerPunishmentRecords?.total && (
        <div className='flex items-center'>
          <div>
            None
          </div>
        </div>
      )}
    </div>
  )
}
