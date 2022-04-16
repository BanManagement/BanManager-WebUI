import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import { FaPencilAlt } from 'react-icons/fa'
import { BsTrash } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import Badge from './Badge'
import ErrorMessages from './ErrorMessages'
import Avatar from './Avatar'
import Modal from './Modal'
import Button from './Button'
import { fromNow, useMutateApi } from '../utils'

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

  if (punishment.expires === 0) label = <Badge className='bg-red-500 sm:mx-auto'>Permanent</Badge>
  if (punishment.expires) label = <Badge className='bg-amber-500 sm:mx-auto'>{fromNow(punishment.expires)}</Badge>

  const dateFormat = 'yyyy-MM-dd HH:mm:ss'

  return (
    <div className='flex items-center'>
      <div className='bg-black w-full rounded-lg flex flex-col justify-center sm:justify-start items-center sm:items-start sm:flex-row space-x-5 p-8'>
        <div className=''>
          <Avatar uuid={punishment.actor.id} height='40' width='40' />
        </div>
        <div className=''>
          <div className='flex flex-col sm:flex-row md:space-x-5 text-center'>
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
                    <a>
                      <FaPencilAlt className='w-6 h-6' />
                    </a>
                  </Link>
                </li>}
              {punishment.acl.delete &&
                <>
                  <Modal
                    icon={<AiOutlineWarning className='h-6 w-6 text-red-600' aria-hidden='true' />}
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
            <Link href={`/player/appeal/${server.id}/${punishment.id}/${meta.editPath.replace('edit-', '')}`} passHref>
              <a>
                <Button className='bg-blue-600 hover:bg-blue-900 mt-4'>
                  Appeal
                </Button>
              </a>
            </Link>}
        </div>
      </div>
    </div>
  )
}
