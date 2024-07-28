import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaPencilAlt } from 'react-icons/fa'
import { GoReport } from 'react-icons/go'
import { BsTrash } from 'react-icons/bs'
import { TiTick } from 'react-icons/ti'
import { RiNumbersLine } from 'react-icons/ri'
import Badge from '../Badge'
import PermanentBadge from './PermanentBadge'
import ErrorMessages from '../ErrorMessages'
import Avatar from '../Avatar'
import Modal from '../Modal'
import Button from '../Button'
import { formatTimestamp, useMutateApi } from '../../utils'
import { BiServer } from 'react-icons/bi'
import { TimeFromNow } from '../Time'

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
    deleteMutation: `mutation deletePlayerKick($id: ID!, $serverId: ID!) {
      deletePlayerKick(id: $id, serverId: $serverId) {
        id
      }
    }`
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

export default function PlayerPunishment ({ punishment, server, type, onDeleted }) {
  const meta = metaMap[type]
  const [open, setOpen] = useState(false)

  const { load, data, loading, errors } = useMutateApi({ query: meta.deleteMutation })

  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id: punishment.id, serverId: server.id })
  }
  const handleDeleteCancel = () => setOpen(false)

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  let label = ''

  if (punishment.expires === 0) label = <PermanentBadge />
  if (punishment.expires) label = <Badge className='border border-primary-900 py-0 px-1 flex text-sm truncate'><TimeFromNow timestamp={punishment.expires} /></Badge>

  return (
    <div className='w-full border border-primary-900 rounded-3xl p-4 mb-2'>
      <div className='w-full flex flex-row items-center gap-4'>
        <Link href={`/player/${punishment.actor.id}`}><Avatar uuid={punishment.actor.id} height='40' width='40' /></Link>
        <div className='flex flex-col text-left'>
          <Link href={`/player/${punishment.actor.id}`}><span>{punishment.actor.name}</span></Link>
          <span className='text-sm text-gray-400'>{formatTimestamp(punishment.created)}</span>
          {server?.name &&
            <div className='text-sm text-gray-400 flex items-center gap-4'>
              <div className='flex items-center gap-1'>
                <BiServer />
                <span className='truncate'>{server.name}</span>
              </div>
            </div>}
          {punishment.points &&
            <div className='text-sm text-gray-400 flex items-center gap-4'>
              <div className='flex items-center gap-1'>
                <RiNumbersLine />
                <span className='truncate'>{punishment.points}</span>
              </div>
            </div>}
        </div>
        <div className='ml-auto self-start flex flex-col justify-center items-center gap-2'>
          {label}
          {punishment.read && <TiTick className='text-green-500' title='Read' />}
        </div>
      </div>
      <div className='flex flex-col'>
        <div className='flex gap-4'>
          {punishment.acl.update &&
            <Link href={`/player/${meta.editPath}/${server.id}-${punishment.id}`} passHref>
              <Button className='mt-4'><FaPencilAlt className='text-sm' /></Button>
            </Link>}
          {punishment.acl.delete &&
            <>
              <Modal
                title={`Delete ${type}`}
                confirmButton='Delete'
                open={open}
                onConfirm={handleConfirmDelete}
                onCancel={handleDeleteCancel}
                loading={loading}
              >
                <ErrorMessages errors={errors} />
                <p className='pb-1'>Are you sure you want to delete this {type}?</p>
                <p className='pb-1'>This action cannot be undone</p>
              </Modal>
              <div>
                <Button className='mt-4 bg-red-800' onClick={showConfirmDelete}>
                  <BsTrash className='text-sm' />
                </Button>
              </div>
            </>}
          {punishment.acl.yours &&
            <Link href={`/appeal/punishment/${punishment.server.id}/${type}/${punishment.id}/`} className='ml-auto' title='Appeal'>
              <Button className='bg-emerald-800 mt-4'><GoReport className='text-sm' /></Button>
            </Link>}
        </div>
        <div className='mt-4'>
          <p className='break-words'>{punishment.reason || punishment.message}</p>
        </div>
      </div>
    </div>
  )
}
