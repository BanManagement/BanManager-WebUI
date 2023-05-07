import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AiOutlineWarning } from 'react-icons/ai'
import { BiServer } from 'react-icons/bi'
import { MdOutlineGroups } from 'react-icons/md'
import { FaPencilAlt } from 'react-icons/fa'
import { BsTrash } from 'react-icons/bs'
import Button from '../../Button'
import { TimeFromNow } from '../../Time'
import Modal from '../../Modal'
import { useMutateApi } from '../../../utils'
import ErrorMessages from '../../ErrorMessages'

export default function NotificationRuleItem ({ row, onDeleted }) {
  const [open, setOpen] = useState(false)
  const { load, loading, errors, data } = useMutateApi({
    query: `mutation deleteNotificationRule($id: ID!) {
        deleteNotificationRule(id: $id) {
          id
        }
      }`
  })
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key])) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id: row.id })
  }
  const handleDeleteCancel = () => setOpen(false)

  return (
    <div className='hover:bg-gray-900 group border-b border-gray-700'>
      <Modal
        icon={<AiOutlineWarning className='h-6 w-6 text-red-600' aria-hidden='true' />}
        title='Delete notification rule'
        confirmButton='Delete'
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>Are you sure you want to delete this notification rule?</p>
        <p className='pb-1'>This action cannot be undone</p>
      </Modal>
      <div className='flex py-2'>
        <div className='flex-auto flex-wrap space-y-2 pl-3 py-2'>
          <div>
            {row.type}
          </div>
          <div className='flex flex-auto flex-row space-x-2 py-2'>
            <MdOutlineGroups className='self-center' />
            {row.roles.map(role =>
              <div key={`role-${role.id}`}>
                <Link href={`/admin/roles/${role.id}`} className='underline'>{role.name}</Link>
              </div>
            )}
          </div>
          {!!row?.server?.id &&
            <div className='flex break-words justify-between text-sm'>
              <div className='flex justify-between gap-2'>
                <BiServer className='self-center' /> <Link href={`/admin/server/${row?.server?.id}`} className='underline'>{row?.server?.name}</Link>
              </div>
            </div>}
        </div>
        <div className='flex flex-col justify-center pl-3 mt-1 mr-2'>
          <div className='group-hover:hidden'>
            <TimeFromNow timestamp={row.updated} />
          </div>
          <div className='hidden group-hover:flex group-hover:gap-5'>
            <Link href={`/admin/notification-rules/${row.id}`} passHref>

              <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><FaPencilAlt /></Button>

            </Link>
            <Button className='bg-red-600 hover:bg-red-700 text-sm px-4 py-2' onClick={showConfirmDelete}><BsTrash /></Button>
          </div>
        </div>
      </div>
      <div className='flex flex-row gap-6 md:hidden mb-2'>
        <div>
          <Link href={`/admin/notification-rules/${row.id}`} passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><FaPencilAlt /> Edit</Button>

          </Link>
        </div>
        <div>
          <Button className='bg-red-600 hover:bg-red-700 text-sm px-4 py-2' onClick={showConfirmDelete}><BsTrash /> Delete</Button>
        </div>
      </div>
    </div>
  )
}
