import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaPencilAlt } from 'react-icons/fa'
import { GoReport } from 'react-icons/go'
import { BsTrash } from 'react-icons/bs'
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
    <div className='w-full max-w-md border border-primary-900 rounded-3xl p-4 mb-2'>
      <div className='w-full flex flex-row items-center gap-4'>
        <Avatar uuid={punishment.actor.id} height='40' width='40' />
        <div className='flex flex-col text-left'>
          <span>{punishment.actor.name}</span>
          <span className='text-sm text-gray-400'>{formatTimestamp(punishment.created)}</span>
          <div className='text-sm text-gray-400 flex items-center gap-4'>
            <div className='flex items-center gap-1'>
              <BiServer />
              <span className='truncate'>{punishment.server.name}</span>
            </div>
          </div>
        </div>
        {<div className='ml-auto self-start'>
          {label}
        </div>}
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
          <p>{punishment.reason || punishment.message}</p>
        </div>
      </div>
          {/* <div className='flex flex-col sm:flex-row md:space-x-5 text-center'>
            <h1 className='font-bold'>{punishment.actor.name}</h1>
            {label}
          </div>
          <div className='text-gray-300'>
            <p>{server.name}</p>
            <p>{format(fromUnixTime(punishment.created), dateFormat)}</p>
          </div>
          <div className='text-justify sm:text-left py-6'>
            <p>{punishment.reason || punishment.message}</p>
          </div>
          <div>
            <ul className='flex justify-between mr-5 mt-2'>
              {punishment.acl.update &&
                <li className='hover:text-accent-700'>
                  <Link href={`/player/${meta.editPath}/${server.id}-${punishment.id}`} passHref>

                    <FaPencilAlt className='w-6 h-6' />

                  </Link>
                </li>}
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
                  <li className='hover:text-accent-700'>
                    <a href='#' onClick={showConfirmDelete}>
                      <BsTrash className='w-6 h-6' />
                    </a>
                  </li>
                </>}
            </ul>
          </div>
          {punishment.acl.yours &&
            <Link href={`/appeal/punishment/${server.id}/${meta.editPath.replace('edit-', '')}/${punishment.id}`} passHref>
              <Button className='bg-blue-600 hover:bg-blue-900 mt-4'>
                Appeal
              </Button>
            </Link>} */}
        </div>
  )
}
