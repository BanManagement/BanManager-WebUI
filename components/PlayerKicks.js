import { useEffect, useState } from 'react'
import { format, fromUnixTime } from 'date-fns'
import { BsTrash } from 'react-icons/bs'
import ErrorMessages from './ErrorMessages'
import Avatar from './Avatar'
import Modal from './Modal'
import Table from './Table'
import Loader from './Loader'
import ServerSelector from './admin/ServerSelector'
import { useApi, useMutateApi } from '../utils'

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

const PlayerKickRow = ({ row, dateFormat, serverId, onDeleted }) => {
  const [open, setOpen] = useState(false)

  const { load, data, loading, errors } = useMutateApi({
    query: `mutation deletePlayerKick($id: ID!, $serverId: ID!) {
    deletePlayerKick(id: $id, serverId: $serverId) {
      id
    }
  }`
  })
  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id: row.id, serverId: serverId })
  }
  const handleDeleteCancel = () => setOpen(false)

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  return (
    <Table.Row>
      <Table.Cell><p>{row.reason}</p></Table.Cell>
      <Table.Cell>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <Avatar uuid={row.actor.id} height='26' width='26' />
          </div>
          <div className='ml-3'>
            <p className='whitespace-no-wrap'>
              {row.actor.name}
            </p>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      <Table.Cell>
        <div className='flex items-center space-x-8'>
          {row.acl.delete &&
            <>
              <Modal
                title='Delete kick'
                confirmButton='Delete'
                open={open}
                onConfirm={handleConfirmDelete}
                onCancel={handleDeleteCancel}
                loading={loading}
              >
                <ErrorMessages errors={errors} />
                <p className='pb-1'>Are you sure you want to delete this kick?</p>
                <p className='pb-1'>This action cannot be undone</p>
              </Modal>
              <a href='#' onClick={showConfirmDelete}>
                <BsTrash className='w-6 h-6' />
              </a>
            </>}
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default function PlayerKicks ({ id, color }) {
  const [tableState, setTableState] = useState({ type: 'PlayerKick', serverId: null })
  const { loading, data, mutate } = useApi({ query: !tableState.serverId ? null : query, variables: { ...tableState, player: id } })

  if (loading) return <Loader />

  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  const rows = data?.listPlayerPunishmentRecords?.records || []
  const total = data?.listPlayerPunishmentRecords.total || 0
  const onDeleted = ({ deletePlayerKick: { id } }) => {
    const records = rows.filter(c => c.id !== id)

    mutate({ ...data, listPlayerPunishmentRecords: { records, total: total - 1 } }, false)
  }

  return (
    <div>
      <h1
        style={{ borderColor: `${color}` }}
        className='text-2xl font-bold pb-4 mb-4 border-b border-accent-200 leading-none'
      >
        <div className='flex items-center'>
          <p className='mr-6'>Kicks</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
        </div>
      </h1>
      {data?.listPlayerPunishmentRecords?.total > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Reason</Table.HeaderCell>
              <Table.HeaderCell>By</Table.HeaderCell>
              <Table.HeaderCell>At</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading
              ? <Table.Row><Table.Cell colSpan='4'><Loader /></Table.Cell></Table.Row>
              : rows.map((row, i) => (<PlayerKickRow row={row} dateFormat={dateFormat} key={i} serverId={tableState.serverId} onDeleted={onDeleted} />))}
          </Table.Body>
        </Table>
      )}
      {!data?.listPlayerPunishmentRecords?.total && (
        <div className='flex items-center'>
          <div className='bg-black w-full rounded-lg flex flex-col justify-center sm:justify-start items-center sm:items-start sm:flex-row space-x-5 p-8'>
            None
          </div>
        </div>
      )}
    </div>
  )
}
