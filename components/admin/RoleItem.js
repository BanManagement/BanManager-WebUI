import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AiOutlineWarning } from 'react-icons/ai'
import Modal from '../Modal'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function RoleItem ({ role, onDeleted }) {
  const [open, setOpen] = useState(false)
  const { load, loading, errors, data } = useMutateApi({
    query: `mutation deleteRole($id: ID!) {
        deleteRole(id: $id) {
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
    await load({ id: role.id })
  }
  const handleDeleteCancel = () => setOpen(false)

  return (
    <div className='bg-black shadow-md rounded-md overflow-hidden text-center w-80'>
      <Modal
        icon={<AiOutlineWarning className='h-6 w-6 text-red-600' aria-hidden='true' />}
        title='Delete server'
        confirmButton='Delete'
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>Are you sure you want to delete this role?</p>
        <p className='pb-1'>This action cannot be undone</p>
      </Modal>
      <Link href={`/admin/roles/${role.id}`} passHref>
        <a>
          <div className='p-5'>
            <h5 className='text-xl font-semibold mb-2'>{role.name}</h5>
          </div>
          {role.id > 3 &&
            <div className='py-3 px-5 bg-gray-900'>
              <button
                className='
                  bg-red-500
                  text-white
                  active:bg-red-600
                  font-bold
                  uppercase
                  text-xs
                  px-4
                  py-2
                  rounded
                  shadow
                  hover:shadow-md
                  outline-none
                  focus:outline-none
                  mr-1
                  mb-1
                  ease-linear
                  transition-all
                  duration-150
                '
                type='button'
                onClick={showConfirmDelete}
              >
                Delete
              </button>
            </div>}
          {role.id === '1' &&
            <div className='py-3 px-5 bg-gray-900'>
              Assigned by default to all non-logged in visitors
            </div>}
          {role.id === '2' &&
            <div className='py-3 px-5 bg-gray-900'>
              Assigned by default for all logged in players
            </div>}
          {role.id === '3' &&
            <div className='py-3 px-5 bg-gray-900'>
              Super admin role with all permissions
            </div>}
        </a>
      </Link>
    </div>
  )
}
