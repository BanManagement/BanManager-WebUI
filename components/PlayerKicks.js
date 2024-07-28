import { useState } from 'react'
import Loader from './Loader'
import ServerSelector from './admin/ServerSelector'
import { useApi } from '../utils'
import PlayerPunishment from './player/PlayerPunishment'

const query = `
query listPlayerPunishmentRecords($serverId: ID!, $player: UUID!, $type: RecordType!) {
  listPlayerPunishmentRecords(serverId: $serverId, player: $player, type: $type) {
    total
    records {
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
          update
        }
      }
    }
  }
}`

export default function PlayerKicks ({ id }) {
  const [tableState, setTableState] = useState({ type: 'PlayerKick', serverId: null })
  const { loading, data, mutate } = useApi({ query: !tableState.serverId ? null : query, variables: { ...tableState, player: id } })

  const rows = data?.listPlayerPunishmentRecords?.records || []
  const total = data?.listPlayerPunishmentRecords.total || 0
  const onDeleted = ({ deletePlayerKick: { id } }) => {
    const records = rows.filter(c => c.id !== id)

    mutate({ ...data, listPlayerPunishmentRecords: { records, total: total - 1 } }, false)
  }

  return (
    <div>
      <h1
        className='pb-4 mb-4 border-b border-primary-900' id='kicks'
      >
        <div className='flex items-center'>
          <p className='mr-6 text-xl font-bold '>Kicks</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
        </div>
      </h1>
      <div className='relative'>
        {loading && <div className='absolute bg-black/50 h-full w-full'><Loader /></div>}
        {data?.listPlayerPunishmentRecords?.total > 0 && rows.map((row, i) => (<PlayerPunishment type='kick' punishment={row} key={i} server={{ id: tableState.serverId }} onDeleted={onDeleted} />))}
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
