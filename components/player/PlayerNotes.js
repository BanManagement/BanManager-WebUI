import { useState } from 'react'
import Link from 'next/link'
import Loader from '../Loader'
import ServerSelector from '../admin/ServerSelector'
import { useApi, useUser } from '../../utils'
import PlayerPunishment from './PlayerPunishment'
import { BiNotepad } from 'react-icons/bi'
import Button from '../Button'

const query = `
query listPlayerPunishmentRecords($serverId: ID!, $player: UUID!, $type: RecordType!) {
  listPlayerPunishmentRecords(serverId: $serverId, player: $player, type: $type) {
    total
    records {
      ... on PlayerNote {
        id
        actor {
          id
          name
        }
        created
        message
        acl {
          delete
          update
        }
      }
    }
  }
}`

export default function PlayerNotes ({ id }) {
  const { hasServerPermission } = useUser()
  const [tableState, setTableState] = useState({ type: 'PlayerNote', player: id, serverId: null })
  const { loading, data, mutate } = useApi({ query: !tableState.serverId ? null : query, variables: { ...tableState, player: id } })

  const rows = data?.listPlayerPunishmentRecords?.records || []
  const total = data?.listPlayerPunishmentRecords.total || 0
  const onDeleted = ({ deletePlayerNote: { id } }) => {
    const records = rows.filter(c => c.id !== id)

    mutate({ ...data, listPlayerPunishmentRecords: { records, total: total - 1 } }, false)
  }
  const canCreateNote = hasServerPermission('player.notes', 'create', null, true)

  return (
    <div>
      <h1
        className='pb-4 mb-4 border-b border-teal-800' id='notes'
      >
        <div className='flex items-center'>
          <p className='mr-6 text-xl font-bold '>Notes ({total})</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
        </div>
      </h1>
      <div className='relative'>
        {loading && <div className='absolute bg-black/50 h-full w-full'><Loader /></div>}
        {data?.listPlayerPunishmentRecords?.total > 0 && rows.map((row, i) => (<PlayerPunishment type='note' punishment={row} key={i} server={{ id: tableState.serverId }} onDeleted={onDeleted} />))}
      </div>
      {!data?.listPlayerPunishmentRecords?.total && (
        <div className='flex items-center'>
          <div>
            {canCreateNote &&
              <Link href={`/player/${id}/note`} passHref>
                <Button className='btn-outline'><BiNotepad className='text-teal-800 mr-1' />Add Note</Button>
              </Link>}
            {!canCreateNote && 'None'}
          </div>
        </div>
      )}
    </div>
  )
}
